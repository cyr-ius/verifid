"""
Application configuration loaded from environment variables.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings

JSDELIVR = "https://cdn.jsdelivr.net"
MS_LOGIN = "https://login.microsoftonline.com"
MS_STS = "https://sts.windows.net"
VERIFIED_ID = "https://verifiedid.did.msidentity.com"


class Settings(BaseSettings):
    """Application settings from environment variables."""

    AZURE_TENANT_ID: str  # e.g. your-tenant-id-guid
    AZURE_CLIENT_ID: str  # e.g. backend-app-client-id
    AZURE_CLIENT_SECRET: str  # e.g. backend-app-client-secret
    VERIFIED_ID_DID: str  # did:web:yourdomain.com
    APP_BASE_URL: str  # e.g. https://yourdomain.com
    API_KEY: str  # API key for callbacks
    CORS_ORIGINS: list[str] = ["http://localhost:4200"]
    AUTH_ENABLED: bool = True  # Whether to enable authentication (set to False for development without auth)
    AUTH_CLIENT_ID: str  # e.g. frontend-app-client-id
    AUTH_AUDIENCE: str  # e.g. api://your-api-audience, can be comma-separated for multiple audiences
    AUTH_JWKS_CACHE_TTL_SECONDS: int = 3600
    AUTH_SCOPE: str = "access_as_user"  # Scope for frontend authentication
    LOGO_URL: str = "/icons/icon-128x128.png"  # URL to the logo image
    LOG_LEVEL: str = "INFO"  # Logging level (e.g. DEBUG, INFO, WARNING, ERROR)
    SWAGGER_ENABLE: bool = False  # Whether to enable Swagger UI for API documentation

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"

    @property
    def entra_openid_config_url(self) -> str:
        return (
            f"{MS_LOGIN}/{self.AZURE_TENANT_ID}/v2.0/.well-known/openid-configuration"
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
        return [
            f"{MS_LOGIN}/{self.AZURE_TENANT_ID}/v2.0",
            f"{MS_STS}/{self.AZURE_TENANT_ID}/",
        ]

    @property
    def frontend_auth_authority(self) -> str:
        return f"{MS_LOGIN}/{self.AZURE_TENANT_ID}"

    @property
    def frontend_auth_scopes(self) -> list[str]:
        audiences = [
            value.strip() for value in self.AUTH_AUDIENCE.split(",") if value.strip()
        ]
        return [f"{audience}/{self.AUTH_SCOPE}" for audience in audiences] or [
            f"{self.AZURE_CLIENT_ID}/{self.AUTH_SCOPE}"
        ]


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()  # type: ignore


app_settings = get_settings()
