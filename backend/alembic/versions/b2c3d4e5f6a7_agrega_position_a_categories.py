"""Agrega columnas image_url y position a categories — merge de ramas (RN-CAT-ORD-01 / RF-CAT-009)

Revision ID: b2c3d4e5f6a7
Revises: 8efc93f92400, a1b2c3d4e5f6
Create Date: 2026-08-07 18:42:00.000000

Cambio:
    Merge de las dos ramas de Alembic.
    - Agrega image_url si no existe  (RF-CAT-009)
    - Agrega position INTEGER DEFAULT 0 (RN-CAT-ORD-01)

Motivación:
    RN-CAT-ORD-01 — Permite al Administrador definir el orden de visualización
    de las categorías en el catálogo, landing page y panel de administración.
    Menor valor numérico = mayor prioridad visual (aparece primero).
    En caso de empate se ordena alfabéticamente por nombre.

Idempotente: verifica si cada columna ya existe antes de agregarla.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6a7'
down_revision = ('8efc93f92400', 'a1b2c3d4e5f6')
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    existing_cols = {c['name'] for c in inspect(bind).get_columns('categories')}

    # Agrega image_url si no existe (RF-CAT-009 / rama a1b2c3d4e5f6)
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

    # Agrega position si no existe (RN-CAT-ORD-01)
    if 'position' not in existing_cols:
        op.add_column(
            'categories',
            sa.Column(
                'position',
                sa.Integer(),
                nullable=False,
                server_default='0',
                comment=(
                    'Prioridad de visualización definida por el Administrador. '
                    'Menor número = aparece primero en catálogo y landing page. '
                    'RN-CAT-ORD-01'
                ),
            ),
        )
        op.create_index(
            'ix_categories_position',
            'categories',
            ['position'],
            unique=False,
        )


def downgrade() -> None:
    bind = op.get_bind()
    existing_cols = {c['name'] for c in inspect(bind).get_columns('categories')}

    if 'position' in existing_cols:
        try:
            op.drop_index('ix_categories_position', table_name='categories')
        except Exception:
            pass
        op.drop_column('categories', 'position')

    if 'image_url' in existing_cols:
        op.drop_column('categories', 'image_url')

