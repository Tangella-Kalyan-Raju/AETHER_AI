"""add_optimization_analytics_tables

Revision ID: 83babff176e0
Revises: c585dd85af1a
Create Date: 2026-07-25 23:08:17.720168

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '83babff176e0'
down_revision: Union[str, None] = 'c585dd85af1a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('optimization_analytics_snapshots',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('period', sa.String(length=20), nullable=False),
    sa.Column('period_start', sa.DateTime(timezone=True), nullable=False),
    sa.Column('period_end', sa.DateTime(timezone=True), nullable=False),
    sa.Column('total_jobs', sa.Integer(), nullable=True),
    sa.Column('successful_jobs', sa.Integer(), nullable=True),
    sa.Column('failed_jobs', sa.Integer(), nullable=True),
    sa.Column('cancelled_jobs', sa.Integer(), nullable=True),
    sa.Column('success_rate', sa.Float(), nullable=True),
    sa.Column('avg_execution_time_ms', sa.Float(), nullable=True),
    sa.Column('avg_objective_score', sa.Float(), nullable=True),
    sa.Column('avg_cost_savings_usd', sa.Float(), nullable=True),
    sa.Column('avg_carbon_avoided_tons', sa.Float(), nullable=True),
    sa.Column('avg_stability_score', sa.Float(), nullable=True),
    sa.Column('avg_renewable_pct', sa.Float(), nullable=True),
    sa.Column('avg_ai_confidence', sa.Float(), nullable=True),
    sa.Column('metrics_json', sa.JSON(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('optimization_audit_entries',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('job_id', sa.String(length=36), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=True),
    sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
    sa.Column('config_mode', sa.String(length=50), nullable=True),
    sa.Column('objectives_json', sa.JSON(), nullable=True),
    sa.Column('constraints_json', sa.JSON(), nullable=True),
    sa.Column('strategy_selected', sa.String(length=100), nullable=True),
    sa.Column('alternative_strategies_json', sa.JSON(), nullable=True),
    sa.Column('ai_recommendation_json', sa.JSON(), nullable=True),
    sa.Column('confidence_score', sa.Float(), nullable=True),
    sa.Column('execution_time_ms', sa.Float(), nullable=True),
    sa.Column('final_status', sa.String(length=20), nullable=True),
    sa.Column('objective_score', sa.Float(), nullable=True),
    sa.Column('warnings_json', sa.JSON(), nullable=True),
    sa.Column('errors_json', sa.JSON(), nullable=True),
    sa.ForeignKeyConstraint(['job_id'], ['optimization_jobs.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('optimization_audit_entries')
    op.drop_table('optimization_analytics_snapshots')
