import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const hasToken = !!localStorage.getItem("hms_token");
  const isAuth = authService.isAuthenticated();
  console.log(
    `[HMS AuthGuard] Checking navigation to '${state.url}'. Has token: ${hasToken}, isAuthenticated: ${isAuth}, currentUser:`,
    authService.currentUser()?.username || "none",
  );

  if (isAuth) {
    console.log(`[HMS AuthGuard] Access granted to '${state.url}'.`);
    return true;
  }

  console.warn(
    `[HMS AuthGuard] Access denied to '${state.url}'. Redirecting to /login.`,
  );
  return router.createUrlTree(["/login"]);
};
