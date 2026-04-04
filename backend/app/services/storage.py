# storage.py
import random
import uuid
from typing import Any, Literal

from pydantic import BaseModel

# ---------------------------------------------------------------------------
# In-memory session store (replace with Redis / DB in production)
# ---------------------------------------------------------------------------
sessions: dict[str, dict[str, Any]] = {}


class Session(BaseModel):
    status: Literal["pending", "success", "error"]
    type: Literal["verification", "issuance"]
    claims: dict
    code: str | None = None
    error_message: str | None = None


def create_session(code: str | None = None):
    session_id = str(uuid.uuid4())
    if code:
        sessions[session_id] = Session(
            status="pending", type="verification", code=code, claims={}
        ).model_dump()
    else:
        sessions[session_id] = Session(
            status="pending", type="issuance", claims={}
        ).model_dump()
    return session_id


def assign_code(session_id):
    code = f"{random.randint(1000, 9999)}"
    while any(data.get("code") == code for data in sessions.values()):
        code = f"{random.randint(1000, 9999)}"

    if session_id in sessions:
        sessions[session_id]["code"] = code

    return code


def find_by_code(code):
    for session_id, data in sessions.items():
        if data.get("code") == code:
            return session_id, data
    return None, None
