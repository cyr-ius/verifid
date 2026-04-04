import logging
from typing import Any

from fastapi import APIRouter, Depends

from ....core.config import app_settings
from ....schemas.status import AuthStatus, Status
from .depends import get_current_principal

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=Status)
async def status():
    return Status(
        logo=app_settings.LOGO_URL,
        issuer=app_settings.ISSUER_REQUEST,
        auth=AuthStatus(
            enabled=app_settings.AUTH_ENABLED,
            client_id=app_settings.FRONTEND_AUTH_CLIENT_ID,
            authority=app_settings.frontend_auth_authority,
            scopes=app_settings.frontend_auth_scopes,
        ),
    )


@router.get("/me")
async def me(
    principal: dict[str, Any] = Depends(get_current_principal),
) -> dict[str, Any]:
    return {
        "sub": principal.get("sub"),
        "name": principal.get("name"),
        "preferred_username": principal.get("preferred_username"),
        "aud": principal.get("aud"),
        "iss": principal.get("iss"),
        "roles": principal.get("roles", []),
        "scp": principal.get("scp", ""),
        "groups": principal.get("groups", []),
        "raw": principal,
    }
