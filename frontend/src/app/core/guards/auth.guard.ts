import { CanActivateFn } from "@angular/router";
import { inject } from "@angular/core";
import { from } from "rxjs";
import { AuthService } from "../services/auth.service";

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  return from(authService.ensureAuthenticated());
};
