import time
from collections.abc import Callable
from typing import Any

import httpx
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from ....core.config import app_settings

bearer_scheme = HTTPBearer(auto_error=False)
_openid_config_cache: tuple[float, dict[str, Any]] | None = None
_jwks_cache: dict[str, tuple[float, dict[str, Any]]] = {}


async def issuer_request() -> bool:
    if app_settings.ISSUER_REQUEST:
        return app_settings.ISSUER_REQUEST
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Issuer is disabled"
    )


async def _fetch_json(url: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(url)
        response.raise_for_status()
        payload = response.json()

    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Identity provider returned an invalid response.",
        )
    return payload


async def _get_openid_config() -> dict[str, Any]:
    global _openid_config_cache

    now = time.time()
    if _openid_config_cache and _openid_config_cache[0] > now:
        return _openid_config_cache[1]

    config = await _fetch_json(app_settings.entra_openid_config_url)
    _openid_config_cache = (
        now + app_settings.AUTH_JWKS_CACHE_TTL_SECONDS,
        config,
    )
    return config


async def _get_jwks(jwks_uri: str) -> dict[str, Any]:
    now = time.time()
    cached = _jwks_cache.get(jwks_uri)
    if cached and cached[0] > now:
        return cached[1]

    jwks = await _fetch_json(jwks_uri)
    _jwks_cache[jwks_uri] = (now + app_settings.AUTH_JWKS_CACHE_TTL_SECONDS, jwks)
    return jwks


async def get_current_principal(
    credentials: HTTPAuthorizationCredentials | None = Security(bearer_scheme),
) -> dict[str, Any]:
    if not app_settings.AUTH_ENABLED:
        return {}

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
        )

    try:
        openid_config = await _get_openid_config()
        jwks_uri = str(openid_config["jwks_uri"])
        jwks = await _get_jwks(jwks_uri)

        unverified_header = jwt.get_unverified_header(credentials.credentials)
        key_id = unverified_header.get("kid")
        jwk = next(
            (
                key_data
                for key_data in jwks.get("keys", [])
                if isinstance(key_data, dict) and key_data.get("kid") == key_id
            ),
            None,
        )
        if jwk is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to validate token signature.",
            )

        last_jwt_error: JWTError | None = None
        for issuer in app_settings.auth_issuers:
            for audience in app_settings.auth_audiences:
                try:
                    return jwt.decode(
                        credentials.credentials,
                        jwk,
                        algorithms=["RS256"],
                        audience=audience,
                        issuer=issuer,
                    )
                except JWTError as exc:
                    last_jwt_error = exc

        if last_jwt_error is not None:
            raise last_jwt_error

        return jwt.decode(
            credentials.credentials,
            jwk,
            algorithms=["RS256"],
        )
    except HTTPException:
        raise
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid access token: {exc}",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to validate access token.",
        ) from exc


def require_roles(*required_roles: str) -> Callable[[dict[str, Any]], dict[str, Any]]:
    async def dependency(
        principal: dict[str, Any] = Depends(get_current_principal),
    ) -> dict[str, Any]:
        if not app_settings.AUTH_ENABLED:
            return principal

        token_roles = {
            role.strip()
            for role in principal.get("roles", [])
            if isinstance(role, str) and role.strip()
        }
        token_scopes = {
            scope.strip()
            for scope in str(principal.get("scp", "")).split()
            if scope.strip()
        }

        if token_roles.intersection(required_roles) or token_scopes.intersection(
            required_roles
        ):
            return principal

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions.",
        )

    return dependency


async def require_helpdesk_access(
    principal: dict[str, Any] = Depends(
        require_roles(app_settings.AUTH_ROLE_HELPDESK, app_settings.AUTH_SCOPE_HELPDESK)
    ),
) -> dict[str, Any]:
    return principal


async def require_hr_access(
    principal: dict[str, Any] = Depends(require_roles(app_settings.AUTH_ROLE_HR)),
) -> dict[str, Any]:
    return principal
