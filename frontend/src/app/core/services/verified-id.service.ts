/**
 * Service for interacting with the Verified ID backend API.
 * Handles issuance requests, verification requests, and session polling.
 *
 * New verification flow:
 *  1. Helpdesk calls createAssistanceSession() → gets session_id + code
 *  2. Helpdesk communicates the code verbally to the employee
 *  3. Employee calls verifyCredentialByCode(code) → gets QR code to scan
 *  4. Both sides poll pollStatus(session_id) for the result
 */
import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, interval, switchMap, takeWhile } from "rxjs";

export interface EmployeeIssuanceRequest {
  employee_id: string;
  given_name: string;
  family_name: string;
  job_title: string;
  department: string;
}

export interface IssuanceResponse {
  request_id: string;
  qr_code: string; // base64 PNG
  url: string; // deep-link for Authenticator
  expiry: number;
}

/** Response when the helpdesk creates an assistance session. */
export interface AssistanceSessionResponse {
  session_id: string;
  code: string; // 4-digit code to communicate verbally to the employee
}

export interface PresentationResponse {
  request_id: string;
  qr_code: string;
  url: string;
  expiry: number;
  assistance_code: string;
}

export interface VerificationStatus {
  session_id: string;
  status: "pending" | "success" | "error" | "expired";
  claims?: Record<string, string>;
  code?: string;
  error_message?: string;
}

export interface AssistanceLookupResponse {
  session_id: string;
  code: string;
  status: "pending" | "success" | "error" | "expired";
  is_verified: boolean;
  claims?: Record<string, string | null>;
  error_message?: string;
}

@Injectable({ providedIn: "root" })
export class VerifiedIdService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `/api/v1/verified-id`;

  /** Issue a VerifiedEmployee credential to an employee (HR flow). */
  issueCredential(data: EmployeeIssuanceRequest): Observable<IssuanceResponse> {
    return this.http.post<IssuanceResponse>(`${this.apiBase}/issue`, data);
  }

  /**
   * Helpdesk creates a verification session.
   * Returns a session_id (for polling) and a 4-digit code to read aloud to the employee.
   */
  createAssistanceSession(): Observable<AssistanceSessionResponse> {
    return this.http.post<AssistanceSessionResponse>(
      `${this.apiBase}/assist/create`,
      {},
    );
  }

  /**
   * Employee submits the 4-digit code received verbally from the helpdesk.
   * Returns a QR code for the employee to scan with Microsoft Authenticator.
   */
  verifyCredentialByCode(code: string): Observable<PresentationResponse> {
    return this.http.post<PresentationResponse>(
      `${this.apiBase}/verify/${code}`,
      {},
    );
  }

  /** Poll session status every 2 seconds until terminal state. */
  pollStatus(sessionId: string): Observable<VerificationStatus> {
    return interval(2000).pipe(
      switchMap(() =>
        this.http.get<VerificationStatus>(
          `${this.apiBase}/status/${sessionId}`,
        ),
      ),
      takeWhile(
        (s) => s.status === "pending",
        true, // emit the terminal value too
      ),
    );
  }

  /** Retrieve verification details from the helpdesk assistance code. */
  lookupAssistanceCode(code: string): Observable<AssistanceLookupResponse> {
    return this.http.get<AssistanceLookupResponse>(
      `${this.apiBase}/assist/${code}`,
    );
  }
}
