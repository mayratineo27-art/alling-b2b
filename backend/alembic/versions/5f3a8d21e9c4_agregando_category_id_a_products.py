"""Agregando columna faltante category_id a products (FK a categories)

Revision ID: 5f3a8d21e9c4
Revises: 4c8e1a6f9d21
Create Date: 2026-07-12 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '5f3a8d21e9c4'
down_revision = '4c8e1a6f9d21'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Idempotente (mismo patrón que 7a1e9c2b4f10 / 9b2f4e7a1c33): el modelo
    # Product ya declara category_id (FK a categories.id, usado por el
    # módulo Categorías/Kits), pero ninguna migración previa creó la columna
    # en la tabla real — cualquier query vía ProductRepositoryImpl (que
    # SIEMPRE se usa para productos, sin importar USE_MOCK_DB) fallaba con
    # UndefinedColumn.
    bind = op.get_bind()
    existing_cols = {c['name'] for c in inspect(bind).get_columns('products')}

    if 'category_id' not in existing_cols:
        uuid_type = postgresql.UUID(as_uuid=True) if bind.dialect.name == 'postgresql' else sa.String()
        op.add_column('products', sa.Column('category_id', uuid_type, sa.ForeignKey('categories.id'), nullable=True))


def downgrade() -> None:
    op.drop_column('products', 'category_id')
