from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from app.domain.formato_unico import FormatoUnico, FormatoUnicoItem, FormatoUnicoState
from app.domain.repositories.formato_unico_repository import IFormatoUnicoRepository
from app.models.formato_unico import FormatoUnico as FormatoUnicoModel
from app.models.formato_unico_item import FormatoUnicoItem as FormatoUnicoItemModel


ACTIVE_STATES = {
    FormatoUnicoState.BORRADOR,
    FormatoUnicoState.APROBADO,
    FormatoUnicoState.COTIZACION,
    FormatoUnicoState.CONSULTA,
}


class SupabaseFormatoRepository(IFormatoUnicoRepository):
    """Persistencia real del Formato Único sobre PostgreSQL vía SQLAlchemy/SQLModel.

    Recibe la sesión inyectada (mismo patrón que ProductRepositoryImpl) en vez
    de abrir su propia Session(engine) por método: antes usaba directamente el
    `engine` global de app.db.database, ignorando por completo el override de
    sesión que los tests instalan sobre get_session/get_db — cualquier test
    que instanciara este repositorio escribía silenciosamente en la base de
    datos real de producción en vez de la BD de pruebas aislada.
    """

    def __init__(self, session: Session):
        self.session = session

    def _to_domain(self, formato: FormatoUnicoModel) -> FormatoUnico:
        items = [
            FormatoUnicoItem(
                product_id=UUID(item.product_id),
                quantity=int(item.quantity),
                unit_price=Decimal(str(item.price_at_time or 0)),
            )
            for item in sorted(
                formato.items,
                key=lambda item: item.created_at.timestamp() if item.created_at else -1.0,
            )
        ]

        return FormatoUnico(
            id=UUID(formato.id),
            customer_id=UUID(formato.customer_id) if formato.customer_id else None,
            order_token=formato.order_token,
            assigned_seller_id=formato.assigned_seller_id,
            consultant_note=formato.consultant_note,
            pdf_url=formato.pdf_url,
            state=FormatoUnicoState(formato.state),
            items=items,
            subtotal=Decimal(str(formato.subtotal or 0)),
            discount_percent=Decimal(str(getattr(formato, 'discount_percent', 0) or 0)),
            # Antes no se mapeaba: cada FU cargado desde Postgres quedaba con
            # el default del dataclass (datetime.utcnow() al momento del
            # load), no con su verdadero último cambio — silenciosamente
            # rompía cualquier lógica que dependiera de updated_at real.
            updated_at=formato.updated_at or formato.created_at or datetime.now(timezone.utc),
        )

    def _sync_items(self, formato_model: FormatoUnicoModel, formato: FormatoUnico) -> None:
        formato_model.items.clear()
        for item in formato.items:
            formato_model.items.append(
                FormatoUnicoItemModel(
                    product_id=str(item.product_id),
                    quantity=item.quantity,
                    price_at_time=item.unit_price,
                )
            )

    def save(self, formato: FormatoUnico) -> None:
        stmt = select(FormatoUnicoModel).where(FormatoUnicoModel.id == str(formato.id)).options(
            selectinload(FormatoUnicoModel.items)
        )
        formato_model = self.session.exec(stmt).first()

        if not formato_model:
            formato_model = FormatoUnicoModel(id=str(formato.id))
            self.session.add(formato_model)

        formato_model.customer_id = str(formato.customer_id) if formato.customer_id else None
        formato_model.state = formato.state.value
        formato_model.order_token = formato.order_token
        formato_model.assigned_seller_id = formato.assigned_seller_id
        formato_model.consultant_note = formato.consultant_note
        formato_model.pdf_url = formato.pdf_url
        formato_model.subtotal = formato.subtotal
        formato_model.discount_percent = formato.discount_percent
        # Antes se confiaba en onupdate=func.now() de la columna, que no se
        # dispara en el INSERT (queda NULL) y solo actualiza si SQLAlchemy
        # detecta un cambio "dirty" — nada garantizaba que reflejara el
        # updated_at que el servicio de dominio ya calculó explícitamente
        # (crítico para el Patrón de Clonación: resolver el borrador activo
        # depende de comparar updated_at reales).
        formato_model.updated_at = formato.updated_at
        self._sync_items(formato_model, formato)

        self.session.add(formato_model)
        self.session.commit()
        self.session.refresh(formato_model)

    def get_by_id(self, formato_id: UUID) -> Optional[FormatoUnico]:
        stmt = select(FormatoUnicoModel).where(FormatoUnicoModel.id == str(formato_id)).options(
            selectinload(FormatoUnicoModel.items)
        )
        formato_model = self.session.exec(stmt).first()
        return self._to_domain(formato_model) if formato_model else None

    def list_all(self, customer_id: UUID, skip: int = 0, limit: int = 10) -> list[FormatoUnico]:
        stmt = (
            select(FormatoUnicoModel)
            .where(FormatoUnicoModel.customer_id == str(customer_id))
            .order_by(FormatoUnicoModel.created_at.desc())
            .offset(skip)
            .limit(limit)
            .options(selectinload(FormatoUnicoModel.items))
        )
        formatos = self.session.exec(stmt).all()
        return [self._to_domain(formato) for formato in formatos]

    def get_by_order_token(self, order_token: str) -> Optional[FormatoUnico]:
        stmt = (
            select(FormatoUnicoModel)
            .where(
                FormatoUnicoModel.order_token == order_token,
                FormatoUnicoModel.customer_id.is_(None),
                FormatoUnicoModel.state.in_([state.value for state in ACTIVE_STATES]),
            )
            .options(selectinload(FormatoUnicoModel.items))
        )
        formato_model = self.session.exec(stmt).first()
        return self._to_domain(formato_model) if formato_model else None

    def get_active_by_customer_id(self, customer_id: UUID) -> Optional[FormatoUnico]:
        """RNF-SEC-002 / RN-FU-09: mismo criterio que
        InMemoryFormatoRepository — con el Patrón de Clonación, un CUSTOMER
        puede tener varios FU en estado activo simultáneos (el borrador
        vigente + huérfanos históricos). Antes ordenaba por `created_at`,
        que siempre favorece a la cotización recién clonada (registro
        nuevo) sobre el borrador reseteado (registro preexistente) —
        reintroducía el bug "ya no puedo comprar otra cosa tras cotizar".
        Se resuelve por `updated_at` más reciente, igual que en memoria.
        """
        stmt = (
            select(FormatoUnicoModel)
            .where(
                FormatoUnicoModel.customer_id == str(customer_id),
                FormatoUnicoModel.state.in_([state.value for state in ACTIVE_STATES]),
            )
            .order_by(FormatoUnicoModel.updated_at.desc())
            .options(selectinload(FormatoUnicoModel.items))
        )
        formato_model = self.session.exec(stmt).first()
        return self._to_domain(formato_model) if formato_model else None

    def list_by_states(self, states: list[FormatoUnicoState], skip: int = 0, limit: int = 100) -> list[FormatoUnico]:
        stmt = (
            select(FormatoUnicoModel)
            .where(FormatoUnicoModel.state.in_([state.value for state in states]))
            .order_by(FormatoUnicoModel.updated_at.desc())
            .offset(skip)
            .limit(limit)
            .options(selectinload(FormatoUnicoModel.items))
        )
        formatos = self.session.exec(stmt).all()
        return [self._to_domain(formato) for formato in formatos]
