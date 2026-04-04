import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { from } from "rxjs";
import { switchMap } from "rxjs/operators";
import { AuthService } from "../services/auth.service";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const isPublicStatusEndpoint =
    req.url === "/api/v1/status" ||
    req.url === `${window.location.origin}/api/v1/status`;

  if (!authService.shouldAttachToken(req.url) || isPublicStatusEndpoint) {
    return next(req);
  }

  return from(authService.acquireAccessToken()).pipe(
    switchMap((token) => {
      if (!token) {
        return next(req);
      }

      return next(
        req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );
    }),
  );
};
