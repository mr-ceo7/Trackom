"""add_custom_branding_and_missing_fields

Revision ID: b7a7406a4eb7
Revises: d09872c80f40
Create Date: 2026-07-12 02:41:40.738170
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7a7406a4eb7'
down_revision: Union[str, None] = 'd09872c80f40'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # 1. users table columns
    users_cols = [c['name'] for c in inspector.get_columns('users')]
    if 'custom_logo_url' not in users_cols:
        op.add_column('users', sa.Column('custom_logo_url', sa.String(length=500), nullable=True))
    if 'custom_brand_name' not in users_cols:
        op.add_column('users', sa.Column('custom_brand_name', sa.String(length=255), nullable=True))
    if 'custom_primary_color' not in users_cols:
        op.add_column('users', sa.Column('custom_primary_color', sa.String(length=50), nullable=True))
        
    # 2. campaigns table columns
    campaigns_cols = [c['name'] for c in inspector.get_columns('campaigns')]
    if 'include_opt_out' not in campaigns_cols:
        op.add_column('campaigns', sa.Column('include_opt_out', sa.Boolean(), server_default=sa.text('true'), nullable=False))
    if 'batch_number' not in campaigns_cols:
        op.add_column('campaigns', sa.Column('batch_number', sa.String(length=100), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # 1. users table columns
    users_cols = [c['name'] for c in inspector.get_columns('users')]
    if 'custom_logo_url' in users_cols:
        op.drop_column('users', 'custom_logo_url')
    if 'custom_brand_name' in users_cols:
        op.drop_column('users', 'custom_brand_name')
    if 'custom_primary_color' in users_cols:
        op.drop_column('users', 'custom_primary_color')
        
    # 2. campaigns table columns
    campaigns_cols = [c['name'] for c in inspector.get_columns('campaigns')]
    if 'include_opt_out' in campaigns_cols:
        op.drop_column('campaigns', 'include_opt_out')
    if 'batch_number' in campaigns_cols:
        op.drop_column('campaigns', 'batch_number')
