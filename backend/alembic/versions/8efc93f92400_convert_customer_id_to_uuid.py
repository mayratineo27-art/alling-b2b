"""convert_customer_id_to_uuid

Revision ID: 8efc93f92400
Revises: 7c2e4b91a5d8
Create Date: 2026-07-15 17:25:19.881623

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8efc93f92400'
down_revision: Union[str, Sequence[str], None] = '7c2e4b91a5d8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Convertimos la columna a UUID
    # Usamos USING para que Postgres sepa cómo interpretar el texto existente
    op.execute('ALTER TABLE formato_unico ALTER COLUMN customer_id TYPE UUID USING customer_id::UUID')

def downgrade() -> None:
    # Si algo sale mal y necesitas revertir, devolvemos la columna a VARCHAR
    op.execute('ALTER TABLE formato_unico ALTER COLUMN customer_id TYPE VARCHAR')