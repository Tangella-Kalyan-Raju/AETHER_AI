"""Dummy migration for missing revision

Revision ID: 98dfa2e9b1bc
Revises: d4c8122cb721
Create Date: 2026-07-25 13:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '98dfa2e9b1bc'
down_revision: Union[str, None] = 'd4c8122cb721'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
