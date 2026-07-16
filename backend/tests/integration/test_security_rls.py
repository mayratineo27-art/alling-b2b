import pytest
from uuid import uuid4
from sqlalchemy import text
from app.models.formato_unico import FormatoUnico
from app.models.user import User
from testcontainers.postgres import PostgresContainer
from sqlmodel import create_engine, Session
from app.db.database import Base

def test_rls_security(postgres_container: PostgresContainer):
    """
    T7-INT2: Validación de Zero Trust (RLS).
    Simula la seguridad a nivel de motor de PostgreSQL aislando 
    los Formatos Únicos por cliente.
    """
    engine = create_engine(postgres_container.get_connection_url())
    Base.metadata.create_all(bind=engine)
    
    with Session(engine) as session:
        # Create users
        user_a_id = str(uuid4())
        user_b_id = str(uuid4())
        
        user_a = User(id=user_a_id, email=f"{user_a_id}@test.com", role="CUSTOMER", name="User A", auth_provider="LOCAL")
        user_b = User(id=user_b_id, email=f"{user_b_id}@test.com", role="CUSTOMER", name="User B", auth_provider="LOCAL")
        session.add(user_a)
        session.add(user_b)
        
        # Insert raw data
        fu_a_id = str(uuid4())
        fu_b_id = str(uuid4())
        session.add(FormatoUnico(id=fu_a_id, customer_id=user_a_id, state="BORRADOR"))
        session.add(FormatoUnico(id=fu_b_id, customer_id=user_b_id, state="BORRADOR"))
        session.commit()
        
        # Habilitar RLS en formato_unico de manera programática en la BD efímera
        session.execute(text("ALTER TABLE formato_unico ENABLE ROW LEVEL SECURITY;"))
        
        # Crear la política RLS que solo permite ver si el current_setting('app.current_user_id') es igual al customer_id
        session.execute(text('''
            CREATE POLICY formato_unico_isolation_policy ON formato_unico
            FOR ALL
            USING (customer_id::text = current_setting('app.current_user_id', true));
        '''))
        
        # Crear un usuario de base de datos sin permisos de superuser
        session.execute(text("CREATE ROLE app_user WITH LOGIN PASSWORD 'password';"))
        session.execute(text("GRANT ALL PRIVILEGES ON TABLE formato_unico TO app_user;"))
        session.commit()

    # Ahora nos conectamos con el usuario limitado (app_user)
    db_url = postgres_container.get_connection_url().replace(
        "test:test", "app_user:password"
    )
    user_engine = create_engine(db_url)
    
    with Session(user_engine) as user_session:
        # 1. Sin setear la variable de configuración, no debería ver nada
        result_none = user_session.execute(text("SELECT id FROM formato_unico")).fetchall()
        assert len(result_none) == 0
        
        # 2. Inyectamos la sesión como USER_A (Simulando lo que hace el middleware tras verificar el JWT)
        user_session.execute(text(f"SET LOCAL app.current_user_id = '{user_a_id}'"))
        
        # Buscamos de nuevo
        result_a = user_session.execute(text("SELECT id, customer_id FROM formato_unico")).fetchall()
        
        # USER_A solo debe poder ver 1 registro (el suyo)
        assert len(result_a) == 1
        assert str(result_a[0].customer_id) == user_a_id
        
        # Intentamos consultar el FormatoUnico de USER_B directamente
        result_b = user_session.execute(text(f"SELECT id FROM formato_unico WHERE id = '{fu_b_id}'")).fetchall()
        
        # El motor SQL debe retornar vacío (bloqueo por RLS)
        assert len(result_b) == 0

    user_engine.dispose()
    engine.dispose()
