/**
 * VerificationComponent – Employee identity verification flow.
 *
 * New flow:
 *  1. Employee receives a 4-digit code verbally from the helpdesk
 *  2. Employee enters the code here
 *  3. A QR code is generated for them to scan with Microsoft Authenticator
 *  4. The component polls until verification is confirmed or fails
 */
import { Component, OnDestroy, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
import { I18nService } from "../../core/services/i18n.service";
import {
  VerifiedIdService,
  VerificationStatus,
} from "../../core/services/verified-id.service";

type VerifyState = "idle" | "loading" | "qr" | "success" | "error";

@Component({
  selector: "app-verification",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./verification.component.html",
  styleUrl: "./verification.component.css",
})
export class VerificationComponent implements OnDestroy {
  private readonly verifiedIdService = inject(VerifiedIdService);
  readonly i18n = inject(I18nService);

  /** Current UI state */
  state = signal<VerifyState>("idle");

  /** 4-digit code entered by the employee */
  enteredCode = signal<string>("");

  /** Base64 QR code PNG data */
  qrCode = signal<string>("");

  /** Deep-link for mobile (no QR scanner needed) */
  deepLink = signal<string>("");

  /** Verified claims from the presented credential */
  verifiedClaims = signal<Record<string, string> | null>(null);

  /** Error message to display */
  errorMessage = signal<string>("");

  private pollSubscription?: Subscription;

  /** Sanitize input: digits only, max 4 chars. */
  onCodeInput(value: string): void {
    const sanitized = value.replace(/\D/g, "").slice(0, 4);
    this.enteredCode.set(sanitized);
  }

  /** Submit the 4-digit code to retrieve the QR presentation. */
  submitCode(): void {
    const code = this.enteredCode().trim();
    if (!/^\d{4}$/.test(code)) {
      this.state.set("error");
      this.errorMessage.set(this.i18n.t("verification.error.code"));
      return;
    }

    this.state.set("loading");
    this.errorMessage.set("");
    this.verifiedClaims.set(null);

    this.verifiedIdService.verifyCredentialByCode(code).subscribe({
      next: (resp) => {
        this.qrCode.set(resp.qr_code);
        this.deepLink.set(resp.url);
        this.state.set("qr");
        this.pollSession(resp.request_id);
      },
      error: (err) => {
        this.state.set("error");
        this.errorMessage.set(
          err.error?.detail ||
            this.i18n.t("verification.error.notFound"),
        );
      },
    });
  }

  /** Poll the backend for the session result. */
  private pollSession(sessionId: string): void {
    this.pollSubscription = this.verifiedIdService
      .pollStatus(sessionId)
      .subscribe({
        next: (status: VerificationStatus) => {
          if (status.status === "success") {
            this.verifiedClaims.set(status.claims ?? {});
            this.state.set("success");
          } else if (status.status === "error") {
            this.errorMessage.set(
              status.error_message ?? this.i18n.t("verification.error.failed"),
            );
            this.state.set("error");
          }
        },
        error: () => {
          this.state.set("error");
          this.errorMessage.set(this.i18n.t("verification.error.communication"));
        },
      });
  }

  /** Reset to initial state. */
  reset(): void {
    this.pollSubscription?.unsubscribe();
    this.state.set("idle");
    this.enteredCode.set("");
    this.qrCode.set("");
    this.deepLink.set("");
    this.verifiedClaims.set(null);
    this.errorMessage.set("");
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }
}
