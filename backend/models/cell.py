"""
SQLAlchemy ORM models for battery cell data.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base


class Cell(Base):
    """Main battery cell entity."""
    __tablename__ = "cells"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cell_id_barcode = Column(String(10), unique=True, nullable=False, index=True)
    image_url = Column(Text, nullable=True)
    image_public_id = Column(String(255), nullable=True)  # Cloudinary public_id for deletion
    cell_condition = Column(String(20), default="Recycled")  # "New" or "Recycled"
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    electrical_params = relationship("ElectricalParams", back_populates="cell", uselist=False, cascade="all, delete-orphan")
    eis_analyses = relationship("EISAnalysis", back_populates="cell", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Cell {self.cell_id_barcode}>"


class ElectricalParams(Base):
    """Electrical parameters for a battery cell."""
    __tablename__ = "electrical_params"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cell_id = Column(UUID(as_uuid=True), ForeignKey("cells.id", ondelete="CASCADE"), unique=True)
    
    # Voltage parameters
    nominal_voltage = Column(Float, default=3.6)  # V
    voltage_min = Column(Float, default=2.5)  # V
    voltage_max = Column(Float, default=4.2)  # V
    
    # Energy parameters
    nominal_energy = Column(Float, default=16.2)  # Wh
    nominal_charge_capacity = Column(Float, default=4.5)  # Ah
    
    # Current parameters
    current_continuous = Column(Float, default=8.61)  # A
    current_peak = Column(Float, default=17.5)  # A
    
    # Power parameters
    power_continuous = Column(Float, default=25.6)  # W
    power_peak = Column(Float, default=50.0)  # W
    
    # Energy density
    energy_density_gravimetric = Column(Float, default=154)  # Wh/kg
    energy_density_volumetric = Column(Float, default=375)  # Wh/l
    
    # Power density
    power_density_gravimetric = Column(Float, default=837)  # W/kg
    power_density_volumetric = Column(Float, default=2.04)  # kW/l
    
    # Relationship
    cell = relationship("Cell", back_populates="electrical_params")
    
    def __repr__(self):
        return f"<ElectricalParams for Cell {self.cell_id}>"


class EISAnalysis(Base):
    """EIS analysis results for a battery cell."""
    __tablename__ = "eis_analyses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cell_id = Column(UUID(as_uuid=True), ForeignKey("cells.id", ondelete="CASCADE"))
    
    # Raw EIS data
    frequencies = Column(JSON, nullable=True)  # List of frequencies
    z_real = Column(JSON, nullable=True)  # List of real impedance values
    z_imag = Column(JSON, nullable=True)  # List of imaginary impedance values
    
    # Bode plot data
    bode_magnitude = Column(JSON, nullable=True)
    bode_phase = Column(JSON, nullable=True)
    
    # ECM fitted parameters
    ecm_parameters = Column(JSON, nullable=True)  # Dict of parameter name -> value
    circuit_string = Column(String(100), nullable=True)
    
    # State of Health
    soh_percentage = Column(Float, nullable=True)
    rb_current = Column(Float, nullable=True)
    rb_max = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    cell = relationship("Cell", back_populates="eis_analyses")
    
    def __repr__(self):
        return f"<EISAnalysis {self.id} for Cell {self.cell_id}>"
