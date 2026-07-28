from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.database.connection import get_db
from app.core.security import PermissionGuard
from app.models.auth_models import User
from app.models.dashboard_models import Dataset, DatasetRecord, DatasetVersion
from app.services.dataset_service import DatasetService

router = APIRouter(prefix="/api/v1/datasets", tags=["Dataset Management"])

@router.post("/upload", response_model=Dict[str, Any])
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    """
    Handles CSV and Excel file uploads. Detects headers and returns the dataset metadata.
    """
    if not file.filename.endswith((".csv", ".xlsx")):
        raise HTTPException(status_code=400, detail="Only CSV and XLSX files are supported.")
        
    content = await file.read()
    dataset = DatasetService.process_dataset(db, file.filename, content)
    
    # Cache content in file or keep in memory/temp for preview/import.
    # To keep simple for SQLite and database storage, we can write the raw content to a local temp folder or store in DB metadata as a draft
    # Let's save a temp file in a scratch directory inside the project root for local retrieval during preview/import
    import os
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"{dataset.id}_{file.filename}")
    with open(file_path, "wb") as f:
        f.write(content)
        
    return {
        "success": True,
        "data": {
            "id": dataset.id,
            "filename": dataset.filename,
            "file_size": dataset.file_size,
            "columns": dataset.columns,
            "row_count": dataset.row_count,
            "status": dataset.status,
            "created_at": dataset.created_at.isoformat()
        }
    }

@router.get("/list", response_model=Dict[str, Any])
def list_datasets(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    """
    Returns list of all uploaded datasets.
    """
    datasets = db.query(Dataset).order_by(Dataset.created_at.desc()).all()
    return {
        "success": True,
        "data": [
            {
                "id": d.id,
                "filename": d.filename,
                "file_size": d.file_size,
                "columns": d.columns,
                "row_count": d.row_count,
                "status": d.status,
                "error_message": d.error_message,
                "created_at": d.created_at.isoformat()
            } for d in datasets
        ]
    }

@router.get("/preview/{dataset_id}", response_model=Dict[str, Any])
def preview_dataset(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    """
    Returns preview (first 100 rows) of the uploaded dataset.
    """
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    import os
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
    file_path = os.path.join(upload_dir, f"{dataset.id}_{dataset.filename}")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Raw file content not found on server")
        
    with open(file_path, "rb") as f:
        content = f.read()
        
    if dataset.filename.endswith(".xlsx"):
        headers, rows = DatasetService.parse_xlsx(content)
    else:
        headers, rows = DatasetService.parse_csv(content)
        
    return {
        "success": True,
        "data": {
            "headers": headers,
            "preview_rows": rows[:100],
            "columns": dataset.columns
        }
    }

@router.post("/import/{dataset_id}", response_model=Dict[str, Any])
def import_dataset(
    dataset_id: str,
    enrich_weather: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard("dashboard:view"))
):
    """
    Performs validation and imports dataset records into standard SQL tables.
    """
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    import os
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
    file_path = os.path.join(upload_dir, f"{dataset.id}_{dataset.filename}")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Raw file content not found on server")
        
    with open(file_path, "rb") as f:
        content = f.read()
        
    res = DatasetService.import_records(db, dataset_id, content, enrich_weather)
    return res
