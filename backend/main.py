import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import eis, cells
from database import init_db, close_db

# Load environment variables
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown."""
    # Startup
    print("[STARTING] Battery Cell Dashboard API...")
    try:
        await init_db()
        print("[OK] Database initialized successfully")
    except Exception as e:
        print(f"[WARNING] Database initialization failed: {e}")
        print("   Running in demo mode without database persistence")
    
    yield
    
    # Shutdown
    print("[SHUTDOWN] Shutting down...")
    await close_db()
    print("[DONE] Goodbye!")


# Get environment
ENV = os.getenv("ENVIRONMENT", "development")
IS_PRODUCTION = ENV == "production"

app = FastAPI(
    title="Battery Cell Dashboard API",
    description="API for battery cell EIS data analysis with database persistence",
    version="2.0.0",
    lifespan=lifespan,
    # Disable docs in production for security (optional)
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
)

# CORS configuration - environment-based
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "").split(",") if os.getenv("CORS_ORIGINS") else []

# Default allowed origins for development
DEFAULT_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
]

# Combine origins (production uses env var, development uses defaults)
allowed_origins = CORS_ORIGINS if IS_PRODUCTION and CORS_ORIGINS else DEFAULT_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Include routers
app.include_router(eis.router)
app.include_router(cells.router)


@app.get("/")
async def root():
    return {
        "message": "Battery Cell Dashboard API",
        "version": "2.0.0",
        "status": "running",
        "features": [
            "EIS data analysis",
            "Cell CRUD operations",
            "Cloudinary image storage",
            "PostgreSQL persistence"
        ]
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
