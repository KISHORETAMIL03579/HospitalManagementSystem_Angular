import { Injectable, inject, signal, computed } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Router } from "@angular/router";
import { Observable, tap, catchError, throwError } from "rxjs";
import {
  AuthResponse,
  LoginRequest,
  RegisterUserRequest,
  RoleDto,
  UserDto,
  UpdateProfileRequest,
  ChangePasswordRequest,
  AdminUserDto,
  StaffRegistrationRequest,
} from "../models/auth.models";

import { API_BASE_URL } from "../tokens/api.tokens";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly baseUrl = inject(API_BASE_URL);

  // Signals
  readonly token = signal<string | null>(this.getInitialToken());
  readonly currentUser = signal<UserDto | null>(this.getInitialUser());
  readonly isLoading = signal<boolean>(false);

  // Authenticated state is strictly tied to the reactive token signal
  readonly isAuthenticated = computed(() => !!this.token());

  readonly userRoleName = computed(() => {
    const user = this.currentUser();
    return (user?.roleName || user?.role || "")
      .toString()
      .toLowerCase()
      .replace(/[\s_-]/g, "");
  });

  readonly isPatient = computed(() => {
    const user = this.currentUser();
    const role = this.userRoleName();
    return (
      role === "patient" || user?.hierarchyLevel === 20 || user?.role === 20
    );
  });

  readonly isStaff = computed(() => {
    return !this.isPatient();
  });

  readonly isAdmin = computed(() => {
    const user = this.currentUser();
    const role = this.userRoleName();
    return (
      role === "admin" ||
      role === "hospitalmanager" ||
      (user?.hierarchyLevel ?? 0) >= 90
    );
  });

  constructor() {
    this.refreshCurrentUser();
  }

  private getInitialToken(): string | null {
    try {
      return localStorage.getItem("hms_token");
    } catch {
      return null;
    }
  }

  private getInitialUser(): UserDto | null {
    try {
      const stored = localStorage.getItem("hms_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  clearSession(): void {
    console.log("[HMS AuthService] Clearing session state and tokens.");
    localStorage.removeItem("hms_token");
    localStorage.removeItem("hms_refresh_token");
    localStorage.removeItem("hms_user");
    this.token.set(null);
    this.currentUser.set(null);
  }

  refreshCurrentUser(): void {
    const currentToken = this.token();
    if (!currentToken) {
      console.log("[HMS AuthService] No active session token found in state.");
      return;
    }

    console.log(
      "[HMS AuthService] Found session token, validating via GET /auth/me...",
    );
    this.getCurrentUser().subscribe({
      next: (user) => {
        console.log(
          "[HMS AuthService] Session valid. Active user:",
          user.username,
          `(${user.roleName})`,
        );
        this.currentUser.set(user);
        localStorage.setItem("hms_user", JSON.stringify(user));
      },
      error: (err) => {
        console.warn(
          "[HMS AuthService] /auth/me validation returned error:",
          err?.status,
          err?.message,
        );
        if (err?.status === 401) {
          this.clearSession();
        }
      },
    });
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    console.log(
      `[HMS AuthService] POST ${this.baseUrl}/auth/login for user:`,
      credentials.usernameOrEmail,
    );
    this.isLoading.set(true);
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/login`, credentials)
      .pipe(
        tap((res) => {
          console.log(
            "[HMS AuthService] Login successful! Response payload:",
            res,
          );
          localStorage.setItem("hms_token", res.token);
          if (res.refreshToken) {
            localStorage.setItem("hms_refresh_token", res.refreshToken);
          }
          localStorage.setItem("hms_user", JSON.stringify(res.user));
          this.token.set(res.token);
          this.currentUser.set(res.user);
          this.isLoading.set(false);
          console.log(
            "[HMS AuthService] Auth state established. Authenticated:",
            this.isAuthenticated(),
            "User:",
            this.currentUser()?.username,
          );
        }),
        catchError((err) => {
          console.error("[HMS AuthService] Login request failed:", err);
          this.isLoading.set(false);
          return throwError(() => err);
        }),
      );
  }

  register(data: RegisterUserRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/register`, data)
      .pipe(
        tap((res) => {
          localStorage.setItem("hms_token", res.token);
          localStorage.setItem("hms_user", JSON.stringify(res.user));
          this.currentUser.set(res.user);
        }),
      );
  }

  getCurrentUser(): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.baseUrl}/auth/me`);
  }

  getRoles(): Observable<RoleDto[]> {
    return this.http.get<RoleDto[]>(`${this.baseUrl}/auth/roles`);
  }

  refreshToken(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.baseUrl}/auth/refresh`,
      JSON.stringify(refreshToken),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  updateProfile(data: UpdateProfileRequest): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.baseUrl}/auth/profile`, data).pipe(
      tap((user) => {
        this.currentUser.set(user);
        localStorage.setItem("hms_user", JSON.stringify(user));
      }),
    );
  }

  changePassword(data: ChangePasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/auth/change-password`,
      data,
    );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/auth/forgot-password`,
      { email },
    );
  }

  resetPassword(data: {
    email: string;
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/auth/reset-password`,
      data,
    );
  }

  logout(): void {
    console.log("[HMS AuthService] Logging out user.");
    this.clearSession();
    this.router.navigate(["/login"]);
  }

  // --- Admin User Management Endpoints ---
  getAllAdminUsers(params?: {
    search?: string;
    roleId?: number;
    isActive?: boolean;
  }): Observable<AdminUserDto[]> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set("search", params.search);
    if (params?.roleId)
      httpParams = httpParams.set("roleId", params.roleId.toString());
    if (params?.isActive !== undefined)
      httpParams = httpParams.set("isActive", params.isActive.toString());

    return this.http.get<AdminUserDto[]>(`${this.baseUrl}/admin/users`, {
      params: httpParams,
    });
  }

  createAdminUser(data: {
    fullName: string;
    email: string;
    username: string;
    password: string;
    roleId: number;
    employeeId?: string;
    phone?: string;
  }): Observable<AdminUserDto> {
    return this.http.post<AdminUserDto>(`${this.baseUrl}/admin/users`, data);
  }

  updateAdminUser(
    id: number,
    data: {
      fullName: string;
      email: string;
      employeeId?: string;
      phone?: string;
      password?: string;
      roleId: number;
    },
  ): Observable<AdminUserDto> {
    return this.http.put<AdminUserDto>(
      `${this.baseUrl}/admin/users/${id}`,
      data,
    );
  }

  updateAdminUserRole(id: number, roleId: number): Observable<AdminUserDto> {
    return this.http.put<AdminUserDto>(
      `${this.baseUrl}/admin/users/${id}/role`,
      { roleId },
    );
  }

  changeUserRole(userId: number, roleId: number): Observable<AdminUserDto> {
    return this.updateAdminUserRole(userId, roleId);
  }

  toggleAdminUserStatus(
    id: number,
    isActive: boolean,
  ): Observable<AdminUserDto> {
    return this.http.patch<AdminUserDto>(
      `${this.baseUrl}/admin/users/${id}/status`,
      { isActive },
    );
  }

  toggleUserStatus(id: number, isActive: boolean): Observable<AdminUserDto> {
    return this.toggleAdminUserStatus(id, isActive);
  }

  getAdminUsers(params?: {
    search?: string;
    roleId?: number;
    isActive?: boolean;
  }): Observable<AdminUserDto[]> {
    return this.getAllAdminUsers(params);
  }

  deleteAdminUser(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/admin/users/${id}`,
    );
  }

  // --- Staff Registration & Onboarding Endpoints ---
  submitStaffRegistration(data: any): Observable<StaffRegistrationRequest> {
    return this.http.post<StaffRegistrationRequest>(
      `${this.baseUrl}/staff-registration/requests`,
      data,
    );
  }

  getStaffRequests(status?: number): Observable<StaffRegistrationRequest[]> {
    let httpParams = new HttpParams();
    if (status !== undefined)
      httpParams = httpParams.set("status", status.toString());

    return this.http.get<StaffRegistrationRequest[]>(
      `${this.baseUrl}/admin/staff-registration/requests`,
      { params: httpParams },
    );
  }

  getStaffRequestById(id: number): Observable<StaffRegistrationRequest> {
    return this.http.get<StaffRegistrationRequest>(
      `${this.baseUrl}/admin/staff-registration/requests/${id}`,
    );
  }

  approveStaffRequest(
    requestId: number,
    data: { authorizedRoleId?: number; notes?: string } | number,
  ): Observable<StaffRegistrationRequest> {
    const payload =
      typeof data === "number" ? { authorizedRoleId: data } : data;
    return this.http.post<StaffRegistrationRequest>(
      `${this.baseUrl}/admin/staff-registration/requests/${requestId}/approve`,
      payload,
    );
  }

  rejectStaffRequest(
    requestId: number,
    reason: string,
  ): Observable<StaffRegistrationRequest> {
    return this.http.post<StaffRegistrationRequest>(
      `${this.baseUrl}/admin/staff-registration/requests/${requestId}/reject`,
      { reason },
    );
  }

  updateStaffRequest(
    requestId: number,
    data: {
      fullName?: string;
      email?: string;
      employeeId?: string;
      requestedRoleId?: number;
      departmentId?: number;
      status?: number;
      rejectionReason?: string;
    },
  ): Observable<StaffRegistrationRequest> {
    return this.http.put<StaffRegistrationRequest>(
      `${this.baseUrl}/admin/staff-registration/requests/${requestId}`,
      data,
    );
  }

  retryStaffEmail(requestId: number): Observable<StaffRegistrationRequest> {
    return this.http.post<StaffRegistrationRequest>(
      `${this.baseUrl}/admin/staff-registration/requests/${requestId}/retry-email`,
      {},
    );
  }

  getRegistrationStatus(email: string): Observable<StaffRegistrationRequest> {
    const params = new HttpParams().set("email", email);
    return this.http.get<StaffRegistrationRequest>(
      `${this.baseUrl}/staff-registration/status`,
      { params },
    );
  }
}
