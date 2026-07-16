import os
import sys
import uuid
import asyncio

# Ensure backend root is in Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import engine
from sqlmodel import Session, SQLModel, select
from app.models.kit import KitModel, KitComponentLink
from app.models.product import ProductModel

def seed_kits():
    # Make sure tables are created
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        # Check if we already have kits
        existing = session.exec(select(KitModel)).first()
        if existing:
            print("Base de datos ya contiene Kits. Saltando seed de kits.")
            return

        # Fetch some products to include in the kits
        products = session.exec(select(ProductModel).limit(5)).all()
        if len(products) < 2:
            print("No hay suficientes productos en la BD para armar kits.")
            return

        kit1_id = uuid.uuid4()
        kit1 = KitModel(
            id=kit1_id,
            name="Kit Instalación FTTH Básico",
            description="Todo lo necesario para una instalación residencial estándar GPON.",
            image_url="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=2070&auto=format&fit=crop", # reference image
            is_active=True
        )

        kit2_id = uuid.uuid4()
        kit2 = KitModel(
            id=kit2_id,
            name="Kit NODO Principal",
            description="Equipamiento activo y accesorios para montar un nodo inicial.",
            image_url="https://images.unsplash.com/photo-1551703599-6b3e8379aa8b?q=80&w=2014&auto=format&fit=crop",
            is_active=True
        )

        session.add(kit1)
        session.add(kit2)
        session.commit() # Commit kits to DB so their IDs exist for the links

        # Link components for Kit 1
        session.add(KitComponentLink(kit_id=kit1_id, product_id=products[0].id, quantity=2))
        session.add(KitComponentLink(kit_id=kit1_id, product_id=products[1].id, quantity=1))

        # Link components for Kit 2
        session.add(KitComponentLink(kit_id=kit2_id, product_id=products[2].id, quantity=5))
        if len(products) > 3:
            session.add(KitComponentLink(kit_id=kit2_id, product_id=products[3].id, quantity=10))

        session.commit()
        print("Seed de Kits exitoso: 2 kits creados.")

if __name__ == "__main__":
    seed_kits()
