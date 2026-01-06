import { Routes } from '@angular/router';
import { Register } from './components/register/register';
import { VerifyOtp } from './components/verify-otp/verify-otp';
import { Index } from './components/index';
import { authGuard } from './guards/auth-guard-guard';
import { Login } from './components/login/login';

export const routes: Routes = [
  {
    path: '',
    component: Index,
    canActivate: [authGuard]
  },
  {
    path: 'login',
    component: Login
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
