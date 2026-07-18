"""add_notification_preferences_to_users

Revision ID: ae95a9a13323
Revises: 4e91c9efef91
Create Date: 2026-07-19 00:53:53.226193
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ae95a9a13323'
down_revision: Union[str, None] = '4e91c9efef91'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column(
            'notification_preferences',
            sa.JSON(),
            nullable=False,
            server_default=sa.text('\'{"campaign": true, "balance": true, "reports": true, "api": true, "security": true}\'')
        )
    )


def downgrade() -> None:
    op.drop_column('users', 'notification_preferences')
