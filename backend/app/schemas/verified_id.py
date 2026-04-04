"""
Pydantic schemas for Microsoft Entra Verified ID API.
"""

from typing import Any

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Issuance schemas
# ---------------------------------------------------------------------------


class EmployeeIssuanceRequest(BaseModel):
    """Request body to issue a Verified Employee credential."""

    employee_id: str = Field(..., description="Company employee identifier")
    given_name: str = Field(..., min_length=1, description="First name")
    family_name: str = Field(..., min_length=1, description="Last name")
    job_title: str = Field(..., description="Job title")
    department: str = Field(..., description="Department")


class IssuanceRequest(BaseModel):
    """Internal issuance request model."""

    employee_id: str
    given_name: str
    family_name: str
    job_title: str
    department: str
    session_id: str


class IssuanceResponse(BaseModel):
    """Response from the Verified ID issuance API."""

    request_id: str
    qr_code: str = Field(description="Base64 encoded QR code PNG image")
    url: str = Field(description="Deep link URL for Microsoft Authenticator")
    expiry: str = ""


# ---------------------------------------------------------------------------
# Presentation / verification schemas
# ---------------------------------------------------------------------------


class PresentationRequest(BaseModel):
    """Internal presentation request model."""

    session_id: str


class PresentationResponse(BaseModel):
    """Response from the Verified ID presentation API."""

    request_id: str
    qr_code: str = Field(description="Base64 encoded QR code PNG image")
    url: str = Field(description="Deep link URL for Microsoft Authenticator")
    expiry: int = Field(description="Expiration time in ISO 8601 format")
    assistance_code: str = Field(
        default="", description="Short code shared with the user"
    )


# ---------------------------------------------------------------------------
# Callback schemas (received from Microsoft Verified ID service)
# ---------------------------------------------------------------------------


class CallbackError(BaseModel):
    """Error detail in a callback payload."""

    code: str
    message: str


class IssuanceCallbackPayload(BaseModel):
    """Callback payload sent by Microsoft after an issuance attempt."""

    request_id: str = Field(alias="requestId")
    request_status: str = Field(alias="requestStatus")
    state: str
    error: CallbackError | None = None

    class Config:
        populate_by_name = True


class PresentedClaims(BaseModel):
    """Claims extracted from a presented verifiable credential."""

    employee_id: str | None = Field(None, alias="employeeId")
    given_name: str | None = None
    family_name: str | None = None
    job_title: str | None = Field(None, alias="jobTitle")
    department: str | None = None

    class Config:
        populate_by_name = True


class VerifiedCredentialData(BaseModel):
    """Credential data returned in a presentation callback."""

    claims: dict[str, Any] = Field(default_factory=dict)


class PresentationCallbackPayload(BaseModel):
    """Callback payload sent by Microsoft after a presentation attempt."""

    request_id: str = Field(alias="requestId")
    request_status: str = Field(alias="requestStatus")
    state: str
    subject: str | None = None
    claims: PresentedClaims | None = None
    verified_credentials_data: list[VerifiedCredentialData] = Field(
        default_factory=list, alias="verifiedCredentialsData"
    )
    error: CallbackError | None = None

    class Config:
        populate_by_name = True


# ---------------------------------------------------------------------------
# Session polling schemas
# ---------------------------------------------------------------------------


class VerificationStatus(BaseModel):
    """Verification session status returned to the frontend via polling."""

    session_id: str
    status: str  # pending | success | error | expired
    claims: dict[str, Any] | None = None
    code: str | None = None
    error_message: str | None = None


class AssistanceLookupResponse(BaseModel):
    """Verification details returned to the helpdesk dashboard."""

    session_id: str
    code: str
    status: str  # pending | success | error | expired
    is_verified: bool
    claims: dict[str, Any] | None = None
    error_message: str | None = None
