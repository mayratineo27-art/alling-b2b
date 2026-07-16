"""Agregando columnas faltantes a products (image_url, specs, image_gallery, sku, stock_visible_mode)

Revision ID: 7a1e9c2b4f10
Revises: 3d9b3d60d660
Create Date: 2026-07-09 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '7a1e9c2b4f10'
down_revision = '3d9b3d60d660'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Idempotente: local (SQLite) y remoto (Postgres) divergieron en qué columnas
    # ya tenían aplicadas, así que solo se agregan las que realmente faltan.
    bind = op.get_bind()
    existing_cols = {c['name'] for c in inspect(bind).get_columns('products')}

    if 'image_url' not in existing_cols:
        op.add_column('products', sa.Column('image_url', sa.String(), nullable=True))
    if 'specs' not in existing_cols:
        op.add_column('products', sa.Column('specs', sa.JSON(), nullable=True))
    if 'image_gallery' not in existing_cols:
        op.add_column('products', sa.Column('image_gallery', sa.JSON(), nullable=True))
    if 'sku' not in existing_cols:
        op.add_column('products', sa.Column('sku', sa.String(), nullable=True))
    if 'stock_visible_mode' not in existing_cols:
        op.add_column('products', sa.Column('stock_visible_mode', sa.String(), nullable=False, server_default='EXACT'))


def downgrade() -> None:
    op.drop_column('products', 'stock_visible_mode')
    op.drop_column('products', 'sku')
    op.drop_column('products', 'image_gallery')
    op.drop_column('products', 'specs')
    op.drop_column('products', 'image_url')
