import { Injectable, computed, signal } from "@angular/core";
import {
  AccountInfo,
  AuthenticationResult,
  EventMessage,
  EventType,
  PublicClientApplication,
} from "@azure/msal-browser";
import { jwtDecode } from "jwt-decode";
import { StatusResponse } from "./status.service";

const PUBLIC_API_PATHS = [
  "/api/health",
  "/api/v1/status",
  "/api/v1/verified-id/verify",
];
const PUBLIC_API_PREFIXES = ["/api/v1/verified-id/status/"];

@Injectable({ providedIn: "root" })
export class AuthService {
  private msal?: PublicClientApplication;
  private authEnabled = false;
  private scopes: string[] = [];
  private initialized = false;

  readonly account = signal<AccountInfo | null>(null);
  readonly isAuthenticated = computed(() => this.account() !== null);
  readonly isEnabled = signal(false);

  /** Roles extracted from the id token claims (field "roles"). */
  readonly roles = signal<string[]>([]);

  /** True if the user has the helpdesk role. */
  readonly isHelpdesk = computed(() => {
    if (!this.isEnabled()) {
      return true;
    }
    return this.roles().includes("helpdesk");
  });

  /** True if the user has the HR role. */
  readonly isHR = computed(() => {
    if (!this.isEnabled()) {
      return true;
    }
    return this.roles().includes("hr");
  });

  async initialize(settings: StatusResponse): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.authEnabled =
      settings.auth.enabled &&
      settings.auth.client_id.trim().length > 0 &&
      settings.auth.authority.trim().length > 0;
    this.isEnabled.set(this.authEnabled);
    this.scopes = settings.auth.scopes;
    this.initialized = true;

    if (!this.authEnabled) {
      return;
    }

    this.msal = new PublicClientApplication({
      auth: {
        clientId: settings.auth.client_id,
        authority: settings.auth.authority,
        redirectUri: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
      },
      cache: {
        cacheLocation: "sessionStorage",
      },
    });

    await this.msal.initialize();
    this.msal.addEventCallback((event: EventMessage) => {
      if (
        event.eventType === EventType.LOGIN_SUCCESS ||
        event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS
      ) {
        const payload = event.payload as AuthenticationResult | null;
        if (payload?.account) {
          this.setActiveAccount(payload.account);
        }

        if (payload?.accessToken) {
          try {
            const decoded = jwtDecode(payload.accessToken) as Record<
              string,
              unknown
            >;
            if (decoded && typeof decoded === "object") {
              const rolesClaim = decoded["roles"];
              if (Array.isArray(rolesClaim)) {
                const roles = rolesClaim.filter(
                  (r): r is string => typeof r === "string",
                );
                this.roles.set(roles);
              }
            }
          } catch (e) {
            console.warn("Failed to decode access token:", e);
          }
        }
      }
    });

    const redirectResult = await this.msal.handleRedirectPromise();
    if (redirectResult?.account) {
      this.setActiveAccount(redirectResult.account);
      return;
    }

    const existingAccount =
      this.msal.getActiveAccount() ?? this.msal.getAllAccounts()[0];
    if (existingAccount) {
      this.setActiveAccount(existingAccount);
    }
  }

  async login(): Promise<void> {
    if (!this.msal || !this.authEnabled) {
      return;
    }
    await this.msal.loginRedirect({ scopes: this.loginScopes });
  }

  async logout(): Promise<void> {
    if (!this.msal || !this.authEnabled) {
      return;
    }
    await this.msal.logoutRedirect({ account: this.account() ?? undefined });
  }

  async acquireAccessToken(): Promise<string | null> {
    if (!this.msal || !this.authEnabled) {
      return null;
    }

    const activeAccount = this.account() ?? this.msal.getActiveAccount();
    if (!activeAccount) {
      await this.login();
      return null;
    }

    try {
      const response = await this.msal.acquireTokenSilent({
        account: activeAccount,
        scopes: this.requestScopes,
      });
      this.setActiveAccount(response.account ?? activeAccount);
      return response.accessToken;
    } catch {
      await this.msal.acquireTokenRedirect({
        account: activeAccount,
        scopes: this.requestScopes,
      });
      return null;
    }
  }

  shouldAttachToken(url: string): boolean {
    if (!this.authEnabled) {
      return false;
    }
    const normalizedUrl = this.normalizeApiUrl(url);
    if (!normalizedUrl.startsWith("/api/")) {
      return false;
    }
    if (PUBLIC_API_PATHS.includes(normalizedUrl)) {
      return false;
    }
    return !PUBLIC_API_PREFIXES.some((prefix) =>
      normalizedUrl.startsWith(prefix),
    );
  }

  async ensureAuthenticated(): Promise<boolean> {
    if (!this.authEnabled) {
      return true;
    }
    if (this.isAuthenticated()) {
      return true;
    }
    await this.login();
    return false;
  }

  private setActiveAccount(account: AccountInfo): void {
    this.msal?.setActiveAccount(account);
    this.account.set(account);
  }

  private get loginScopes(): string[] {
    return this.requestScopes.length > 0
      ? this.requestScopes
      : ["openid", "profile", "offline_access"];
  }

  private get requestScopes(): string[] {
    return this.scopes.length > 0 ? this.scopes : ["openid", "profile"];
  }

  private normalizeApiUrl(url: string): string {
    if (url.startsWith("/")) {
      return url;
    }
    if (url.startsWith(window.location.origin)) {
      return url.slice(window.location.origin.length);
    }
    return url;
  }
}
