import { HttpHandlerFn, HttpRequest } from "@angular/common/http";

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const isBrowser = typeof window !== 'undefined';
  if (!isBrowser) {
    return next(req);
  }

  const token = localStorage.getItem('authToken');
  if (token) {
    const clonedReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(clonedReq);
  }

  return next(req);
}
