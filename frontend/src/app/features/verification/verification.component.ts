/**
 * VerificationComponent – Helpdesk identity verification flow.
 * Displays a QR code and polls the backend until the employee
 * has presented their Verified Employee credential.
 */
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  VerifiedIdService,
  VerificationStatus,
} from '../../core/services/verified-id.service';

type VerifyState = 'idle' | 'loading' | 'qr' | 'success' | 'error';

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verification.component.html',
  styleUrl: './verification.component.css',
})
export class VerificationComponent implements OnDestroy {
  private readonly verifiedIdService = inject(VerifiedIdService);

  /** Current UI state */
  state = signal<VerifyState>('idle');

  /** Base64 QR code PNG data */
  qrCode = signal<string>('');

  /** Deep-link for mobile (no QR scanner needed) */
  deepLink = signal<string>('');

  /** Short code to share with the user and support team */
  assistanceCode = signal<string>('');

  /** Verified claims from the presented credential */
  verifiedClaims = signal<Record<string, string> | null>(null);

  /** Error message to display */
  errorMessage = signal<string>('');

  private pollSubscription?: Subscription;

  /** Start a new verification session. */
  startVerification(): void {
    this.state.set('loading');
    this.errorMessage.set('');
    this.verifiedClaims.set(null);

    this.verifiedIdService.startVerification().subscribe({
      next: (resp) => {
        this.qrCode.set(resp.qr_code);
        this.deepLink.set(resp.url);
        this.assistanceCode.set(resp.assistance_code);
        this.state.set('qr');
        this.pollSession(resp.request_id);
      },
      error: () => {
        this.state.set('error');
        this.errorMessage.set(
          'Unable to contact the Verified ID service. Please try again.'
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
          if (status.status === 'success') {
            this.verifiedClaims.set(status.claims ?? {});
            this.state.set('success');
          } else if (status.status === 'error') {
            this.errorMessage.set(
              status.error_message ?? 'Verification failed.'
            );
            this.state.set('error');
          }
        },
        error: () => {
          this.state.set('error');
          this.errorMessage.set('Polling error. Please refresh and try again.');
        },
      });
  }

  /** Reset to initial state. */
  reset(): void {
    this.pollSubscription?.unsubscribe();
    this.state.set('idle');
    this.qrCode.set('');
    this.deepLink.set('');
    this.assistanceCode.set('');
    this.verifiedClaims.set(null);
    this.errorMessage.set('');
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }
}
