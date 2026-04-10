# storage.py
import logging
import random
import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel

# ---------------------------------------------------------------------------
# In-memory session store (replace with Redis / DB in production)
# ---------------------------------------------------------------------------
sessions: dict[str, dict[str, Any]] = {}
logger = logging.getLogger(__name__)


class Session(BaseModel):
    """Session model for verification and issuance flows."""

    status: Literal["pending", "success", "error"]
    type: Literal["verification", "issuance"]
    claims: dict
    code: str | None = None
    error_message: str | None = None
    created_at: datetime = datetime.now()
    updated_at: float | None = None


def create_session(
    session_type: Literal["verification", "issuance"] = "verification",
) -> str:
    """
    Create a new session with a unique ID.

    Args:
        session_type: Type of session to create.

    Returns:
        str: The newly created session ID.
    """
    session_id = str(uuid.uuid4())
    sessions[session_id] = Session(
        status="pending",
        type=session_type,
        claims={},
    ).model_dump()
    logger.info(f"Created new session {session_id} of type {session_type}")
    return session_id


def generate_code_for_session(session_id: str) -> str:
    """
    Generate a unique 4-digit assistance code and attach it to an existing session.

    The code is guaranteed to be unique across all active sessions.
    If a session already has a code assigned, its old code is released before
    assigning a new one (prevents duplicate codes in the store).

    Args:
        session_id: The session to attach the code to.

    Returns:
        str: The generated 4-digit code.

    Raises:
        KeyError: If the session_id does not exist.
    """
    if session_id not in sessions:
        raise KeyError(f"Session {session_id!r} not found.")

    # Collect all codes currently in use by *other* sessions.
    used_codes = {
        data.get("code")
        for sid, data in sessions.items()
        if sid != session_id and data.get("code")
    }

    # Draw a random code until we find one that is not already in use.
    code = f"{random.randint(1000, 9999)}"
    while code in used_codes:
        code = f"{random.randint(1000, 9999)}"

    sessions[session_id]["code"] = code
    return code


def find_by_code(code: str) -> tuple[str | None, dict | None]:
    """
    Look up a session by its 4-digit assistance code.

    Args:
        code: The 4-digit code to search for.

    Returns:
        Tuple of (session_id, session_data) or (None, None) if not found.
    """
    for session_id, data in sessions.items():
        if data.get("code") == code:
            return session_id, data
    return None, None
