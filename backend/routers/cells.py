"""
API endpoints for battery cell CRUD operations.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional

from database import get_db, is_db_configured
from models.schemas import (
    CellCreate, CellUpdate, CellResponse, CellDetailResponse, 
    CellListResponse, ImageUploadResponse, EISAnalysisCreate,
    ElectricalParamsResponse
)
from services import cell_service
from services.cloudinary_service import cloudinary_service
from services.impedance_service import impedance_service

router = APIRouter(prefix="/api/cells", tags=["Cells"])


# Explicit OPTIONS handler for CORS preflight
@router.options("")
@router.options("/")
@router.options("/{path:path}")
async def options_handler(path: str = ""):
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "*",
        }
    )


def cell_to_response(cell) -> dict:
    """Convert SQLAlchemy Cell model to response dict."""
    response = {
        "id": cell.id,
        "cell_id_barcode": cell.cell_id_barcode,
        "image_url": cell.image_url,
        "cell_condition": cell.cell_condition,
        "created_at": cell.created_at,
        "updated_at": cell.updated_at,
        "electrical_params": None,
    }
    
    if cell.electrical_params:
        response["electrical_params"] = {
            "id": cell.electrical_params.id,
            "cell_id": cell.electrical_params.cell_id,
            "nominal_voltage": cell.electrical_params.nominal_voltage,
            "nominal_energy": cell.electrical_params.nominal_energy,
            "nominal_charge_capacity": cell.electrical_params.nominal_charge_capacity,
            "voltage_min": cell.electrical_params.voltage_min,
            "voltage_max": cell.electrical_params.voltage_max,
            "current_continuous": cell.electrical_params.current_continuous,
            "current_peak": cell.electrical_params.current_peak,
            "power_continuous": cell.electrical_params.power_continuous,
            "power_peak": cell.electrical_params.power_peak,
            "energy_density_gravimetric": cell.electrical_params.energy_density_gravimetric,
            "energy_density_volumetric": cell.electrical_params.energy_density_volumetric,
            "power_density_gravimetric": cell.electrical_params.power_density_gravimetric,
            "power_density_volumetric": cell.electrical_params.power_density_volumetric,
        }
    
    return response


def cell_to_detail_response(cell) -> dict:
    """Convert SQLAlchemy Cell model to detail response dict."""
    response = cell_to_response(cell)
    response["eis_analyses"] = []
    
    if cell.eis_analyses:
        for analysis in cell.eis_analyses:
            response["eis_analyses"].append({
                "id": analysis.id,
                "cell_id": analysis.cell_id,
                "frequencies": analysis.frequencies,
                "z_real": analysis.z_real,
                "z_imag": analysis.z_imag,
                "bode_magnitude": analysis.bode_magnitude,
                "bode_phase": analysis.bode_phase,
                "ecm_parameters": analysis.ecm_parameters,
                "circuit_string": analysis.circuit_string,
                "soh_percentage": analysis.soh_percentage,
                "rb_current": analysis.rb_current,
                "rb_max": analysis.rb_max,
                "created_at": analysis.created_at,
            })
    
    return response


@router.post("")
async def create_cell(
    cell_data: CellCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new battery cell with auto-generated ID."""
    try:
        cell = await cell_service.create_cell(db, cell_data)
        # Eagerly load the electrical_params
        await db.refresh(cell, ['electrical_params'])
        return cell_to_response(cell)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def list_cells(
    page: int = 1,
    page_size: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """Get paginated list of cells."""
    skip = (page - 1) * page_size
    cells, total = await cell_service.get_cells(db, skip=skip, limit=page_size)
    
    return {
        "cells": [cell_to_response(cell) for cell in cells],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.get("/{cell_id}")
async def get_cell(
    cell_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific cell with all related data."""
    cell = await cell_service.get_cell(db, cell_id)
    if not cell:
        raise HTTPException(status_code=404, detail="Cell not found")
    return cell_to_detail_response(cell)


@router.get("/barcode/{barcode}")
async def get_cell_by_barcode(
    barcode: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a cell by its barcode ID."""
    cell = await cell_service.get_cell_by_barcode(db, barcode)
    if not cell:
        raise HTTPException(status_code=404, detail="Cell not found")
    return cell_to_detail_response(cell)


@router.put("/{cell_id}")
async def update_cell(
    cell_id: UUID,
    cell_data: CellUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a cell's data."""
    cell = await cell_service.update_cell(db, cell_id, cell_data)
    if not cell:
        raise HTTPException(status_code=404, detail="Cell not found")
    return cell_to_response(cell)


@router.delete("/{cell_id}")
async def delete_cell(
    cell_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete a cell and all associated data."""
    # Get cell to delete image from Cloudinary
    cell = await cell_service.get_cell(db, cell_id)
    if not cell:
        raise HTTPException(status_code=404, detail="Cell not found")
    
    # Delete image from Cloudinary if exists
    if cell.image_public_id:
        await cloudinary_service.delete_image(cell.image_public_id)
    
    # Delete cell from database
    success = await cell_service.delete_cell(db, cell_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete cell")
    
    return {"message": "Cell deleted successfully"}


@router.post("/{cell_id}/image", response_model=ImageUploadResponse)
async def upload_cell_image(
    cell_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Upload an image for a cell to Cloudinary."""
    # Verify cell exists
    cell = await cell_service.get_cell(db, cell_id)
    if not cell:
        raise HTTPException(status_code=404, detail="Cell not found")
    
    # Check if Cloudinary is configured
    if not cloudinary_service.is_configured():
        raise HTTPException(
            status_code=503, 
            detail="Cloudinary is not configured. Please set environment variables."
        )
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Delete old image if exists
        if cell.image_public_id:
            await cloudinary_service.delete_image(cell.image_public_id)
        
        # Upload new image
        result = await cloudinary_service.upload_image(file, cell.cell_id_barcode)
        
        # Update cell with new image URL
        await cell_service.update_cell_image(
            db, cell_id, 
            result["url"], 
            result["public_id"]
        )
        
        return ImageUploadResponse(
            success=True,
            message="Image uploaded successfully",
            image_url=result["url"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{cell_id}/eis")
async def upload_eis_data(
    cell_id: UUID,
    file: UploadFile = File(...),
    rb_max: float = 0.1,
    db: AsyncSession = Depends(get_db)
):
    """Upload EIS data for a cell and perform analysis."""
    # Verify cell exists
    cell = await cell_service.get_cell(db, cell_id)
    if not cell:
        raise HTTPException(status_code=404, detail="Cell not found")
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    try:
        # Read and process the file
        content = await file.read()
        frequencies, Z = impedance_service.load_csv_data(content)
        
        # Get Bode plot data
        bode_data = impedance_service.get_bode_plot_data()
        
        # Fit circuit and get parameters
        ecm_result = impedance_service.fit_circuit()
        
        # Calculate SoH
        soh_result = impedance_service.calculate_soh(rb_max)
        
        # Create EIS analysis record
        eis_data = EISAnalysisCreate(
            frequencies=frequencies.tolist(),
            z_real=Z.real.tolist(),
            z_imag=Z.imag.tolist(),
            bode_magnitude=bode_data["magnitude"],
            bode_phase=bode_data["phase"],
            ecm_parameters={p["name"]: p for p in ecm_result["parameters"]},
            circuit_string=ecm_result["circuit_string"],
            soh_percentage=soh_result["soh_percentage"],
            rb_current=soh_result["rb_current"],
            rb_max=soh_result["rb_max"]
        )
        
        analysis = await cell_service.create_eis_analysis(db, cell_id, eis_data)
        
        return {
            "success": True,
            "message": f"EIS data processed: {len(frequencies)} data points",
            "analysis_id": str(analysis.id),
            "soh_percentage": soh_result["soh_percentage"]
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@router.get("/{cell_id}/eis/latest")
async def get_latest_eis_analysis(
    cell_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get the most recent EIS analysis for a cell."""
    cell = await cell_service.get_cell(db, cell_id)
    if not cell:
        raise HTTPException(status_code=404, detail="Cell not found")
    
    analysis = await cell_service.get_latest_eis_analysis(db, cell_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="No EIS analysis found for this cell")
    
    return {
        "id": analysis.id,
        "cell_id": analysis.cell_id,
        "frequencies": analysis.frequencies,
        "z_real": analysis.z_real,
        "z_imag": analysis.z_imag,
        "bode_magnitude": analysis.bode_magnitude,
        "bode_phase": analysis.bode_phase,
        "ecm_parameters": analysis.ecm_parameters,
        "circuit_string": analysis.circuit_string,
        "soh_percentage": analysis.soh_percentage,
        "rb_current": analysis.rb_current,
        "rb_max": analysis.rb_max,
        "created_at": analysis.created_at,
    }
