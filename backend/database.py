"""
Database configuration for Neon DB PostgreSQL with async support.
"""
import os
import ssl
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

def get_database_url():
    """
    Get database URL and convert for asyncpg compatibility.
    - Converts postgresql:// to postgresql+asyncpg://
    - Removes sslmode parameter (handled via connect_args)
    - Removes channel_binding parameter (not supported by asyncpg)
    """
    url = os.getenv("DATABASE_URL", "")
    
    if not url:
        return ""
    
    # Convert postgresql:// to postgresql+asyncpg://
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    
    # Parse the URL
    parsed = urlparse(url)
    
    # Parse query parameters and remove unsupported ones
    query_params = parse_qs(parsed.query)
    
    # Remove parameters that asyncpg doesn't support
    query_params.pop('sslmode', None)
    query_params.pop('channel_binding', None)
    
    # Rebuild the URL
    new_query = urlencode(query_params, doseq=True)
    new_parsed = parsed._replace(query=new_query)
    
    return urlunparse(new_parsed)


DATABASE_URL = get_database_url()

# Create async engine with SSL context for Neon
engine = None
async_session_maker = None

if DATABASE_URL:
    # Create SSL context for Neon DB
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    
    connect_args = {"ssl": ssl_context}
    
    try:
        engine = create_async_engine(
            DATABASE_URL,
            echo=False,  # Set to True for debugging
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            connect_args=connect_args,
        )
        
        async_session_maker = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
        print(f"[OK] Database engine created for: {urlparse(DATABASE_URL).hostname}")
    except Exception as e:
        print(f"[WARNING] Failed to create database engine: {e}")
        engine = None
        async_session_maker = None


class Base(DeclarativeBase):
    """Base class for SQLAlchemy models."""
    pass


async def get_db() -> AsyncSession:
    """Dependency for getting database session."""
    if async_session_maker is None:
        raise RuntimeError("Database not configured. Please set DATABASE_URL in .env")
    
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Initialize database tables."""
    if engine is None:
        print("⚠️ Database not configured - running in demo mode")
        return
    
    try:
        async with engine.begin() as conn:
            # Import models to ensure they're registered
            from models.cell import Cell, ElectricalParams, EISAnalysis
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Database tables created successfully")
    except Exception as e:
        print(f"⚠️ Database initialization failed: {e}")
        raise


async def close_db():
    """Close database connection."""
    if engine:
        await engine.dispose()


def is_db_configured() -> bool:
    """Check if database is properly configured."""
    return engine is not None and DATABASE_URL != ""
