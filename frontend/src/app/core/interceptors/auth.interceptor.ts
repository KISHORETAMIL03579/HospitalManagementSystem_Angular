import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpResponse,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, tap, throwError } from "rxjs";
import { Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { environment } from "../../../environments/environment";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = authService.token() || localStorage.getItem("hms_token");

  // Distributed Tracing: Attach or reuse X-Correlation-ID
  const correlationId =
    req.headers.get("X-Correlation-ID") ||
    (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  const authReq = req.clone({
    setHeaders: {
      "X-Correlation-ID": correlationId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!environment.production) {
    console.log(
      `[HMS HTTP] --> ${req.method} ${req.url} [Trace: ${correlationId}]${token ? " (Bearer token attached)" : " (No token)"}`,
    );
  }

  return next(authReq).pipe(
    tap((event) => {
      if (!environment.production && event instanceof HttpResponse) {
        const respCorrId =
          event.headers.get("X-Correlation-ID") || correlationId;
        console.log(
          `[HMS HTTP] <-- ${event.status} ${req.method} ${req.url} [Trace: ${respCorrId}]`,
        );
      }
    }),
    catchError((error: HttpErrorResponse) => {
      const respCorrId =
        error.error?.correlationId ||
        error.headers?.get("X-Correlation-ID") ||
        correlationId;

      console.error(
        `[HMS HTTP] <-- Error ${error.status} ${req.method} ${req.url} [Trace: ${respCorrId}]:`,
        error.error || error.message,
      );

      if (error.status === 429) {
        console.warn(
          `[HMS HTTP] Rate limit exceeded (HTTP 429). Please slow down your requests. [Trace: ${respCorrId}]`,
        );
      }

      // Avoid redirecting if the 401 originated from login attempt itself
      const isAuthEndpoint =
        req.url.includes("/auth/login") || req.url.includes("/auth/refresh");

      if (error.status === 401 && !isAuthEndpoint) {
        console.warn(
          `[HMS HTTP] 401 Unauthorized encountered. Clearing session and redirecting to /login. [Trace: ${respCorrId}]`,
        );
        authService.clearSession();
        if (router.url !== "/login") {
          router.navigate(["/login"]);
        }
      }
      return throwError(() => error);
    }),
  );
};
