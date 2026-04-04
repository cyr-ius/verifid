"""
Main FastAPI application entry point for Verified ID Employee Verification.
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .api.v1.router import api_router
from .core.config import app_settings

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=app_settings.LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    logger.info("Starting Verified ID application...")
    yield
    logger.info("Shutting down Verified ID application...")


app = FastAPI(
    title="Employee Verified ID API",
    description="API for verifying employee identity using Microsoft Entra Verified ID",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs" if app_settings.SWAGGER_ENABLE else None,
    # redoc_url="/api/redoc",
    openapi_url="/api/openapi.json" if app_settings.SWAGGER_ENABLE else None,
)

# CORS middleware - restrict origins in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=app_settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")


@app.get("/api/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "healthy", "service": "VerifID API"}


# ── Serve Angular SPA (must be last) ─────────────────────────────────────────
project_root = Path(__file__).resolve().parents[2]
frontend_dist = project_root / "frontend"

if frontend_dist:
    frontend_index = frontend_dist / "index.html"

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str) -> FileResponse:
        """Serve Angular static files and fallback to index.html for SPA routes."""
        requested_path = (frontend_dist / full_path).resolve()

        if requested_path.is_file() and frontend_dist in requested_path.parents:
            return FileResponse(requested_path)

        return FileResponse(frontend_index)
else:
    logger.warning("Frontend static directory not found. Checked: %s", frontend_dist)
