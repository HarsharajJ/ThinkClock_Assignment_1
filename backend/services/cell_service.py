"""
CRUD operations for battery cells.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional, List
from uuid import UUID
import random
import string

from models.cell import Cell, ElectricalParams, EISAnalysis
from models.schemas import (
    CellCreate, CellUpdate, 
    ElectricalParamsCreate, ElectricalParamsUpdate,
    EISAnalysisCreate
)


def generate_cell_id() -> str:
    """Generate a unique 10-digit cell ID."""
    return ''.join(random.choices(string.digits, k=10))


async def create_cell(
    db: AsyncSession,
    cell_data: CellCreate
) -> Cell:
    """Create a new cell with optional electrical parameters."""
    # Generate unique cell ID
    cell_id_barcode = generate_cell_id()
    
    # Ensure uniqueness
    while True:
        existing = await db.execute(
            select(Cell).where(Cell.cell_id_barcode == cell_id_barcode)
        )
        if not existing.scalar_one_or_none():
            break
        cell_id_barcode = generate_cell_id()
    
    # Create cell
    cell = Cell(
        cell_id_barcode=cell_id_barcode,
        cell_condition=cell_data.cell_condition,
    )
    db.add(cell)
    await db.flush()  # Get the cell ID
    
    # Create electrical params with defaults
    if cell_data.electrical_params:
        params_data = cell_data.electrical_params.model_dump()
    else:
        params_data = ElectricalParamsCreate().model_dump()
    
    electrical_params = ElectricalParams(
        cell_id=cell.id,
        **params_data
    )
    db.add(electrical_params)
    
    await db.commit()
    await db.refresh(cell)
    
    return cell


async def get_cell(
    db: AsyncSession,
    cell_id: UUID
) -> Optional[Cell]:
    """Get a cell by ID with all related data."""
    result = await db.execute(
        select(Cell)
        .options(
            selectinload(Cell.electrical_params),
            selectinload(Cell.eis_analyses)
        )
        .where(Cell.id == cell_id)
    )
    return result.scalar_one_or_none()


async def get_cell_by_barcode(
    db: AsyncSession,
    barcode: str
) -> Optional[Cell]:
    """Get a cell by its barcode ID."""
    result = await db.execute(
        select(Cell)
        .options(
            selectinload(Cell.electrical_params),
            selectinload(Cell.eis_analyses)
        )
        .where(Cell.cell_id_barcode == barcode)
    )
    return result.scalar_one_or_none()


async def get_cells(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 10
) -> tuple[List[Cell], int]:
    """Get paginated list of cells."""
    # Get total count
    count_result = await db.execute(select(func.count(Cell.id)))
    total = count_result.scalar()
    
    # Get cells
    result = await db.execute(
        select(Cell)
        .options(selectinload(Cell.electrical_params))
        .order_by(Cell.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    cells = result.scalars().all()
    
    return list(cells), total


async def update_cell(
    db: AsyncSession,
    cell_id: UUID,
    cell_data: CellUpdate
) -> Optional[Cell]:
    """Update a cell and its electrical parameters."""
    cell = await get_cell(db, cell_id)
    if not cell:
        return None
    
    # Update cell condition
    if cell_data.cell_condition is not None:
        cell.cell_condition = cell_data.cell_condition
    
    # Update electrical params
    if cell_data.electrical_params and cell.electrical_params:
        params_update = cell_data.electrical_params.model_dump(exclude_unset=True)
        for key, value in params_update.items():
            if value is not None:
                setattr(cell.electrical_params, key, value)
    
    await db.commit()
    await db.refresh(cell)
    
    return cell


async def update_cell_image(
    db: AsyncSession,
    cell_id: UUID,
    image_url: str,
    image_public_id: str
) -> Optional[Cell]:
    """Update cell's image URL."""
    cell = await get_cell(db, cell_id)
    if not cell:
        return None
    
    cell.image_url = image_url
    cell.image_public_id = image_public_id
    
    await db.commit()
    await db.refresh(cell)
    
    return cell


async def delete_cell(
    db: AsyncSession,
    cell_id: UUID
) -> bool:
    """Delete a cell and all related data."""
    cell = await get_cell(db, cell_id)
    if not cell:
        return False
    
    await db.delete(cell)
    await db.commit()
    
    return True


async def create_eis_analysis(
    db: AsyncSession,
    cell_id: UUID,
    eis_data: EISAnalysisCreate
) -> Optional[EISAnalysis]:
    """Create a new EIS analysis for a cell."""
    # Verify cell exists
    cell = await get_cell(db, cell_id)
    if not cell:
        return None
    
    analysis = EISAnalysis(
        cell_id=cell_id,
        **eis_data.model_dump()
    )
    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)
    
    return analysis


async def get_latest_eis_analysis(
    db: AsyncSession,
    cell_id: UUID
) -> Optional[EISAnalysis]:
    """Get the most recent EIS analysis for a cell."""
    result = await db.execute(
        select(EISAnalysis)
        .where(EISAnalysis.cell_id == cell_id)
        .order_by(EISAnalysis.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()
