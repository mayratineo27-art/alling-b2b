from uuid import UUID
import hashlib
from app.schemas.checkout import CheckoutRequestSchema, CheckoutResponseSchema
from app.services.shipping_service import ShippingService
from app.services.payment_service import PaymentService
from app.domain.repositories.formato_unico_repository import IFormatoUnicoRepository
from app.domain.formato_unico import FormatoUnicoState
from app.domain.exceptions import DomainException

class CheckoutService:
    # In-memory idempotency store (deliberately a CLASS attribute, not
    # instance-level): antes CheckoutService era un singleton a nivel de
    # módulo (checkout.py), así que este dict sobrevivía entre requests "gratis".
    # Al pasar a construir una instancia nueva por request (necesario para no
    # atar una Session de BD de un único request a la vida entera del
    # proceso), un dict de instancia se reseteaba en cada llamada — el
    # segundo POST idéntico (protección anti doble-click) ya no encontraba
    # la respuesta cacheada y reprocesaba el checkout sobre un FU que ya
    # había pasado a PEDIDO, fallando con 409 en vez de responder 200.
    _idempotency_store: dict[str, "CheckoutResponseSchema"] = {}

    def __init__(
        self,
        fu_repo: IFormatoUnicoRepository,
        shipping_service: ShippingService,
        payment_service: PaymentService
    ):
        self.fu_repo = fu_repo
        self.shipping_service = shipping_service
        self.payment_service = payment_service
        
    def process_checkout(self, request: CheckoutRequestSchema, current_user_id: str | None = None, db=None) -> CheckoutResponseSchema:
        # 1. Idempotencia basada en el ID del FU y los datos
        # Un hash simple de request.fu_id
        idempotency_key = hashlib.sha256(str(request.fu_id).encode()).hexdigest()
        
        if idempotency_key in self._idempotency_store:
            return self._idempotency_store[idempotency_key]

        # 2. Validar estado del FU
        fu = self.fu_repo.get_by_id(request.fu_id)
        if not fu:
            raise DomainException(message="Formato Único no encontrado", status_code=404)
            
        if current_user_id and fu.customer_id and str(fu.customer_id) != current_user_id:
            raise DomainException(message="No tienes permiso para acceder a este Formato Único", status_code=403)
            
        # FU-T-04 (BORRADOR→PEDIDO, sin cotización previa) y FU-T-09
        # (COTIZACION→PEDIDO) son ambos caminos válidos hacia checkout, para
        # GUEST o CUSTOMER (OPS-FU-006). Solo GUEST usa este atajo en la UI
        # actual, pero la regla de negocio no distingue por actor.
        if fu.state not in (FormatoUnicoState.BORRADOR, FormatoUnicoState.COTIZACION):
            raise DomainException(message=f"El Formato Único debe estar en BORRADOR o COTIZACION para iniciar el pago. Estado actual: {fu.state.value}", status_code=409)
            
        # 3. Obtener cotización de envío
        shipping_cost = self.shipping_service.calculate_shipping(request.address)
        total = fu.subtotal + shipping_cost

        # Token opaco de la orden (RF-CHK-006/RN-CHK-007): identifica la
        # confirmación tanto para GUEST (único mecanismo de acceso) como para
        # CUSTOMER (además de su sesión, para armar la URL de retorno de MP).
        from app.services.token_service import TokenService
        order_token = TokenService.generate_order_token()
        if not fu.customer_id:
            fu.order_token = order_token

        # 4. Iniciar pago y reservar stock
        payment_url = self.payment_service.crear_preferencia_pago(fu.id, total, order_token)

        # Transicionar a PEDIDO
        fu.state = FormatoUnicoState.PEDIDO

        self.fu_repo.save(fu)

        # IMPORTANTE: Aquí se debe llamar a InventoryService.reservar_stock.
        # Por cuestiones de dependencias cíclicas en el mock, si no está inyectado,
        # asumimos que lo hace o lo inyectamos:
        # self.inventory_service.reservar_stock(fu.id)

        # OPS-FU-006 / OPS-CHK-001: crear el Order real en PENDING_PAYMENT.
        # Sin esto, /orders y /orders/{id} nunca tenían nada que mostrar.
        if db is not None:
            from app.models.order import Order, OrderStatus
            from app.models.formato_unico import FormatoUnico as FormatoUnicoModel

            # Order.formato_unico_id tiene FK a la tabla real "formato_unico".
            # En modo mock (USE_MOCK_DB=True) el FU vive solo en memoria y
            # nunca se persiste ahí, así que sin este espejo mínimo el INSERT
            # de Order siempre fallaba por violación de FK. customer_id solo
            # se replica si ya existe como User real (evita otra FK rota
            # cuando el JWT de CUSTOMER referencia un id que no está en BD).
            fu_model = db.query(FormatoUnicoModel).filter(FormatoUnicoModel.id == str(fu.id)).first()
            fu_customer_id = None
            if fu.customer_id:
                from app.models.user import User
                if db.query(User).filter(User.id == str(fu.customer_id)).first():
                    fu_customer_id = str(fu.customer_id)

            if fu_model is None:
                fu_model = FormatoUnicoModel(
                    id=str(fu.id),
                    customer_id=fu_customer_id,
                    state=fu.state.value,
                    order_token=fu.order_token,
                    subtotal=fu.subtotal,
                )
                db.add(fu_model)
            else:
                fu_model.state = fu.state.value
                fu_model.order_token = fu.order_token
                fu_model.subtotal = fu.subtotal
            db.flush()

            order = Order(
                formato_unico_id=str(fu.id),
                status=OrderStatus.PENDING_PAYMENT,
                shipping_address=request.address,
                dni_or_ruc=request.billing_id,
                shipping_cost=float(shipping_cost),
                total_amount=float(total),
                payment_preference_id=idempotency_key,
                order_token=order_token,
            )
            db.add(order)
            db.commit()

        # 5. Generar respuesta y guardarla para idempotencia
        response = CheckoutResponseSchema(
            fu_id=str(fu.id),
            payment_url=payment_url,
            shipping_cost=f"{shipping_cost:.2f}",
            idempotency_key=idempotency_key,
            order_token=order_token
        )
        
        self._idempotency_store[idempotency_key] = response
        
        return response
