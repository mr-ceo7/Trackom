"""add_audit_logs_table

Revision ID: 749159096afb
Revises: b7a7406a4eb7
Create Date: 2026-07-12 02:43:04.041558
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '749159096afb'
down_revision: Union[str, None] = 'b7a7406a4eb7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    if 'audit_logs' not in tables:
        op.create_table(
            'audit_logs',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('user_id', sa.UUID(), nullable=True),
            sa.Column('action', sa.String(length=100), nullable=False),
            sa.Column('details', sa.JSON(), nullable=False),
            sa.Column('ip_address', sa.String(length=45), nullable=True),
            sa.Column('user_agent', sa.String(length=255), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
        op.create_index(op.f('ix_audit_logs_user_id'), 'audit_logs', ['user_id'], unique=False)


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    if 'audit_logs' in tables:
        op.drop_index(op.f('ix_audit_logs_user_id'), table_name='audit_logs')
        op.drop_index(op.f('ix_audit_logs_action'), table_name='audit_logs')
        op.drop_table('audit_logs')
