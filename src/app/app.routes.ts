import { Routes } from '@angular/router';
import { Register } from './components/register/register';
import { VerifyOtp } from './components/verify-otp/verify-otp';

export const routes: Routes = [
  {
    path: 'register',
    component: Register
  },
  {
    path: 'verify-otp',
    component: VerifyOtp
  }
];
