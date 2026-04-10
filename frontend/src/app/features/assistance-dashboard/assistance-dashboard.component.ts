/**
 * AssistanceDashboardComponent – Helpdesk verification flow.
 *
 * New flow:
 *  1. Helpdesk clicks "Démarrer" → backend creates a session and returns a 4-digit code
 *  2. The 4-digit code is displayed prominently for the helpdesk to read aloud
 *  3. The component polls the session until the employee completes verification
 *  4. Claims are displayed once the verification succeeds
 */
import { CommonModule } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, OnDestroy, inject, signal } from "@angular/core";
import { Subscription } from "rxjs";
import {
  VerificationStatus,
  VerifiedIdService,
} from "../../core/services/verified-id.service";

type DashboardState = "idle" | "loading" | "waiting" | "success" | "error";

@Component({
  selector: "app-assistance-dashboard",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./assistance-dashboard.component.html",
  styleUrl: "./assistance-dashboard.component.css",
})
export class AssistanceDashboardComponent implements OnDestroy {
  private readonly verifiedIdService = inject(VerifiedIdService);

  readonly state = signal<DashboardState>("idle");

  /** 4-digit code to communicate verbally to the employee. */
  readonly assistanceCode = signal("");

  /** Session ID used to poll status updates. */
  readonly sessionId = signal("");

  /** Verified claims once verification succeeds. */
  readonly verifiedClaims = signal<Record<string, string | null> | null>(null);

  readonly errorMessage = signal("");

  private pollSubscription?: Subscription;

  /** Start a new helpdesk assistance session. */
  startSession(): void {
    this.state.set("loading");
    this.errorMessage.set("");
    this.verifiedClaims.set(null);

    this.verifiedIdService.createAssistanceSession().subscribe({
      next: (resp) => {
        this.assistanceCode.set(resp.code);
        this.sessionId.set(resp.session_id);
        this.state.set("waiting");
        this.pollSession(resp.session_id);
      },
      error: (error: HttpErrorResponse) => {
        this.state.set("error");
        this.errorMessage.set(
          error.error?.detail ||
            "Impossible de créer la session de vérification. Veuillez réessayer.",
        );
      },
    });
  }

  /** Poll the backend until the employee completes verification. */
  private pollSession(sessionId: string): void {
    this.pollSubscription = this.verifiedIdService
      .pollStatus(sessionId)
      .subscribe({
        next: (status: VerificationStatus) => {
          if (status.status === "success") {
            this.verifiedClaims.set(
              (status.claims as Record<string, string | null>) ?? {},
            );
            this.state.set("success");
          } else if (status.status === "error") {
            this.errorMessage.set(
              status.error_message ?? "La vérification a échoué.",
            );
            this.state.set("error");
          }
        },
        error: () => {
          this.state.set("error");
          this.errorMessage.set(
            "Erreur de communication avec le serveur. Veuillez réessayer.",
          );
        },
      });
  }

  /** Reset to initial idle state. */
  reset(): void {
    this.pollSubscription?.unsubscribe();
    this.state.set("idle");
    this.assistanceCode.set("");
    this.sessionId.set("");
    this.verifiedClaims.set(null);
    this.errorMessage.set("");
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }

  statusLabel(status: string): string {
    switch (status) {
      case "success":
        return "Vérification réussie";
      case "waiting":
        return "En attente";
      case "error":
        return "Échec de vérification";
      case "expired":
        return "Code expiré";
      default:
        return "Statut inconnu";
    }
  }

  verifiedFullName(claims?: Record<string, string | null>): string {
    if (!claims) {
      return "";
    }
    const firstName = claims["given_name"]?.trim() ?? "";
    const lastName = claims["family_name"]?.trim() ?? "";
    return `${firstName} ${lastName}`.trim();
  }

  claimLabel(key: string): string {
    switch (key) {
      case "given_name":
        return "Prénom";
      case "family_name":
        return "Nom";
      case "employee_id":
        return "Identifiant employé";
      case "job_title":
        return "Poste";
      case "department":
        return "Département";
      default:
        return key;
    }
  }
}
