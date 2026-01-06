import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HlmButtonImports } from '../../../libs/ui/button/src';
import { HlmCardImports } from '../../../libs/ui/card/src';
import { HlmInputImports } from '../../../libs/ui/input/src';
import { HlmLabelImports } from '../../../libs/ui/label/src';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-verify-otp',
  imports: [
    ReactiveFormsModule,
    HlmCardImports,
    HlmLabelImports,
    HlmInputImports,
    HlmButtonImports,
  ],
  templateUrl: './verify-otp.html',
  styleUrl: './verify-otp.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex items-center justify-center min-h-screen w-full',
  },
})
export class VerifyOtp {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  email = signal<string>('');
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  isLoading = signal(false);
  isResending = signal(false);

  otpForm = this.fb.group({
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  constructor() {
    const emailParam = this.route.snapshot.queryParamMap.get('email');
    if (emailParam) {
      this.email.set(emailParam);
    } else {
      this.router.navigate(['/register']);
    }
  }

  onSubmit() {
    if (this.otpForm.valid && this.email()) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);

      const { otp } = this.otpForm.value;

      this.authService.verifyOtp(this.email(), otp!).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.successMessage.set('Email verified successfully!');
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 1500);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.error?.message || 'Invalid OTP. Please try again.');
        },
      });
    }
  }

  resendOtp() {
    if (this.email()) {
      this.isResending.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);

      this.authService.sendOtp(this.email()).subscribe({
        next: () => {
          this.isResending.set(false);
          this.successMessage.set('OTP sent successfully!');
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (error) => {
          this.isResending.set(false);
          this.errorMessage.set(error.error?.message || 'Failed to resend OTP. Please try again.');
        },
      });
    }
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }
}
