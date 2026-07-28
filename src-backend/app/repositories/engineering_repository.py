from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from app.models.engineering_models import (
    EngRegion, EngAsset, EngGenerator, EngTransmissionLine, 
    EngBatteryStorage, RenewableGeneration, DemandProfile, EngWeatherProfile
)
from app.schemas.engineering_schemas import (
    EngRegionCreate, EngGeneratorBase, EngTransmissionLineBase, EngBatteryStorageBase,
    RenewableGenerationBase, DemandProfileBase, WeatherProfileBase
)
from app.core.exceptions import ConstraintViolationError, DuplicateKeyError

class EngineeringRepository:
    def __init__(self, db: Session):
        self.db = db

    # --- Region ---
    def create_region(self, region_data: EngRegionCreate) -> EngRegion:
        db_region = EngRegion(**region_data.model_dump())
        self.db.add(db_region)
        try:
            self.db.commit()
            self.db.refresh(db_region)
            return db_region
        except IntegrityError as e:
            self.db.rollback()
            raise DuplicateKeyError(f"Region creation failed: {e}")

    def get_regions(self, skip: int = 0, limit: int = 100, search: Optional[str] = None) -> List[EngRegion]:
        query = self.db.query(EngRegion)
        if search:
            query = query.filter(EngRegion.name.ilike(f"%{search}%"))
        return query.offset(skip).limit(limit).all()

    def get_region_by_id(self, region_id: str) -> Optional[EngRegion]:
        return self.db.query(EngRegion).filter(EngRegion.id == region_id).first()

    # --- Assets Generic ---
    def get_assets(self, skip: int = 0, limit: int = 100, search: Optional[str] = None, region_id: Optional[str] = None, asset_type: Optional[str] = None, status: Optional[str] = None) -> List[EngAsset]:
        query = self.db.query(EngAsset)
        if search:
            query = query.filter(EngAsset.name.ilike(f"%{search}%"))
        if region_id:
            query = query.filter(EngAsset.region_id == region_id)
        if asset_type:
            query = query.filter(EngAsset.asset_type == asset_type)
        if status:
            query = query.filter(EngAsset.status == status)
        return query.offset(skip).limit(limit).all()

    def get_asset_by_id(self, asset_id: str) -> Optional[EngAsset]:
        return self.db.query(EngAsset).filter(EngAsset.id == asset_id).first()

    # --- Generator ---
    def create_generator(self, gen_data: EngGeneratorBase) -> EngGenerator:
        asset = EngAsset(asset_type="generator", name=gen_data.name, region_id=gen_data.region_id)
        self.db.add(asset)
        self.db.flush()
        db_gen = EngGenerator(
            id=asset.id,
            generator_type=gen_data.generator_type,
            installed_capacity=gen_data.installed_capacity,
            minimum_output=gen_data.minimum_output,
            maximum_output=gen_data.maximum_output,
            fuel_type=gen_data.fuel_type,
            operating_cost=gen_data.operating_cost,
            emission_factor=gen_data.emission_factor,
            operational_status=gen_data.operational_status
        )
        self.db.add(db_gen)
        try:
            self.db.commit()
            self.db.refresh(db_gen)
            return db_gen
        except IntegrityError as e:
            self.db.rollback()
            raise ConstraintViolationError(f"Generator creation failed: {e}")

    def get_generators(self, skip: int = 0, limit: int = 100, search: Optional[str] = None, region_id: Optional[str] = None, generator_type: Optional[str] = None, status: Optional[str] = None) -> List[dict]:
        query = self.db.query(EngGenerator, EngAsset).join(EngAsset, EngGenerator.id == EngAsset.id)
        if search:
            query = query.filter(EngAsset.name.ilike(f"%{search}%"))
        if region_id:
            query = query.filter(EngAsset.region_id == region_id)
        if generator_type:
            query = query.filter(EngGenerator.generator_type == generator_type)
        if status:
            query = query.filter(EngGenerator.operational_status == status)
        results = query.offset(skip).limit(limit).all()
        # Map to dict so Pydantic handles it easily
        out = []
        for gen, asset in results:
            d = gen.__dict__.copy()
            d["name"] = asset.name
            d["region_id"] = asset.region_id
            out.append(d)
        return out

    # --- Transmission Line ---
    def create_transmission_line(self, tl_data: EngTransmissionLineBase) -> EngTransmissionLine:
        asset = EngAsset(asset_type="transmission_line", name=tl_data.name, region_id=tl_data.region_id)
        self.db.add(asset)
        self.db.flush()
        db_tl = EngTransmissionLine(
            id=asset.id,
            source_substation=tl_data.source_substation,
            destination_substation=tl_data.destination_substation,
            voltage_level=tl_data.voltage_level,
            line_length=tl_data.line_length,
            thermal_limit=tl_data.thermal_limit,
            resistance=tl_data.resistance,
            reactance=tl_data.reactance,
            status=tl_data.status
        )
        self.db.add(db_tl)
        try:
            self.db.commit()
            self.db.refresh(db_tl)
            return db_tl
        except IntegrityError as e:
            self.db.rollback()
            raise ConstraintViolationError(f"Transmission Line creation failed: {e}")

    def get_transmission_lines(self, skip: int = 0, limit: int = 100, search: Optional[str] = None, region_id: Optional[str] = None) -> List[dict]:
        query = self.db.query(EngTransmissionLine, EngAsset).join(EngAsset, EngTransmissionLine.id == EngAsset.id)
        if search:
            query = query.filter(EngAsset.name.ilike(f"%{search}%"))
        if region_id:
            query = query.filter(EngAsset.region_id == region_id)
        results = query.offset(skip).limit(limit).all()
        out = []
        for line, asset in results:
            d = line.__dict__.copy()
            d["name"] = asset.name
            d["region_id"] = asset.region_id
            out.append(d)
        return out

    # --- Battery Storage ---
    def create_battery_storage(self, bat_data: EngBatteryStorageBase) -> EngBatteryStorage:
        asset = EngAsset(asset_type="battery", name=bat_data.name, region_id=bat_data.region_id)
        self.db.add(asset)
        self.db.flush()
        db_bat = EngBatteryStorage(
            id=asset.id,
            capacity=bat_data.capacity,
            state_of_charge=bat_data.state_of_charge,
            charging_rate=bat_data.charging_rate,
            discharging_rate=bat_data.discharging_rate,
            efficiency=bat_data.efficiency
        )
        self.db.add(db_bat)
        try:
            self.db.commit()
            self.db.refresh(db_bat)
            return db_bat
        except IntegrityError as e:
            self.db.rollback()
            raise ConstraintViolationError(f"Battery Storage creation failed: {e}")

    def get_battery_storage(self, skip: int = 0, limit: int = 100, search: Optional[str] = None, region_id: Optional[str] = None) -> List[dict]:
        query = self.db.query(EngBatteryStorage, EngAsset).join(EngAsset, EngBatteryStorage.id == EngAsset.id)
        if search:
            query = query.filter(EngAsset.name.ilike(f"%{search}%"))
        if region_id:
            query = query.filter(EngAsset.region_id == region_id)
        results = query.offset(skip).limit(limit).all()
        out = []
        for bat, asset in results:
            d = bat.__dict__.copy()
            d["name"] = asset.name
            d["region_id"] = asset.region_id
            out.append(d)
        return out

    # --- Renewables ---
    def get_renewables(self, skip: int = 0, limit: int = 100, type: Optional[str] = None, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> List[RenewableGeneration]:
        query = self.db.query(RenewableGeneration)
        if type:
            query = query.filter(RenewableGeneration.type == type)
        if start_date:
            query = query.filter(RenewableGeneration.timestamp >= start_date)
        if end_date:
            query = query.filter(RenewableGeneration.timestamp <= end_date)
        return query.offset(skip).limit(limit).all()
    
    def bulk_create_renewables(self, items: List[RenewableGenerationBase]):
        records = [RenewableGeneration(**item.model_dump()) for item in items]
        self.db.bulk_save_objects(records)
        try:
            self.db.commit()
        except IntegrityError as e:
            self.db.rollback()
            raise ConstraintViolationError(f"Bulk insert renewables failed: {e}")

    # --- Demand Profiles ---
    def get_demand_profiles(self, skip: int = 0, limit: int = 100, region: Optional[str] = None, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> List[DemandProfile]:
        query = self.db.query(DemandProfile)
        if region:
            query = query.filter(DemandProfile.region == region)
        if start_date:
            query = query.filter(DemandProfile.timestamp >= start_date)
        if end_date:
            query = query.filter(DemandProfile.timestamp <= end_date)
        return query.offset(skip).limit(limit).all()

    def bulk_create_demand_profiles(self, items: List[DemandProfileBase]):
        records = [DemandProfile(**item.model_dump()) for item in items]
        self.db.bulk_save_objects(records)
        try:
            self.db.commit()
        except IntegrityError as e:
            self.db.rollback()
            raise ConstraintViolationError(f"Bulk insert demand profiles failed: {e}")

    # --- Weather Profiles ---
    def get_weather_profiles(self, skip: int = 0, limit: int = 100, region_id: Optional[str] = None, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> List[EngWeatherProfile]:
        query = self.db.query(EngWeatherProfile)
        if region_id:
            query = query.filter(EngWeatherProfile.region_id == region_id)
        if start_date:
            query = query.filter(EngWeatherProfile.timestamp >= start_date)
        if end_date:
            query = query.filter(EngWeatherProfile.timestamp <= end_date)
        return query.offset(skip).limit(limit).all()

    def bulk_create_weather_profiles(self, items: List[WeatherProfileBase]):
        records = [EngWeatherProfile(**item.model_dump()) for item in items]
        self.db.bulk_save_objects(records)
        try:
            self.db.commit()
        except IntegrityError as e:
            self.db.rollback()
            raise ConstraintViolationError(f"Bulk insert weather profiles failed: {e}")
