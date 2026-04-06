"""
Service layer for Microsoft Entra Verified ID operations.
Handles both credential issuance and presentation/verification flows.
"""

import logging
from typing import Any

import httpx
import msal

from ..core.config import app_settings
from ..schemas.verified_id import IssuanceResponse, PresentationResponse

logger = logging.getLogger(__name__)

# MSAL scope for the Verified ID Request Service
VC_SCOPE = "3db474b9-6a0c-4840-96ac-1fceb342124f/.default"
VC_ISSUANCE_API_ENDPOINT = "https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/createIssuanceRequest"
VC_PRESENTATION_API_ENDPOINT = "https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/createPresentationRequest"


def _get_access_token() -> str:
    """
    Acquire an access token from Azure AD using client credentials.

    Returns:
        str: Bearer access token.

    Raises:
        RuntimeError: If token acquisition fails.
    """
    msal_app = msal.ConfidentialClientApplication(
        client_id=app_settings.AZURE_CLIENT_ID,
        client_credential=app_settings.AZURE_CLIENT_SECRET,
        authority=app_settings.frontend_auth_authority,
    )
    raw_result = msal_app.acquire_token_for_client(scopes=[VC_SCOPE])
    result: dict[str, Any] = raw_result if isinstance(raw_result, dict) else {}

    if "access_token" not in result:
        error = result.get("error_description", "Unknown MSAL error")
        logger.error("Failed to acquire access token: %s", error)
        raise RuntimeError(f"Token acquisition failed: {error}")
    return str(result["access_token"])


async def create_issuance_request(
    employee_id: str,
    given_name: str,
    family_name: str,
    job_title: str,
    department: str,
    session_id: str,
) -> IssuanceResponse:
    """
    Create a Verifiable Credential issuance request for an employee.

    Args:
        employee_id: Company employee identifier.
        given_name: Employee first name.
        family_name: Employee last name.
        job_title: Employee job title.
        department: Employee department.
        session_id: Unique session identifier for callback correlation.

    Returns:
        IssuanceResponse: Contains QR code URL and deep link.
    """
    token = _get_access_token()
    callback_url = f"{app_settings.APP_BASE_URL}/api/v1/verified-id/issuance-callback"

    payload: dict[str, Any] = {
        "includeQRCode": True,
        "authority": app_settings.VERIFIED_ID_DID,
        "registration": {
            "clientName": "Employee Identity Portal",
        },
        "callback": {
            "url": callback_url,
            "state": session_id,
            "headers": {"api-key": app_settings.API_KEY}
            if app_settings.API_KEY
            else {},
        },
        "type": "VerifiedEmployee",
        "manifest": app_settings.verified_id_manifest_url,
        "claims": {
            "employeeId": employee_id,
            "given_name": given_name,
            "family_name": family_name,
            "jobTitle": job_title,
            "department": department,
        },
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            VC_ISSUANCE_API_ENDPOINT,
            json=payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()

    logger.info("Issuance request created: requestId=%s", data.get("requestId"))
    return IssuanceResponse(
        request_id=data["requestId"],
        qr_code=data.get("qrCode", ""),
        url=data.get("url", ""),
        expiry=data.get("expiry", ""),
    )


async def create_presentation_request(session_id: str) -> PresentationResponse:
    """
    Create a Verifiable Credential presentation request (verification).
    Used by the helpdesk to verify an employee's identity.

    Args:
        session_id: Unique session identifier for callback correlation.

    Returns:
        PresentationResponse: Contains QR code URL and deep link.
    """
    token = _get_access_token()
    callback_url = (
        f"{app_settings.APP_BASE_URL}/api/v1/verified-id/presentation-callback"
    )

    payload: dict[str, Any] = {
        "includeQRCode": True,
        "authority": app_settings.VERIFIED_ID_DID,
        "registration": {
            "clientName": "Helpdesk Identity Verification",
            "purpose": "Verify employee identity for helpdesk request",
        },
        "callback": {
            "url": callback_url,
            "state": session_id,
            "headers": {"api-key": app_settings.API_KEY}
            if app_settings.API_KEY
            else {},
        },
        "requestedCredentials": [
            {
                "type": "VerifiedEmployee",
                "acceptedIssuers": [app_settings.VERIFIED_ID_DID],
                "configuration": {
                    "validation": {
                        "allowRevoked": False,
                        "validateLinkedDomain": True,
                    }
                },
            }
        ],
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            VC_PRESENTATION_API_ENDPOINT,
            json=payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()

    logger.info("Presentation request created: requestId=%s", data.get("requestId"))
    return PresentationResponse(
        request_id=data["requestId"],
        qr_code=data.get("qrCode", ""),
        url=data.get("url", ""),
        expiry=data.get("expiry", ""),
    )
