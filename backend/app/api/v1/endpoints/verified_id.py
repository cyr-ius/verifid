"""
API endpoints for Microsoft Entra Verified ID issuance and verification.

Flows supported:
  1. Issuance  – HR issues a VerifiedEmployee credential to an employee's
                 Microsoft Authenticator wallet.
  2. Verification – Helpdesk requests proof of identity; employee scans QR
                    code and the result is polled by the helpdesk UI.
"""

import logging

from fastapi import APIRouter, Depends, Header, HTTPException, status

from ....core.config import app_settings
from ....schemas.verified_id import (
    AssistanceLookupResponse,
    EmployeeIssuanceRequest,
    IssuanceCallbackPayload,
    IssuanceResponse,
    PresentationCallbackPayload,
    PresentationResponse,
    VerificationStatus,
)
from ....services.storage import assign_code, create_session, find_by_code, sessions
from ....services.verified_id_service import (
    create_issuance_request,
    create_presentation_request,
)
from .depends import issuer_request, require_helpdesk_access, require_hr_access

logger = logging.getLogger(__name__)
router = APIRouter()


def _extract_presented_claims(payload: PresentationCallbackPayload) -> dict:
    """Return claims from the presentation callback payload."""
    if payload.verified_credentials_data:
        return payload.verified_credentials_data[0].claims

    if payload.claims:
        return payload.claims.model_dump(exclude_none=True)

    return {}


# ---------------------------------------------------------------------------
# Issuance endpoints
# ---------------------------------------------------------------------------


@router.post(
    "/issue",
    response_model=IssuanceResponse,
    summary="Request VC issuance for an employee",
)
async def issue_credential(
    body: EmployeeIssuanceRequest,
    _: bool = Depends(issuer_request),
    __: dict = Depends(require_hr_access),
) -> IssuanceResponse:
    """
    Initiate a Verifiable Credential issuance for the given employee.
    Returns a QR code that the employee scans with Microsoft Authenticator.

    Args:
        body: Employee data to embed in the credential.

    Returns:
        IssuanceResponse: QR code and deep-link URL.
    """
    session_id = create_session()

    try:
        result = await create_issuance_request(
            employee_id=body.employee_id,
            given_name=body.given_name,
            family_name=body.family_name,
            job_title=body.job_title,
            department=body.department,
            session_id=session_id,
        )
    except Exception as exc:
        logger.exception("Issuance request failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to create issuance request with Verified ID service.",
        ) from exc

    return result


@router.post(
    "/issuance-callback",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Callback from Microsoft Verified ID after issuance",
)
async def issuance_callback(
    payload: IssuanceCallbackPayload,
    api_key: str = Header(alias="api-key"),
    _: bool = Depends(issuer_request),
) -> None:
    """
    Receives status updates from the Microsoft Verified ID service after
    an issuance attempt.

    Args:
        payload: Callback payload from Microsoft.
        api_key: Optional API key header for security.
    """
    if app_settings.VC_API_KEY and api_key != app_settings.VC_API_KEY:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    session = sessions.get(payload.state, {})
    if payload.request_status == "issuance_successful":
        session["status"] = "success"
        logger.info("Credential issued successfully for session %s", payload.state)
    elif payload.request_status == "issuance_failed":
        session["status"] = "error"
        session["error_message"] = (
            payload.error.message if payload.error else "Issuance failed"
        )
        logger.warning("Issuance failed for session %s", payload.state)

    sessions[payload.state] = session


# ---------------------------------------------------------------------------
# Verification / presentation endpoints
# ---------------------------------------------------------------------------


@router.post(
    "/verify",
    response_model=PresentationResponse,
    summary="Request VC presentation from an employee (helpdesk flow)",
)
async def verify_credential(
    _: bool = Depends(require_helpdesk_access),
) -> PresentationResponse:
    """
    Initiate a Verifiable Credential presentation request.
    The helpdesk displays the returned QR code; the employee scans it with
    Microsoft Authenticator to prove their identity.

    Returns:
        PresentationResponse: QR code and deep-link URL.
    """
    session_id = create_session()
    assistance_code = assign_code(session_id)

    try:
        result = await create_presentation_request(session_id=session_id)
    except Exception as exc:
        logger.exception("Presentation request failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to create presentation request with Verified ID service.",
        ) from exc

    # Attach session_id to the response so the frontend can poll
    result.request_id = session_id
    result.assistance_code = assistance_code
    return result


@router.post(
    "/presentation-callback",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Callback from Microsoft Verified ID after presentation",
)
async def presentation_callback(
    payload: PresentationCallbackPayload,
    api_key: str = Header(alias="api-key"),
) -> None:
    """
    Receives status updates from the Microsoft Verified ID service after
    a presentation attempt.  Updates the session store so the polling
    endpoint can inform the helpdesk UI.

    Args:
        payload: Callback payload from Microsoft.
        api_key: Optional API key header for security.
    """
    if app_settings.VC_API_KEY and api_key != app_settings.VC_API_KEY:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    session = sessions.get(payload.state, {})

    if payload.request_status == "presentation_verified":
        session["status"] = "success"
        session["claims"] = _extract_presented_claims(payload)
        logger.debug("Presentation verified for session %s", payload.state)
    elif payload.request_status in ("presentation_error", "request_retrieved"):
        if payload.request_status == "presentation_error":
            session["status"] = "error"
            session["error_message"] = (
                payload.error.message if payload.error else "Presentation failed"
            )
            logger.warning("Presentation error for session %s", payload.state)
    # "request_retrieved" means the user scanned the QR code – keep pending

    sessions[payload.state] = session


# ---------------------------------------------------------------------------
# Polling endpoint
# ---------------------------------------------------------------------------


@router.get(
    "/status/{session_id}",
    response_model=VerificationStatus,
    summary="Poll verification / issuance session status",
)
async def get_session_status(session_id: str) -> VerificationStatus:
    """
    Returns the current status of an issuance or verification session.
    The frontend polls this endpoint after displaying the QR code.

    Args:
        session_id: UUID returned when the request was created.

    Returns:
        VerificationStatus: Current status and optional claims.
    """
    session = sessions.get(session_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found.",
        )

    return VerificationStatus(
        session_id=session_id,
        status=session.get("status", "pending"),
        claims=session.get("claims"),
        code=session.get("code"),
        error_message=session.get("error_message"),
    )


@router.get(
    "/assist/{code}",
    response_model=AssistanceLookupResponse,
    summary="Look up verification result by helpdesk assistance code",
)
async def get_assistance_verification(
    code: str,
    _: dict = Depends(require_helpdesk_access),
) -> AssistanceLookupResponse:
    """
    Returns the verification result associated with a short assistance code.

    Args:
        code: Short code shared with the user during the verification flow.

    Returns:
        AssistanceLookupResponse: Verification details for the helpdesk dashboard.
    """
    session_id, session = find_by_code(code)
    if session_id is None or session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Code {code} not found.",
        )

    current_status = session.get("status", "pending")
    return AssistanceLookupResponse(
        session_id=session_id,
        code=code,
        status=current_status,
        is_verified=current_status == "success",
        claims=session.get("claims"),
        error_message=session.get("error_message"),
    )
