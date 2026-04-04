/**
 * IssuanceComponent – HR issuance flow.
 * Allows HR to enter employee data and issue a VerifiedEmployee credential.
 */
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField, required } from '@angular/forms/signals';
import {
  VerifiedIdService,
  EmployeeIssuanceRequest,
} from '../../core/services/verified-id.service';

type IssueState = 'form' | 'loading' | 'qr' | 'success' | 'error';

@Component({
  selector: 'app-issuance',
  standalone: true,
  imports: [CommonModule, FormField],
  templateUrl: './issuance.component.html',
  styleUrl: './issuance.component.css',
})
export class IssuanceComponent {
  private readonly verifiedIdService = inject(VerifiedIdService);

  state = signal<IssueState>('form');
  qrCode = signal<string>('');
  deepLink = signal<string>('');
  errorMessage = signal<string>('');

  // Signal Form model
  private readonly formInit: EmployeeIssuanceRequest = {
    employee_id: '',
    given_name: '',
    family_name: '',
    job_title: '',
    department: '',
  };

  formModel = signal({ ...this.formInit });

  employeeForm = form(this.formModel, (path) => {
    required(path.employee_id);
    required(path.given_name);
    required(path.family_name);
    required(path.job_title);
    required(path.department);
  });

  onSubmit(event: Event): void {
    event.preventDefault();
    // Angular Signal Forms submit handler
    const values = this.formModel();
    this.state.set('loading');
    this.errorMessage.set('');

    this.verifiedIdService.issueCredential(values).subscribe({
      next: (resp) => {
        this.qrCode.set(resp.qr_code);
        this.deepLink.set(resp.url);
        this.state.set('qr');
      },
      error: () => {
        this.state.set('error');
        this.errorMessage.set(
          'Impossible de créer la demande d\'émission. Veuillez réessayer.'
        );
      },
    });
  }

  reset(): void {
    this.formModel.set({ ...this.formInit });
    this.state.set('form');
    this.qrCode.set('');
    this.deepLink.set('');
    this.errorMessage.set('');
  }
}
