import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http
      .post<{ token: string }>('/api/login', { email, password })
      .pipe(tap((res) => localStorage.setItem('token', res.token)));
  }

  register(email: string, password: string) {
    return this.http.post('/api/auth/register', { email, password });
  }

  sendOtp(email: string) {
    return this.http.post('/api/auth/send-otp', { email });
  }

  verifyOtp(email: string, otp: string) {
    return this.http.post<{ token: string }>('/api/auth/verify-token', { email, otp }).pipe(
      tap((res) => {
        localStorage.setItem('token', res.token);
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
  }

  isLoggedIn() {
    return !!localStorage.getItem('token');
  }

  getToken() {
    return localStorage.getItem('token');
  }
}
