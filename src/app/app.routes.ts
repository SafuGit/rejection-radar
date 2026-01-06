import { Routes } from '@angular/router';
import { Register } from './components/register/register';
import { VerifyOtp } from './components/verify-otp/verify-otp';
import { Index } from './components/index';
import { authGuard } from './guards/auth-guard-guard';

export const routes: Routes = [
  {
    path: '',
    component: Index,
    canActivate: [authGuard]
  },
  {
    path: 'register',
    component: Register
  },
  {
    path: 'verify-otp',
    component: VerifyOtp
  }
];
