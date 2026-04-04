/**
 * Root application component.
 * Provides top navigation bar and router outlet.
 */
import { Component, inject, OnInit, signal } from "@angular/core";
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from "@angular/router";
import { filter } from "rxjs";
import { AuthService } from "./core/services/auth.service";
import { StatusService } from "./core/services/status.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent implements OnInit {
  readonly title = "Verified ID – Portail Entreprise";
  readonly logoUrl = signal("");
  readonly issuer = signal<boolean>(false);
  readonly currentPath = signal("");
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly statusService = inject(StatusService);

  ngOnInit(): void {
    this.currentPath.set(this.router.url);
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentPath.set((event as NavigationEnd).urlAfterRedirects);
      });

    const cachedSettings = this.statusService.cachedSettings;
    if (cachedSettings) {
      this.logoUrl.set(cachedSettings.logo);
      this.issuer.set(cachedSettings.issuer);
      return;
    }

    this.statusService.getSettings().subscribe((status) => {
      this.logoUrl.set(status.logo);
      this.issuer.set(status.issuer);
    });
  }

  login(): void {
    void this.authService.login();
  }

  logout(): void {
    void this.authService.logout();
  }

  showLoginAction(): boolean {
    return this.currentPath() !== "/verify";
  }
}
