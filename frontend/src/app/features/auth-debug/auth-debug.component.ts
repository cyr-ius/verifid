import { CommonModule } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, inject, signal } from "@angular/core";
import {
  CurrentPrincipalResponse,
  StatusService,
} from "../../core/services/status.service";

type DebugState = "loading" | "success" | "error";

@Component({
  selector: "app-auth-debug",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./auth-debug.component.html",
  styleUrl: "./auth-debug.component.css",
})
export class AuthDebugComponent {
  private readonly statusService = inject(StatusService);

  readonly state = signal<DebugState>("loading");
  readonly principal = signal<CurrentPrincipalResponse | null>(null);
  readonly errorMessage = signal("");

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.state.set("loading");
    this.errorMessage.set("");

    this.statusService.getCurrentPrincipal().subscribe({
      next: (principal) => {
        this.principal.set(principal);
        this.state.set("success");
      },
      error: (error: HttpErrorResponse) => {
        this.principal.set(null);
        this.errorMessage.set(
          error.error?.detail || "Impossible de récupérer les informations du token."
        );
        this.state.set("error");
      },
    });
  }

  formattedRaw(): string {
    return JSON.stringify(this.principal()?.raw ?? {}, null, 2);
  }
}
