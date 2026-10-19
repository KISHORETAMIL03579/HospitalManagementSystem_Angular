import { inject } from "@angular/core";
import { CanActivateFn, Router, ActivatedRouteSnapshot } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { UserRole } from "../models/auth.models";

export const normalizeRoleToLevel = (
  roleOrLevel: UserRole | string | number | undefined,
): number => {
  if (roleOrLevel === undefined || roleOrLevel === null) return 0;
  if (typeof roleOrLevel === "number") return roleOrLevel;
  const str = String(roleOrLevel)
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  switch (str) {
    case "admin":
      return UserRole.Admin;
    case "hospitalmanager":
      return UserRole.HospitalManager;
    case "doctor":
      return UserRole.Doctor;
    case "pharmacist":
      return UserRole.Pharmacist;
    case "labtechnician":
    case "labtech":
      return UserRole.LabTechnician;
    case "nurse":
      return UserRole.Nurse;
    case "receptionist":
      return UserRole.Receptionist;
    case "patient":
      return UserRole.Patient;
    default:
      return Number(str) || 0;
  }
};

export const STAFF_ROLES = [
  UserRole.Admin,
  UserRole.HospitalManager,
  UserRole.Doctor,
  UserRole.Nurse,
  UserRole.Receptionist,
];

export const ADMIN_ROLES = [UserRole.Admin, UserRole.HospitalManager];

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    console.warn("[HMS RoleGuard] Not authenticated, redirecting to /login.");
    return router.createUrlTree(["/login"]);
  }

  const allowedRoles = route.data["roles"] as
    (UserRole | string | number)[] | undefined;
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  const user = authService.currentUser();
  if (!user) {
    console.warn(
      "[HMS RoleGuard] No user data available yet for role check. Fallback to /.",
    );
    return router.createUrlTree(["/"]);
  }

  const userLevel =
    normalizeRoleToLevel(user.role) ||
    (typeof user.hierarchyLevel === "number" ? user.hierarchyLevel : 0) ||
    normalizeRoleToLevel(user.roleName);
  const allowedLevels = allowedRoles.map(normalizeRoleToLevel);

  if (allowedLevels.includes(userLevel)) {
    return true;
  }

  console.warn(
    `[HMS RoleGuard] Access denied for user '${user.username}' (level ${userLevel}). Redirecting to /.`,
  );
  return router.createUrlTree(["/"]);
};
