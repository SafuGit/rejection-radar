import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HlmButtonImports } from '../../../libs/ui/button/src';
import { HlmCardImports } from '../../../libs/ui/card/src';
import { HlmInputImports } from '../../../libs/ui/input/src';
import { HlmLabelImports } from '../../../libs/ui/label/src';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    HlmCardImports,
    HlmLabelImports,
    HlmInputImports,
    HlmButtonImports,
  ],
  templateUrl: './register.html',
  styleUrl: './register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex items-center justify-center min-h-screen w-full',
  },
})
export class Register {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  registerForm = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator }
  );

  private passwordMatchValidator(form: any) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      const { email, password } = this.registerForm.value;

      this.authService.register(email!, password!).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.error?.message || 'Registration failed. Please try again.');
        },
      });
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
