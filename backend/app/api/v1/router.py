"""
API v1 router – aggregates all endpoint routers.
"""

from fastapi import APIRouter

from ...api.v1.endpoints.status import router as status_router
from ...api.v1.endpoints.verified_id import router as verified_id_router

api_router = APIRouter()

api_router.include_router(
    verified_id_router, prefix="/verified-id", tags=["Verified ID"]
)
api_router.include_router(status_router, prefix="/status", tags=["Status"])
