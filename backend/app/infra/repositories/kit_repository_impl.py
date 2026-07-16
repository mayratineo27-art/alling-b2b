from typing import List, Optional
from uuid import UUID
from sqlmodel import Session, select
from app.domain.kit import Kit, KitComponent
from app.domain.repositories.kit_repository import IKitRepository
from app.models.kit import KitModel, KitComponentLink

class KitRepositoryImpl(IKitRepository):
    def __init__(self, session: Session):
        self.session = session

    def _to_domain(self, kit_model: KitModel) -> Kit:
        # Get components for this kit
        links = self.session.exec(
            select(KitComponentLink).where(KitComponentLink.kit_id == kit_model.id)
        ).all()
        
        components = [
            KitComponent(product_id=link.product_id, quantity=link.quantity)
            for link in links
        ]
        
        kit = Kit(
            id=kit_model.id, 
            name=kit_model.name, 
            components=components,
            description=kit_model.description,
            image_url=kit_model.image_url
        )
        return kit

    def get_by_id(self, id: UUID) -> Optional[Kit]:
        kit_model = self.session.get(KitModel, id)
        if not kit_model or not kit_model.is_active:
            return None
        return self._to_domain(kit_model)

    def list_all(self) -> List[Kit]:
        stmt = select(KitModel).where(KitModel.is_active == True)
        models = self.session.exec(stmt).all()
        return [self._to_domain(model) for model in models]

    def add(self, kit: Kit) -> None:
        kit_model = self.session.get(KitModel, kit.id)
        if not kit_model:
            kit_model = KitModel(
                id=kit.id,
                name=kit.name,
                description=kit.description,
                image_url=kit.image_url,
                is_active=True
            )
            self.session.add(kit_model)
        else:
            kit_model.name = kit.name
            kit_model.description = kit.description
            kit_model.image_url = kit.image_url
            self.session.add(kit_model)

        existing_links = self.session.exec(
            select(KitComponentLink).where(KitComponentLink.kit_id == kit.id)
        ).all()
        for link in existing_links:
            self.session.delete(link)

        for comp in kit.components:
            link = KitComponentLink(
                kit_id=kit.id,
                product_id=comp.product_id,
                quantity=comp.quantity
            )
            self.session.add(link)
        self.session.commit()
