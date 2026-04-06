import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable, firstValueFrom } from "rxjs";

export interface AuthStatusResponse {
  enabled: boolean;
  client_id: string;
  authority: string;
  scopes: string[];
}

export interface StatusResponse {
  logo: string;
  auth: AuthStatusResponse;
}

export interface CurrentPrincipalResponse {
  sub?: string;
  name?: string;
  preferred_username?: string;
  aud?: string;
  iss?: string;
  roles: string[];
  scp: string;
  groups: string[];
  raw: Record<string, unknown>;
}

@Injectable({ providedIn: "root" })
export class StatusService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `/api/v1/status`;
  private settings?: StatusResponse;

  getSettings(): Observable<StatusResponse> {
    return this.http.get<StatusResponse>(`${this.apiBase}`);
  }

  getCurrentPrincipal(): Observable<CurrentPrincipalResponse> {
    return this.http.get<CurrentPrincipalResponse>(`${this.apiBase}/me`);
  }

  async loadSettings(): Promise<StatusResponse> {
    if (this.settings) {
      return this.settings;
    }

    this.settings = await firstValueFrom(this.getSettings());
    return this.settings;
  }

  get cachedSettings(): StatusResponse | undefined {
    return this.settings;
  }
}
