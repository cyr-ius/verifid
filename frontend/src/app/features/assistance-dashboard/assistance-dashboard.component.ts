import { CommonModule } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  AssistanceLookupResponse,
  VerifiedIdService,
} from "../../core/services/verified-id.service";

type LookupState = "idle" | "loading" | "success" | "error";

@Component({
  selector: "app-assistance-dashboard",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./assistance-dashboard.component.html",
  styleUrl: "./assistance-dashboard.component.css",
})
export class AssistanceDashboardComponent {
  private readonly verifiedIdService = inject(VerifiedIdService);

  readonly assistanceCode = signal("");
  readonly state = signal<LookupState>("idle");
  readonly result = signal<AssistanceLookupResponse | null>(null);
  readonly errorMessage = signal("");

  lookupByCode(): void {
    const code = this.assistanceCode().trim();
    if (!/^\d{4}$/.test(code)) {
      this.state.set("error");
      this.result.set(null);
      this.errorMessage.set("Saisissez un code d'assistance à 4 chiffres.");
      return;
    }

    this.state.set("loading");
    this.errorMessage.set("");
    this.result.set(null);

    this.verifiedIdService.lookupAssistanceCode(code).subscribe({
      next: (response) => {
        this.result.set(response);
        this.state.set("success");
      },
      error: (error: HttpErrorResponse) => {
        this.state.set("error");
        this.result.set(null);
        this.errorMessage.set(
          error.status === 404
            ? "Aucun dossier de vérification ne correspond à ce code."
            : "Impossible de récupérer les informations de vérification."
        );
      },
    });
  }

  onCodeInput(value: string): void {
    const sanitized = value.replace(/\D/g, "").slice(0, 4);
    this.assistanceCode.set(sanitized);
  }

  reset(): void {
    this.assistanceCode.set("");
    this.result.set(null);
    this.errorMessage.set("");
    this.state.set("idle");
  }

  statusLabel(status: string): string {
    switch (status) {
      case "success":
        return "Vérification réussie";
      case "pending":
        return "En attente";
      case "error":
        return "Échec de vérification";
      case "expired":
        return "Code expiré";
      default:
        return "Statut inconnu";
    }
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case "success":
        return "text-bg-success";
      case "pending":
        return "text-bg-warning";
      case "error":
        return "text-bg-danger";
      case "expired":
        return "text-bg-secondary";
      default:
        return "text-bg-dark";
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
