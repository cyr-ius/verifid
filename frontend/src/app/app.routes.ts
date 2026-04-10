/**
 * Application routes configuration.
 */
import { inject } from "@angular/core";
import { CanMatchFn, Route, Router, Routes, UrlSegment } from "@angular/router";
import { authGuard, helpdeskGuard, hrGuard } from "./core/guards/auth.guard";
import { I18nService } from "./core/services/i18n.service";

const localizedPathSet = new Set(["verify", "assist", "me", "issue"]);

function localizedChildren(): Route[] {
  return [
    {
      path: "",
      redirectTo: "verify",
      pathMatch: "full",
    },
    {
      path: "verify",
      loadComponent: () =>
        import("./features/verification/verification.component").then(
          (m) => m.VerificationComponent,
        ),
      title: "Identity verification - Verif'ID",
    },
    {
      path: "assist",
      canActivate: [helpdeskGuard],
      loadComponent: () =>
        import("./features/assistance-dashboard/assistance-dashboard.component").then(
          (m) => m.AssistanceDashboardComponent,
        ),
      title: "Assistance dashboard - Helpdesk",
    },
    {
      path: "me",
      canActivate: [authGuard],
      loadComponent: () =>
        import("./features/auth-debug/auth-debug.component").then(
          (m) => m.AuthDebugComponent,
        ),
      title: "My access - Token diagnostics",
    },
    {
      path: "issue",
      canActivate: [hrGuard],
      loadComponent: () =>
        import("./features/issuance/issuance.component").then(
          (m) => m.IssuanceComponent,
        ),
      title: "Issue a credential - HR",
    },
    {
      path: "**",
      redirectTo: "verify",
    },
  ];
}

const rootRedirectGuard: CanMatchFn = (_route, segments) => {
  if (segments.length !== 0) {
    return false;
  }

  const router = inject(Router);
  const i18n = inject(I18nService);
  const language = i18n.preferredLanguage();
  i18n.setLanguage(language);
  return router.parseUrl(`/${language}/verify`);
};

const legacyPathRedirectGuard: CanMatchFn = (_route, segments: UrlSegment[]) => {
  if (segments.length === 0) {
    return false;
  }

  const firstSegment = segments[0]?.path;
  if (!firstSegment || !localizedPathSet.has(firstSegment)) {
    return false;
  }

  const router = inject(Router);
  const i18n = inject(I18nService);
  const language = i18n.preferredLanguage();
  i18n.setLanguage(language);
  const suffix = segments.map((segment) => segment.path).join("/");
  return router.parseUrl(`/${language}/${suffix}`);
};

const languagePrefixGuard: CanMatchFn = (_route, segments: UrlSegment[]) => {
  const firstSegment = segments[0]?.path;
  if (firstSegment !== "fr" && firstSegment !== "en" && firstSegment !== "es") {
    return false;
  }

  inject(I18nService).setLanguage(firstSegment);
  return true;
};

const fallbackRedirectGuard: CanMatchFn = () => {
  const router = inject(Router);
  const i18n = inject(I18nService);
  const language = i18n.preferredLanguage();
  i18n.setLanguage(language);
  return router.parseUrl(`/${language}/verify`);
};

export const routes: Routes = [
  {
    matcher: (segments) => (segments.length === 0 ? { consumed: [] } : null),
    canMatch: [rootRedirectGuard],
    children: [],
  },
  {
    matcher: (segments) => {
      if (segments.length > 0 && localizedPathSet.has(segments[0]?.path ?? "")) {
        return { consumed: segments };
      }
      return null;
    },
    canMatch: [legacyPathRedirectGuard],
    children: [],
  },
  {
    path: ":lang",
    canMatch: [languagePrefixGuard],
    children: localizedChildren(),
  },
  {
    matcher: (segments) => ({ consumed: segments }),
    canMatch: [fallbackRedirectGuard],
    children: [],
  },
];
