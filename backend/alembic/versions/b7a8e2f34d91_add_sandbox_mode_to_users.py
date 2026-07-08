"""add sandbox_mode to users

Revision ID: b7a8e2f34d91
Revises: 331a40cd5b01
Create Date: 2026-07-08 23:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7a8e2f34d91'
down_revision: str = '331a40cd5b01'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('users')]
    if 'sandbox_mode' not in columns:
        op.add_column('users', sa.Column('sandbox_mode', sa.Boolean(), nullable=False, server_default=sa.text('true')))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('users')]
    if 'sandbox_mode' in columns:
        op.drop_column('users', 'sandbox_mode')

