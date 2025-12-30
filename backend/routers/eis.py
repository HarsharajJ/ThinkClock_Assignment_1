from fastapi import APIRouter, UploadFile, File, HTTPException
from models.schemas import BodePlotData, ECMFitResult, SoHResult, EISUploadResponse
from services.impedance_service import impedance_service

router = APIRouter(prefix="/api/eis", tags=["EIS"])


@router.post("/upload", response_model=EISUploadResponse)
async def upload_eis_data(file: UploadFile = File(...)):
    """Upload EIS data from CSV file."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    try:
        content = await file.read()
        frequencies, Z = impedance_service.load_csv_data(content)
        
        return EISUploadResponse(
            success=True,
            message=f"Successfully loaded {len(frequencies)} data points",
            num_datapoints=len(frequencies)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@router.get("/bode-plot", response_model=BodePlotData)
async def get_bode_plot():
    """Get Bode plot data (magnitude and phase vs frequency)."""
    try:
        data = impedance_service.get_bode_plot_data()
        return BodePlotData(**data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/ecm-params", response_model=ECMFitResult)
async def get_ecm_parameters():
    """Fit equivalent circuit model and return parameters."""
    try:
        result = impedance_service.fit_circuit()
        return ECMFitResult(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/soh")
async def get_soh(rb_max: float = 0.1):
    """Calculate State of Health based on Rb value."""
    try:
        result = impedance_service.calculate_soh(rb_max)
        return SoHResult(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
