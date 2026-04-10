import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { from, map, switchMap } from "rxjs";
import { AuthService } from "../services/auth.service";

/** Redirects to /verify if the user is not authenticated. */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  return from(authService.ensureAuthenticated());
};

/** Allows access only if the user has the helpdesk role. */
export const helpdeskGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  // Wait for MSAL init (roles are restored from token cache) before checking
  return from(authService.initialized$).pipe(
    switchMap(() => from(authService.ensureAuthenticated())),
    map((authenticated) => {
      if (!authenticated) {
        return false;
      }
      if (authService.isHelpdesk()) {
        return true;
      }
      return router.createUrlTree(["/verify"]);
    }),
  );
};

/** Allows access only if the user has the hr role. */
export const hrGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return from(authService.initialized$).pipe(
    switchMap(() => from(authService.ensureAuthenticated())),
    map((authenticated) => {
      if (!authenticated) {
        return false;
      }
      if (authService.isHR()) {
        return true;
      }
      return router.createUrlTree(["/verify"]);
    }),
  );
};
