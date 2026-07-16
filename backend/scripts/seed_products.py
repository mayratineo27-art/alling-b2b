import os
import sys
import uuid
import asyncio
from decimal import Decimal

# Ensure backend root is in Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import engine
from sqlmodel import Session, SQLModel
from app.models.product import ProductModel

def seed_data():
    with Session(engine) as session:
        # Check if we already have products
        existing = session.query(ProductModel).first()
        if existing:
            print("Base de datos ya contiene productos. Saltando seed.")
            return

        products = [
            ProductModel(
                id=uuid.uuid4(),
                name="Cable de Fibra Óptica Monomodo 1000m",
                slug="cable-fibra-optica-monomodo-1000m",
                category="Fibra Óptica",
                brand="Prysmian",
                description="Bobina de cable de fibra óptica monomodo ideal para instalaciones exteriores.",
                image_url="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=2070&auto=format&fit=crop",
                price_public=Decimal("1250.00"),
                stock=50,
                reserved_stock=0,
                is_active=True,
                is_featured=True
            ),
            ProductModel(
                id=uuid.uuid4(),
                name="Router OLT Huawei MA5800",
                slug="router-olt-huawei-ma5800",
                category="Equipos Activos",
                brand="Huawei",
                description="Terminal de línea óptica (OLT) de nueva generación.",
                image_url="https://images.unsplash.com/photo-1551703599-6b3e8379aa8b?q=80&w=2014&auto=format&fit=crop",
                price_public=Decimal("18500.00"),
                stock=5,
                reserved_stock=0,
                is_active=True,
                is_featured=True
            ),
            ProductModel(
                id=uuid.uuid4(),
                name="Splitter Óptico 1x8",
                slug="splitter-optico-1x8",
                category="Accesorios GPON",
                brand="CommScope",
                description="Divisor óptico pasivo para redes FTTH.",
                image_url="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2034&auto=format&fit=crop",
                price_public=Decimal("45.50"),
                stock=200,
                reserved_stock=0,
                is_active=True,
                is_featured=False
            ),
            ProductModel(
                id=uuid.uuid4(),
                name="Manga de Empalme 48 Hilos",
                slug="manga-empalme-48-hilos",
                category="Herrajes y Empalmes",
                brand="Furukawa",
                description="Manga de empalme óptica tipo domo de alta capacidad.",
                image_url="https://images.unsplash.com/photo-1620286828859-717013ed639e?q=80&w=2072&auto=format&fit=crop",
                price_public=Decimal("210.00"),
                stock=80,
                reserved_stock=0,
                is_active=True,
                is_featured=True
            ),
            ProductModel(
                id=uuid.uuid4(),
                name="Patch Cord SC/APC 3m",
                slug="patch-cord-sc-apc-3m",
                category="Cables Patch",
                brand="Optronics",
                description="Cable de parcheo simplex SC/APC monomodo.",
                image_url="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=2070&auto=format&fit=crop",
                price_public=Decimal("15.00"),
                stock=500,
                reserved_stock=0,
                is_active=True,
                is_featured=False
            ),
            ProductModel(
                id=uuid.uuid4(),
                name="ONT ZTE F670L",
                slug="ont-zte-f670l",
                category="Equipos Activos",
                brand="ZTE",
                description="Terminal de red óptica con WiFi doble banda.",
                image_url="https://images.unsplash.com/photo-1551703599-6b3e8379aa8b?q=80&w=2014&auto=format&fit=crop",
                price_public=Decimal("185.00"),
                stock=120,
                reserved_stock=0,
                is_active=True,
                is_featured=True
            ),
            ProductModel(
                id=uuid.uuid4(),
                name="Bobina Cable Drop 1km",
                slug="bobina-cable-drop-1km",
                category="Fibra Óptica",
                brand="Prysmian",
                description="Cable de acometida plana para instalaciones FTTH.",
                image_url="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=2070&auto=format&fit=crop",
                price_public=Decimal("350.00"),
                stock=30,
                reserved_stock=0,
                is_active=True,
                is_featured=False
            ),
            ProductModel(
                id=uuid.uuid4(),
                name="Roseta Óptica 2 Puertos",
                slug="roseta-optica-2-puertos",
                category="Accesorios GPON",
                brand="CommScope",
                description="Roseta de terminación para interiores.",
                image_url="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2034&auto=format&fit=crop",
                price_public=Decimal("8.50"),
                stock=1000,
                reserved_stock=0,
                is_active=True,
                is_featured=False
            ),
        ]

        for p in products:
            session.add(p)

        session.commit()
        print(f"Seed exitoso: {len(products)} productos insertados.")

if __name__ == "__main__":
    seed_data()
