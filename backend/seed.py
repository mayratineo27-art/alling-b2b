
import asyncio
from sqlmodel import Session, SQLModel
from app.db.database import engine, Base
from app.models.product import ProductModel
from uuid import uuid4

def seed_db():
    SQLModel.metadata.create_all(bind=engine)
    with Session(engine) as session:
        # Verificar si ya hay datos
        existing = session.query(ProductModel).first()
        if existing:
            print('Ya hay productos en la BD.')
            return

        print('Insertando productos de prueba...')
        productos = [
            ProductModel(id=uuid4(), name='Router Wi-Fi 6', slug='router-wifi-6', category='Redes', brand='TP-Link', price_public=250.0, stock=50, is_active=True, is_featured=True, image_url='https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=600', sku="RT-WIFI6-TPL"),
            ProductModel(id=uuid4(), name='Cable Fibra Optica 10m', slug='cable-fibra-10m', category='Cables', brand='Cisco', price_public=45.0, stock=100, is_active=True, is_featured=True, image_url='https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600', sku="FO-CAB10-CIS"),
            ProductModel(id=uuid4(), name='Switch Gigabit 24 Puertos', slug='switch-gigabit-24', category='Redes', brand='MikroTik', price_public=850.0, stock=15, is_active=True, is_featured=True, image_url='https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=600', sku="SW-GIG24-MIK"),
            ProductModel(id=uuid4(), name='Antena Sectorial 5GHz', slug='antena-sectorial-5ghz', category='Antenas', brand='Ubiquiti', price_public=420.0, stock=8, is_active=True, is_featured=True, image_url='https://images.unsplash.com/photo-1562408590-e32931084e23?auto=format&fit=crop&q=80&w=600', sku="ANT-SEC5-UBI"),
            ProductModel(id=uuid4(), name='Conector RJ45 (Pack 100)', slug='conector-rj45-100', category='Accesorios', brand='Generico', price_public=25.0, stock=200, is_active=True, image_url='https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600', sku="CON-RJ45-GEN"),
        ]
        for p in productos:
            session.add(p)
        session.commit()
        print('¡Productos insertados con éxito!')

if __name__ == '__main__':
    seed_db()

