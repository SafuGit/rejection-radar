import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export const authGuard: CanActivateFn = () => {
  const isBrowser = typeof window !== 'undefined';
  const router = inject(Router);
  const token =  isBrowser ? localStorage.getItem('token') : null;

  if (token && !isTokenExpired(token)) {
    return true;
  }

  if (isBrowser) {
    localStorage.removeItem('token');
  }
  return router.createUrlTree(['/login']);
};
