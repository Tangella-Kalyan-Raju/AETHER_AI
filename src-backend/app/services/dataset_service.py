import csv
import io
import datetime
from typing import Dict, Any, List, Tuple, Optional

from sqlalchemy.orm import Session
from app.models.dashboard_models import Dataset, DatasetRecord, DatasetVersion
from app.services.weather_service import WeatherService

class DatasetService:
    @staticmethod
    def detect_columns(headers: List[str]) -> Dict[str, str]:
        """
        Maps raw file headers to standard dataset schema columns.
        """
        mapping = {}
        standard_cols = {
            "timestamp": ["timestamp", "time", "date", "datetime"],
            "region": ["region", "state", "zone", "location"],
            "plant_name": ["plant", "plant_name", "station", "generator"],
            "plant_type": ["type", "plant_type", "fuel", "resource"],
            "installed_capacity": ["capacity", "installed_capacity", "max_mw", "limit"],
            "current_generation": ["generation", "current_generation", "mw", "value", "output"],
            "demand": ["demand", "load", "system_load"],
            "renewable_output": ["renewable", "renewables", "green_output"],
            "wind_speed": ["wind_speed", "wind", "velocity"],
            "temperature": ["temperature", "temp", "deg_c"],
            "solar_irradiance": ["solar", "irradiance", "ghi", "dni"]
        }
        
        for std_name, aliases in standard_cols.items():
            for alias in aliases:
                for h in headers:
                    if alias in h.lower():
                        mapping[std_name] = h
                        break
                if std_name in mapping:
                    break
        return mapping

    @classmethod
    def parse_csv(cls, content: bytes) -> Tuple[List[str], List[Dict[str, Any]]]:
        """
        Parses CSV binary content into headers and raw rows.
        """
        decoded = content.decode("utf-8", errors="ignore")
        reader = csv.reader(io.StringIO(decoded))
        headers = next(reader, [])
        rows = []
        for r in reader:
            if not r:
                continue
            rows.append(dict(zip(headers, r)))
        return headers, rows

    @classmethod
    def parse_xlsx(cls, content: bytes) -> Tuple[List[str], List[Dict[str, Any]]]:
        """
        Parses Excel (XLSX) content using openpyxl. Falls back to CSV parser if openpyxl is not installed.
        """
        try:
            import openpyxl
            wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
            sheet = wb.active
            rows_iter = sheet.iter_rows(values_only=True)
            headers = [str(cell) for cell in next(rows_iter, []) if cell is not None]
            rows = []
            for row in rows_iter:
                if not any(row):
                    continue
                rows.append(dict(zip(headers, row)))
            return headers, rows
        except ImportError:
            # Fallback to csv if XLSX was somehow raw CSV
            return cls.parse_csv(content)

    @classmethod
    def process_dataset(cls, db: Session, filename: str, content: bytes) -> Dataset:
        """
        Saves the uploaded dataset metadata, detects columns, and returns a Dataset object.
        """
        if filename.endswith(".xlsx"):
            headers, rows = cls.parse_xlsx(content)
        else:
            headers, rows = cls.parse_csv(content)
            
        col_mapping = cls.detect_columns(headers)
        
        dataset = Dataset(
            filename=filename,
            file_size=len(content),
            columns=col_mapping,
            row_count=len(rows),
            status="uploaded"
        )
        db.add(dataset)
        db.commit()
        db.refresh(dataset)
        
        # Save temporary cache of records for preview
        return dataset

    @classmethod
    def import_records(cls, db: Session, dataset_id: str, content: bytes, enrich_weather: bool = False) -> Dict[str, Any]:
        """
        Validates, enriches, and stores the rows into the database.
        """
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            return {"success": False, "error": "Dataset not found"}
            
        dataset.status = "processing"
        db.commit()
        
        try:
            if dataset.filename.endswith(".xlsx"):
                headers, rows = cls.parse_xlsx(content)
            else:
                headers, rows = cls.parse_csv(content)
                
            mapping = dataset.columns or {}
            
            # Helper to convert values to proper type
            def safe_float(val) -> Optional[float]:
                try:
                    if val is None or str(val).strip() == "":
                        return None
                    return float(str(val).replace(",", "").strip())
                except ValueError:
                    return None

            records = []
            for idx, r in enumerate(rows):
                # Map raw values to DatasetRecord
                ts_str = r.get(mapping.get("timestamp", ""))
                ts = None
                if ts_str:
                    try:
                        # Try parsing different formats
                        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%m/%d/%Y %H:%M", "%d-%m-%Y"):
                            try:
                                ts = datetime.datetime.strptime(str(ts_str), fmt)
                                break
                            except ValueError:
                                continue
                    except Exception:
                        pass
                if not ts:
                    ts = datetime.datetime.utcnow() - datetime.timedelta(hours=idx)
                    
                rec = DatasetRecord(
                    dataset_id=dataset_id,
                    timestamp=ts,
                    region=str(r.get(mapping.get("region", ""), "Hyderabad")),
                    plant_name=str(r.get(mapping.get("plant_name", ""), "Generic")),
                    plant_type=str(r.get(mapping.get("plant_type", ""), "Solar")),
                    installed_capacity=safe_float(r.get(mapping.get("installed_capacity", ""))),
                    current_generation=safe_float(r.get(mapping.get("current_generation", ""))),
                    demand=safe_float(r.get(mapping.get("demand", ""))),
                    renewable_output=safe_float(r.get(mapping.get("renewable_output", ""))),
                    wind_speed=safe_float(r.get(mapping.get("wind_speed", ""))),
                    temperature=safe_float(r.get(mapping.get("temperature", ""))),
                    solar_irradiance=safe_float(r.get(mapping.get("solar_irradiance", "")))
                )
                
                # Enrich weather if missing and enrich_weather is True
                if enrich_weather and (rec.temperature is None or rec.solar_irradiance is None):
                    weather = WeatherService.get_weather_data(region_name=rec.region)
                    rec.temperature = rec.temperature or weather.get("temperature")
                    rec.wind_speed = rec.wind_speed or weather.get("wind_speed")
                    rec.solar_irradiance = rec.solar_irradiance or weather.get("cloud_cover") # Use cloud cover/irradiance mapping
                    
                records.append(rec)
                
            db.bulk_save_objects(records)
            
            # Create a version
            version_num = db.query(DatasetVersion).filter(DatasetVersion.dataset_id == dataset_id).count() + 1
            ver = DatasetVersion(
                dataset_id=dataset_id,
                version=version_num,
                description=f"Imported version {version_num} of {dataset.filename}",
                imported_by="Operator"
            )
            db.add(ver)
            
            dataset.status = "completed"
            db.commit()
            return {"success": True, "row_count": len(records)}
            
        except Exception as e:
            dataset.status = "failed"
            dataset.error_message = str(e)
            db.commit()
            return {"success": False, "error": str(e)}
