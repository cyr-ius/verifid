"""
Application configuration loaded from environment variables.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # Azure Entra / MSAL settings
    AZURE_TENANT_ID: str
    AZURE_CLIENT_ID: str
    AZURE_CLIENT_SECRET: str

    # Microsoft Entra Verified ID settings
    VC_AUTHORITY_DID: str  # did:web:yourdomain.com

    # Callback configuration - must be a publicly accessible HTTPS URL
    APP_BASE_URL: str  # e.g. https://yourdomain.com
    VC_API_KEY: str = ""  # Optional API key for callbacks

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:4200"]

    # Session / security
    SECRET_KEY: str = "change-me-in-production"
    AUTH_ENABLED: bool = False
    AUTH_AUDIENCE: str = ""
    AUTH_ISSUERS: str = ""
    AUTH_OPENID_CONFIG_URL: str = ""
    AUTH_JWKS_CACHE_TTL_SECONDS: int = 3600
    AUTH_ROLE_HELPDESK: str = "helpdesk"
    AUTH_ROLE_HR: str = "hr"
    AUTH_SCOPE_HELPDESK: str = "access_as_user"
    FRONTEND_AUTH_CLIENT_ID: str = ""
    FRONTEND_AUTH_AUTHORITY: str = ""
    FRONTEND_AUTH_SCOPES: str = ""

    # Logo URL
    LOGO_URL: str = "https://placehold.co/140x36/FFFFFF/122147?text=Verified+ID"

    # Verification ID Issuer request
    ISSUER_REQUEST: bool = True

    # Log level
    LOG_LEVEL: str = "INFO"

    # Swagger
    SWAGGER_ENABLE: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"

    @property
    def entra_openid_config_url(self) -> str:
        if self.AUTH_OPENID_CONFIG_URL:
            return self.AUTH_OPENID_CONFIG_URL
        return (
            f"https://login.microsoftonline.com/{self.AZURE_TENANT_ID}"
            "/v2.0/.well-known/openid-configuration"
        )

    @property
    def auth_audiences(self) -> list[str]:
        configured = [value.strip() for value in self.AUTH_AUDIENCE.split(",")]
        audiences = [value for value in configured if value]
        if audiences:
            return audiences
        return [self.AZURE_CLIENT_ID]

    @property
    def auth_issuers(self) -> list[str]:
        configured = [value.strip() for value in self.AUTH_ISSUERS.split(",")]
        issuers = [value for value in configured if value]
        if issuers:
            return issuers
        return [
            f"https://login.microsoftonline.com/{self.AZURE_TENANT_ID}/v2.0",
            f"https://sts.windows.net/{self.AZURE_TENANT_ID}/",
        ]

    @property
    def frontend_auth_authority(self) -> str:
        if self.FRONTEND_AUTH_AUTHORITY:
            return self.FRONTEND_AUTH_AUTHORITY
        return f"https://login.microsoftonline.com/{self.AZURE_TENANT_ID}"

    @property
    def frontend_auth_scopes(self) -> list[str]:
        scopes = [scope.strip() for scope in self.FRONTEND_AUTH_SCOPES.split(",")]
        return [scope for scope in scopes if scope]


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()  # type: ignore


app_settings = get_settings()
