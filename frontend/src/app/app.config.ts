/**
 * Angular application configuration.
 * Zoneless mode enabled for optimal performance.
 */
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from "@angular/common/http";
import {
  APP_INITIALIZER,
  ApplicationConfig,
  provideZonelessChangeDetection,
} from "@angular/core";
import { provideRouter, withComponentInputBinding } from "@angular/router";
import { authInterceptor } from "./core/interceptors/auth.interceptor";
import { AuthService } from "./core/services/auth.service";
import { StatusService } from "./core/services/status.service";
import { routes } from "./app.routes";

function initializeApplication(
  statusService: StatusService,
  authService: AuthService,
) {
  return async () => {
    const settings = await statusService.loadSettings();
    await authService.initialize(settings);
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    // Zoneless mode for better performance
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: initializeApplication,
      deps: [StatusService, AuthService],
    },
  ],
};
