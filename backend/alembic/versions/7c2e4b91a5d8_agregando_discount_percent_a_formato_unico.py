"""Agregando columna faltante discount_percent a formato_unico

Revision ID: 7c2e4b91a5d8
Revises: 5f3a8d21e9c4
Create Date: 2026-07-12 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '7c2e4b91a5d8'
down_revision = '5f3a8d21e9c4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Idempotente (mismo patrón que 7a1e9c2b4f10 / 9b2f4e7a1c33 / 5f3a8d21e9c4):
    # el modelo FormatoUnico ya declara discount_percent (usado por
    # recalcular_subtotal()), pero ninguna migración previa creó la columna
    # en la tabla real — activar USE_MOCK_DB=False rompía la creación de
    # CUALQUIER Formato Único (sesión GUEST, carrito, cotización) con
    # UndefinedColumn al ejecutar el primer SELECT.
    bind = op.get_bind()
    existing_cols = {c['name'] for c in inspect(bind).get_columns('formato_unico')}

    if 'discount_percent' not in existing_cols:
        op.add_column(
            'formato_unico',
            sa.Column('discount_percent', sa.Numeric(5, 2), nullable=False, server_default='0'),
        )


def downgrade() -> None:
    op.drop_column('formato_unico', 'discount_percent')
