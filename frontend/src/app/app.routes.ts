/**
 * Application routes configuration.
 */
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'verify',
    pathMatch: 'full',
  },
  {
    path: 'verify',
    loadComponent: () =>
      import('./features/verification/verification.component').then(
        (m) => m.VerificationComponent
      ),
    title: 'Vérification identité – Helpdesk',
  },
  {
    path: 'assist',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/assistance-dashboard/assistance-dashboard.component').then(
        (m) => m.AssistanceDashboardComponent
      ),
    title: 'Dashboard assistance – Helpdesk',
  },
  {
    path: 'me',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth-debug/auth-debug.component').then(
        (m) => m.AuthDebugComponent
      ),
    title: 'Mon accès – Diagnostic token',
  },
  {
    path: 'issue',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/issuance/issuance.component').then(
        (m) => m.IssuanceComponent
      ),
    title: 'Émettre un credential – RH',
  },
  {
    path: '**',
    redirectTo: 'verify',
  },
];
