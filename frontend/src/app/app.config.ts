/**
 * Angular application configuration.
 * Zoneless mode enabled for optimal performance.
 * Service Worker registered for PWA support (production only).
 */
import {
  APP_INITIALIZER,
  ApplicationConfig,
  isDevMode,
  provideZonelessChangeDetection,
} from "@angular/core";
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from "@angular/common/http";
import { provideRouter, withComponentInputBinding } from "@angular/router";
import { provideServiceWorker } from "@angular/service-worker";
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
    // Zoneless mode for better performance — no zone.js overhead.
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: initializeApplication,
      deps: [StatusService, AuthService],
    },
    // Service Worker — disabled in dev mode to avoid stale cache issues.
    // registerWhenStable:30000 waits for the app to be idle before registering
    // so it doesn't compete with the initial bootstrap for network resources.
    provideServiceWorker("ngsw-worker.js", {
      enabled: !isDevMode(),
      registrationStrategy: "registerWhenStable:30000",
    }),
  ],
};
