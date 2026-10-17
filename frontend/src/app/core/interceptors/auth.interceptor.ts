import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpResponse,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, tap, throwError } from "rxjs";
import { Router } from "@angular/router";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem("hms_token");

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  console.log(
    `[HMS HTTP] --> ${req.method} ${req.url}${token ? " (Bearer token attached)" : " (No token)"}`,
  );

  return next(authReq).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        console.log(`[HMS HTTP] <-- ${event.status} ${req.method} ${req.url}`);
      }
    }),
    catchError((error: HttpErrorResponse) => {
      console.error(
        `[HMS HTTP] <-- Error ${error.status} ${req.method} ${req.url}:`,
        error.error || error.message,
      );

      // Avoid redirecting if the 401 originated from login attempt itself
      const isAuthEndpoint =
        req.url.includes("/auth/login") || req.url.includes("/auth/refresh");

      if (error.status === 401 && !isAuthEndpoint) {
        console.warn(
          "[HMS HTTP] 401 Unauthorized encountered. Clearing session and redirecting to /login.",
        );
        localStorage.removeItem("hms_token");
        localStorage.removeItem("hms_user");
        router.navigate(["/login"]);
      }
      return throwError(() => error);
    }),
  );
};
