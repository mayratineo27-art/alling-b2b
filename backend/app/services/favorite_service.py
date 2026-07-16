from typing import List
from sqlmodel import Session, select
from app.models.favorite import FavoriteModel
from app.core.config import settings

class FavoriteService:
    def __init__(self):
        # mock dict {user_id_str: list_of_product_id_str}
        self._store = {}
        
    def add_favorite(self, db: Session, user_id: str, product_id: str) -> None:
        if settings.USE_MOCK_DB:
            if user_id not in self._store:
                self._store[user_id] = set()
            self._store[user_id].add(product_id)
        else:
            # Check if already exists in DB to prevent duplicates
            stmt = select(FavoriteModel).where(
                FavoriteModel.user_id == user_id,
                FavoriteModel.product_id == product_id
            )
            existing = db.scalars(stmt).first()
            if not existing:
                fav = FavoriteModel(user_id=user_id, product_id=product_id)
                db.add(fav)
                db.commit()
                
    def remove_favorite(self, db: Session, user_id: str, product_id: str) -> None:
        if settings.USE_MOCK_DB:
            if user_id in self._store:
                self._store[user_id].discard(product_id)
        else:
            stmt = select(FavoriteModel).where(
                FavoriteModel.user_id == user_id,
                FavoriteModel.product_id == product_id
            )
            fav = db.scalars(stmt).first()
            if fav:
                db.delete(fav)
                db.commit()
        
    def list_favorites(self, db: Session, user_id: str) -> List[str]:
        if settings.USE_MOCK_DB:
            return list(self._store.get(user_id, []))
        else:
            stmt = select(FavoriteModel.product_id).where(FavoriteModel.user_id == user_id)
            results = db.scalars(stmt).all()
            return [str(pid) for pid in results]
