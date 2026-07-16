"""Agregando columnas faltantes a formato_unico (assigned_seller_id, consultant_note, pdf_url)

Revision ID: 9b2f4e7a1c33
Revises: 7a1e9c2b4f10
Create Date: 2026-07-10 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '9b2f4e7a1c33'
down_revision = '7a1e9c2b4f10'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Idempotente: local (SQLite) y remoto (Postgres) pueden divergir en qué
    # columnas ya tienen aplicadas (mismo patrón que 7a1e9c2b4f10 para products).
    bind = op.get_bind()
    existing_cols = {c['name'] for c in inspect(bind).get_columns('formato_unico')}

    if 'assigned_seller_id' not in existing_cols:
        op.add_column('formato_unico', sa.Column('assigned_seller_id', sa.String(), nullable=True))
        op.create_index('ix_formato_unico_assigned_seller_id', 'formato_unico', ['assigned_seller_id'])
    if 'consultant_note' not in existing_cols:
        op.add_column('formato_unico', sa.Column('consultant_note', sa.Text(), nullable=True))
    if 'pdf_url' not in existing_cols:
        op.add_column('formato_unico', sa.Column('pdf_url', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('formato_unico', 'pdf_url')
    op.drop_column('formato_unico', 'consultant_note')
    op.drop_index('ix_formato_unico_assigned_seller_id', table_name='formato_unico')
    op.drop_column('formato_unico', 'assigned_seller_id')
