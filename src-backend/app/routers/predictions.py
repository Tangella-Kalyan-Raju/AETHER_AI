from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.core.security import get_current_user
from app.services.digital_twin.prediction_engine import PredictionEngine

router = APIRouter()

@router.get("/")
async def get_all_predictions(
    horizon_minutes: int = Query(15, description="Time horizon in minutes"),
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    engine = PredictionEngine(db)
    return engine.generate_predictions(horizon_minutes)

@router.get("/stability")
async def get_stability_prediction(
    horizon_minutes: int = Query(15),
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    engine = PredictionEngine(db)
    return engine.get_grid_stability(horizon_minutes)
