"""Crear tabla refresh_tokens (RF-AUT-009)

Revision ID: 4c8e1a6f9d21
Revises: 9b2f4e7a1c33
Create Date: 2026-07-11 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '4c8e1a6f9d21'
down_revision = '9b2f4e7a1c33'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Idempotente: local (SQLite) y remoto (Postgres) pueden divergir en qué
    # tablas ya existen (mismo patrón que las migraciones anteriores).
    bind = op.get_bind()
    if not inspect(bind).has_table('refresh_tokens'):
        op.create_table(
            'refresh_tokens',
            sa.Column('id', sa.String(), primary_key=True),
            sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('token_hash', sa.String(), nullable=False),
            sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        )
        op.create_index('ix_refresh_tokens_user_id', 'refresh_tokens', ['user_id'])
        op.create_index('ix_refresh_tokens_token_hash', 'refresh_tokens', ['token_hash'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_refresh_tokens_token_hash', table_name='refresh_tokens')
    op.drop_index('ix_refresh_tokens_user_id', table_name='refresh_tokens')
    op.drop_table('refresh_tokens')
