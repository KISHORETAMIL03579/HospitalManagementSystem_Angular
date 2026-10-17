import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";
import { roleGuard, STAFF_ROLES, ADMIN_ROLES } from "./core/guards/role.guard";
import { AppLayoutComponent } from "./layout/app-layout.component";

export const routes: Routes = [
  {
    path: "login",
    loadComponent: () =>
      import("./features/auth/pages/login-page/login-page.component").then(
        (m) => m.LoginPageComponent,
      ),
  },
  {
    path: "reset-password",
    loadComponent: () =>
      import("./features/auth/pages/reset-password-page/reset-password-page.component").then(
        (m) => m.ResetPasswordPageComponent,
      ),
  },
  {
    path: "contact",
    loadComponent: () =>
      import("./features/auth/pages/contact-page/contact-page.component").then(
        (m) => m.ContactPageComponent,
      ),
  },
  {
    path: "",
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: "",
        pathMatch: "full",
        loadComponent: () =>
          import("./features/dashboard/pages/dashboard-page/dashboard-page.component").then(
            (m) => m.DashboardPageComponent,
          ),
      },
      {
        path: "patients",
        loadComponent: () =>
          import("./features/patients/pages/patient-list-page/patient-list-page.component").then(
            (m) => m.PatientListPageComponent,
          ),
      },
      {
        path: "patients/new",
        canActivate: [roleGuard],
        data: { roles: STAFF_ROLES },
        loadComponent: () =>
          import("./features/patients/pages/patient-create-page/patient-create-page.component").then(
            (m) => m.PatientCreatePageComponent,
          ),
      },
      {
        path: "doctors",
        canActivate: [roleGuard],
        data: { roles: STAFF_ROLES },
        loadComponent: () =>
          import("./features/doctors/pages/doctor-list-page/doctor-list-page.component").then(
            (m) => m.DoctorListPageComponent,
          ),
      },
      {
        path: "appointments",
        loadComponent: () =>
          import("./features/appointments/pages/appointment-list-page/appointment-list-page.component").then(
            (m) => m.AppointmentListPageComponent,
          ),
      },
      {
        path: "admin",
        canActivate: [roleGuard],
        data: { roles: ADMIN_ROLES },
        loadComponent: () =>
          import("./features/admin/pages/admin-dashboard-page/admin-dashboard-page.component").then(
            (m) => m.AdminDashboardPageComponent,
          ),
      },
      {
        path: "admin/staff-approvals",
        canActivate: [roleGuard],
        data: { roles: ADMIN_ROLES },
        loadComponent: () =>
          import("./features/admin/pages/staff-approval-page/staff-approval-page.component").then(
            (m) => m.StaffApprovalPageComponent,
          ),
      },
      {
        path: "admin/users",
        canActivate: [roleGuard],
        data: { roles: ADMIN_ROLES },
        loadComponent: () =>
          import("./features/admin/pages/user-management-page/user-management-page.component").then(
            (m) => m.UserManagementPageComponent,
          ),
      },
      {
        path: "settings",
        loadComponent: () =>
          import("./features/settings/pages/settings-page/settings-page.component").then(
            (m) => m.SettingsPageComponent,
          ),
      },
      {
        path: "notifications",
        loadComponent: () =>
          import("./features/notifications/pages/notification-page/notification-page.component").then(
            (m) => m.NotificationPageComponent,
          ),
      },
    ],
  },
  {
    path: "**",
    redirectTo: "",
  },
];
