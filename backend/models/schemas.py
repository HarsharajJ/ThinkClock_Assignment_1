from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# ============== EIS Related Schemas ==============

class BodePlotData(BaseModel):
    frequencies: List[float]
    magnitude: List[float]
    phase: List[float]


class ECMParameter(BaseModel):
    name: str
    value: float
    unit: str
    explanation: str
    min_value: float
    max_value: float


class ECMFitResult(BaseModel):
    parameters: List[ECMParameter]
    circuit_string: str


class SoHResult(BaseModel):
    soh_percentage: float
    rb_current: float
    rb_max: float


class EISUploadResponse(BaseModel):
    success: bool
    message: str
    num_datapoints: Optional[int] = None


# ============== Electrical Parameters Schemas ==============

class ElectricalParamsBase(BaseModel):
    nominal_voltage: float = Field(default=3.6, description="Nominal Voltage (V)")
    nominal_energy: float = Field(default=16.2, description="Nominal Energy (Wh)")
    nominal_charge_capacity: float = Field(default=4.5, description="Nominal Charge Capacity (Ah)")
    voltage_min: float = Field(default=2.5, description="Minimum Voltage (V)")
    voltage_max: float = Field(default=4.2, description="Maximum Voltage (V)")
    current_continuous: float = Field(default=8.61, description="Continuous Current (A)")
    current_peak: float = Field(default=17.5, description="Peak Current (A)")
    power_continuous: float = Field(default=25.6, description="Continuous Power (W)")
    power_peak: float = Field(default=50.0, description="Peak Power (W)")
    energy_density_gravimetric: float = Field(default=154, description="Gravimetric Energy Density (Wh/kg)")
    energy_density_volumetric: float = Field(default=375, description="Volumetric Energy Density (Wh/l)")
    power_density_gravimetric: float = Field(default=837, description="Gravimetric Power Density (W/kg)")
    power_density_volumetric: float = Field(default=2.04, description="Volumetric Power Density (kW/l)")


class ElectricalParamsCreate(ElectricalParamsBase):
    pass


class ElectricalParamsUpdate(BaseModel):
    nominal_voltage: Optional[float] = None
    nominal_energy: Optional[float] = None
    nominal_charge_capacity: Optional[float] = None
    voltage_min: Optional[float] = None
    voltage_max: Optional[float] = None
    current_continuous: Optional[float] = None
    current_peak: Optional[float] = None
    power_continuous: Optional[float] = None
    power_peak: Optional[float] = None
    energy_density_gravimetric: Optional[float] = None
    energy_density_volumetric: Optional[float] = None
    power_density_gravimetric: Optional[float] = None
    power_density_volumetric: Optional[float] = None


class ElectricalParamsResponse(ElectricalParamsBase):
    id: UUID
    cell_id: UUID
    
    class Config:
        from_attributes = True


# ============== EIS Analysis Schemas ==============

class EISAnalysisBase(BaseModel):
    frequencies: Optional[List[float]] = None
    z_real: Optional[List[float]] = None
    z_imag: Optional[List[float]] = None
    bode_magnitude: Optional[List[float]] = None
    bode_phase: Optional[List[float]] = None
    ecm_parameters: Optional[dict] = None
    circuit_string: Optional[str] = None
    soh_percentage: Optional[float] = None
    rb_current: Optional[float] = None
    rb_max: Optional[float] = None


class EISAnalysisCreate(EISAnalysisBase):
    pass


class EISAnalysisResponse(EISAnalysisBase):
    id: UUID
    cell_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============== Cell Schemas ==============

class CellBase(BaseModel):
    cell_condition: str = Field(default="Recycled", description="Cell Condition: 'New' or 'Recycled'")


class CellCreate(CellBase):
    electrical_params: Optional[ElectricalParamsCreate] = None


class CellUpdate(BaseModel):
    cell_condition: Optional[str] = None
    electrical_params: Optional[ElectricalParamsUpdate] = None


class CellResponse(CellBase):
    id: UUID
    cell_id_barcode: str
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    electrical_params: Optional[ElectricalParamsResponse] = None
    
    class Config:
        from_attributes = True


class CellDetailResponse(CellResponse):
    eis_analyses: List[EISAnalysisResponse] = []
    
    class Config:
        from_attributes = True


class CellListResponse(BaseModel):
    cells: List[CellResponse]
    total: int
    page: int
    page_size: int


# ============== Image Upload Response ==============

class ImageUploadResponse(BaseModel):
    success: bool
    message: str
    image_url: Optional[str] = None


# ============== Legacy CellMetaInfo for backward compatibility ==============

class CellMetaInfo(BaseModel):
    cell_condition: str = "Recycled"
    nominal_voltage: float = 3.6
    nominal_energy: float = 16.2
    nominal_charge_capacity: float = 4.5
    voltage_min: float = 2.5
    voltage_max: float = 4.2
    current_continuous: float = 8.61
    current_peak: float = 17.5
    power_continuous: float = 25.6
    power_peak: float = 50.0
    energy_density_gravimetric: float = 154
    energy_density_volumetric: float = 375
    power_density_gravimetric: float = 837
    power_density_volumetric: float = 2.04
