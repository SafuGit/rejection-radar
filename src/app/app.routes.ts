import { Routes } from '@angular/router';
import { Register } from './components/register/register';
import { VerifyOtp } from './components/verify-otp/verify-otp';
import { Index } from './components/index';

export const routes: Routes = [
  {
    path: '',
    component: Index
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
