/**
 * Root application component.
 * Provides top navigation bar and router outlet.
 */
import { Component, effect, inject, OnInit, signal } from "@angular/core";
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from "@angular/router";
import { Title } from "@angular/platform-browser";
import { filter } from "rxjs";
import { AuthService } from "./core/services/auth.service";
import { AppLanguage, I18nService } from "./core/services/i18n.service";
import { StatusService } from "./core/services/status.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent implements OnInit {
  readonly logoUrl = signal("");
  readonly currentPath = signal("");
  readonly authService = inject(AuthService);
  readonly i18n = inject(I18nService);
  readonly languages = this.i18n.availableLanguages;
  private readonly router = inject(Router);
  private readonly statusService = inject(StatusService);
  private readonly title = inject(Title);

  constructor() {
    effect(() => {
      const path = this.currentPath();
      this.i18n.currentLanguage();
      const titleKey = this.routeTitleKey(path);
      this.title.setTitle(this.i18n.t(titleKey));
    });
  }

  ngOnInit(): void {
    this.currentPath.set(this.router.url);
    this.syncLanguageFromPath(this.router.url);
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const path = (event as NavigationEnd).urlAfterRedirects;
        this.currentPath.set(path);
        this.syncLanguageFromPath(path);
      });

    const cachedSettings = this.statusService.cachedSettings;
    if (cachedSettings) {
      this.logoUrl.set(cachedSettings.logo);
      return;
    }

    this.statusService.getSettings().subscribe((status) => {
      this.logoUrl.set(status.logo);
    });
  }

  login(): void {
    void this.authService.login();
  }

  logout(): void {
    void this.authService.logout();
  }

  setLanguage(language: AppLanguage): void {
    const targetPath = this.stripLanguagePrefix(this.currentPath()) || "/verify";
    this.i18n.setLanguage(language);
    void this.router.navigateByUrl(`/${language}${targetPath}`);
  }

  showLoginAction(): boolean {
    return this.stripLanguagePrefix(this.currentPath()) !== "/verify";
  }

  isActiveLanguage(language: AppLanguage): boolean {
    return this.i18n.currentLanguage() === language;
  }

  languageLabel(language: AppLanguage): string {
    return this.i18n.t(`lang.${language}` as "lang.fr");
  }

  localizedLink(path: string): string[] {
    return ["/", this.i18n.currentLanguage(), path];
  }

  private routeTitleKey(path: string): "route.verify" | "route.assist" | "route.me" | "route.issue" {
    const localizedPath = this.stripLanguagePrefix(path);

    if (localizedPath.startsWith("/assist")) {
      return "route.assist";
    }
    if (localizedPath.startsWith("/me")) {
      return "route.me";
    }
    if (localizedPath.startsWith("/issue")) {
      return "route.issue";
    }
    return "route.verify";
  }

  private stripLanguagePrefix(path: string): string {
    const match = path.match(/^\/(fr|en|es)(\/.*)?$/);
    if (!match) {
      return path || "/verify";
    }
    return match[2] || "/verify";
  }

  private syncLanguageFromPath(path: string): void {
    const match = path.match(/^\/(fr|en|es)(\/|$)/);
    if (match) {
      this.i18n.setLanguage(this.i18n.resolveLanguage(match[1]));
    }
  }
}
