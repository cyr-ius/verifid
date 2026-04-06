"""
Pydantic schemas for Verified ID API Status.
"""

from pydantic import BaseModel


class AuthStatus(BaseModel):
    enabled: bool
    client_id: str = ""
    authority: str = ""
    scopes: list[str] = []


class Status(BaseModel):
    logo: str
    auth: AuthStatus
