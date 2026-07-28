"""Agrega columna image_url a la tabla categories (RF-CAT-009)

Revision ID: a1b2c3d4e5f6
Revises: 7c2e4b91a5d8
Create Date: 2026-07-27 17:45:00.000000

Cambio:
    ALTER TABLE categories ADD COLUMN image_url VARCHAR NULL;

Motivación:
    RF-CAT-009 / OPS-CAT-004 / RN-CAT-IMG-03 — Permite almacenar la URL
    pública de la imagen de referencia de cada categoría.
    Null = sin imagen; los componentes muestran placeholder SVG (RN-CAT-IMG-04).

Idempotente: verifica si la columna ya existe antes de agregarla para
    tolerar entornos donde la migración se haya aplicado parcialmente.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '9b2f4e7a1c33'
branch_labels = None
depends_on = None



def upgrade() -> None:
    bind = op.get_bind()
    existing_cols = {c['name'] for c in inspect(bind).get_columns('categories')}

    if 'image_url' not in existing_cols:
        op.add_column(
            'categories',
            sa.Column(
                'image_url',
                sa.String(),
                nullable=True,
                comment=(
                    'URL pública de la imagen de referencia de la categoría. '
                    'NULL = sin imagen (mostrar placeholder SVG). '
                    'RF-CAT-009 / RN-CAT-IMG-03'
                ),
            ),
        )


def downgrade() -> None:
    bind = op.get_bind()
    existing_cols = {c['name'] for c in inspect(bind).get_columns('categories')}

    if 'image_url' in existing_cols:
        op.drop_column('categories', 'image_url')
