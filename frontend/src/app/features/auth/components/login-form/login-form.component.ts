import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "@core/services/auth.service";
import { UserRole } from "@core/models/auth.models";
import { IconComponent } from "@shared/components/icon/icon.component";
import { RegistrationStatusModalComponent } from "@features/auth/components/registration-status-modal/registration-status-modal.component";

type LoginStatusType =
  | "ACCOUNT_INACTIVE"
  | "ACCOUNT_PENDING_APPROVAL"
  | "ACCOUNT_REJECTED"
  | "ACCOUNT_NOT_FOUND"
  | "INVALID_CREDENTIALS"
  | "GENERIC_ERROR";

@Component({
  selector: "app-login-form",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    RegistrationStatusModalComponent,
  ],
  template: `
    <div
      class="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12"
    >
      <!-- LEFT PANEL: Healthcare Branding & Security Showcase -->
      <div
        class="md:col-span-5 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden min-h-[480px]"
      >
        <div
          class="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"
        ></div>
        <div
          class="absolute left-0 bottom-0 -translate-x-12 translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"
        ></div>

        <div class="relative z-10 space-y-6">
          <div
            class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/15 text-xs font-semibold text-blue-200"
          >
            <app-icon
              name="activity"
              [size]="16"
              className="text-blue-400 animate-pulse"
            ></app-icon>
            <span>CareFlow HMS v2.5</span>
          </div>

          <div>
            <h1
              class="text-2xl font-bold tracking-tight text-white flex items-center gap-2"
            >
              <app-icon
                name="stethoscope"
                [size]="28"
                className="text-blue-400"
              ></app-icon>
              <span>Hospital Management System</span>
            </h1>
            <p class="text-xs text-blue-200 mt-2 leading-relaxed">
              Enterprise clinical platform with Dynamic RBAC security,
              multidisciplinary patient EMR, and real-time doctor scheduling.
            </p>
          </div>

          <div class="space-y-3 pt-4 border-t border-white/10 text-xs">
            <div class="flex items-center gap-2.5 text-blue-100">
              <app-icon
                name="check-circle"
                [size]="16"
                className="text-emerald-400 shrink-0"
              ></app-icon>
              <span>DPDP Act 2023 & ABDM Data Compliant</span>
            </div>
            <div class="flex items-center gap-2.5 text-blue-100">
              <app-icon
                name="check-circle"
                [size]="16"
                className="text-emerald-400 shrink-0"
              ></app-icon>
              <span>Dynamic RBAC Claims Authorization</span>
            </div>
            <div class="flex items-center gap-2.5 text-blue-100">
              <app-icon
                name="check-circle"
                [size]="16"
                className="text-emerald-400 shrink-0"
              ></app-icon>
              <span>AES-256 Encrypted Patient Records</span>
            </div>
            <div class="flex items-center gap-2.5 text-blue-100">
              <app-icon
                name="check-circle"
                [size]="16"
                className="text-emerald-400 shrink-0"
              ></app-icon>
              <span>24/7 Ward Intake & Prescription Workflow</span>
            </div>
          </div>
        </div>

        <div
          class="relative z-10 pt-6 border-t border-white/10 text-[11px] text-blue-300 flex items-center gap-2"
        >
          <app-icon
            name="shield-check"
            [size]="16"
            className="text-emerald-400 shrink-0"
          ></app-icon>
          <span>Authorized Hospital Personnel Only</span>
        </div>
      </div>

      <!-- RIGHT PANEL: Sign In / Staff Onboarding Form Container -->
      <div
        class="md:col-span-7 p-8 sm:p-10 space-y-6 flex flex-col justify-center"
      >
        <div class="space-y-5">
          <!-- Header & Mode Switcher -->
          <div
            class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4"
          >
            <div>
              <h2 class="text-xl font-bold text-slate-900 dark:text-white">
                {{
                  activeTab() === "login"
                    ? "Staff Sign In"
                    : "Create Staff Account"
                }}
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {{
                  activeTab() === "login"
                    ? "Enter your credentials to access hospital modules"
                    : "Complete staff onboarding with authorization code"
                }}
              </p>
            </div>

            <div class="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                (click)="switchTab('login')"
                [class]="
                  'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ' +
                  (activeTab() === 'login'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white')
                "
              >
                Sign In
              </button>
              <button
                type="button"
                (click)="switchTab('register')"
                [class]="
                  'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ' +
                  (activeTab() === 'register'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white')
                "
              >
                Create Account
              </button>
            </div>
          </div>

          <!-- SIGN IN FORM -->
          <div *ngIf="activeTab() === 'login'" class="space-y-4">
            <!-- Alert Messages -->
            <div
              *ngIf="notRegisteredMessage()"
              class="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2"
            >
              <div
                class="flex items-start gap-2 text-amber-800 dark:text-amber-200 text-xs font-semibold"
              >
                <app-icon
                  name="alert-circle"
                  [size]="16"
                  className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                ></app-icon>
                <span>{{ notRegisteredMessage() }}</span>
              </div>
              <p class="text-[11px] text-amber-700 dark:text-amber-300">
                This account identity is not registered. Would you like to
                create a new staff account now?
              </p>
              <button
                type="button"
                (click)="switchTab('register')"
                class="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <app-icon name="user-plus" [size]="14"></app-icon>
                <span>Create Staff Account Now</span>
              </button>
            </div>

            <div
              *ngIf="accountStatusError()?.code === 'ACCOUNT_INACTIVE'"
              class="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2"
            >
              <div class="flex items-start gap-2.5">
                <app-icon
                  name="alert-circle"
                  [size]="20"
                  className="text-amber-600 shrink-0 mt-0.5"
                ></app-icon>
                <div
                  class="space-y-1 text-xs text-amber-800 dark:text-amber-200"
                >
                  <h4
                    class="font-bold text-sm text-amber-900 dark:text-amber-100"
                  >
                    Account Inactive
                  </h4>
                  <p class="leading-relaxed">
                    Your account has been created but is currently inactive. You
                    cannot sign in until your account is activated by an
                    authorized hospital administrator.
                  </p>
                  <p
                    class="text-[11px] font-medium text-amber-700 dark:text-amber-300"
                  >
                    Please contact your hospital administrator or the IT support
                    team to request activation.
                  </p>
                </div>
              </div>
            </div>

            <div
              *ngIf="accountStatusError()?.code === 'ACCOUNT_PENDING_APPROVAL'"
              class="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2"
            >
              <div class="flex items-start gap-2.5">
                <app-icon
                  name="clock"
                  [size]="20"
                  className="text-blue-600 shrink-0 mt-0.5"
                ></app-icon>
                <div class="space-y-1 text-xs text-blue-800 dark:text-blue-200">
                  <h4
                    class="font-bold text-sm text-blue-900 dark:text-blue-100"
                  >
                    Registration Awaiting Approval
                  </h4>
                  <p class="leading-relaxed">
                    {{ accountStatusError()?.details }}
                  </p>
                  <button
                    type="button"
                    (click)="isStatusModalOpen.set(true)"
                    class="mt-1 text-xs font-semibold text-blue-700 dark:text-blue-300 underline hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                  >
                    <app-icon name="shield-check" [size]="14"></app-icon>
                    <span>Check Request Status</span>
                  </button>
                </div>
              </div>
            </div>

            <div
              *ngIf="accountStatusError()?.code === 'ACCOUNT_REJECTED'"
              class="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl space-y-2"
            >
              <div class="flex items-start gap-2.5">
                <app-icon
                  name="alert-circle"
                  [size]="20"
                  className="text-rose-600 shrink-0 mt-0.5"
                ></app-icon>
                <div class="space-y-1 text-xs text-rose-800 dark:text-rose-200">
                  <h4
                    class="font-bold text-sm text-rose-900 dark:text-rose-100"
                  >
                    Registration Not Approved
                  </h4>
                  <p class="leading-relaxed">
                    {{ accountStatusError()?.details }}
                  </p>
                </div>
              </div>
            </div>

            <div
              *ngIf="accountStatusError()?.code === 'INVALID_CREDENTIALS'"
              class="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3 text-rose-800 dark:text-rose-200 text-xs font-medium"
            >
              <app-icon
                name="alert-circle"
                [size]="16"
                className="text-rose-600 shrink-0"
              ></app-icon>
              <span>{{
                accountStatusError()?.details ||
                  "Invalid password or username. Please check your credentials."
              }}</span>
            </div>

            <!-- Login Form Elements -->
            <form (ngSubmit)="onLoginSubmit()" class="space-y-4">
              <div>
                <label
                  class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Username or Work Email
                </label>
                <div class="relative">
                  <app-icon
                    name="user"
                    [size]="16"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  ></app-icon>
                  <input
                    type="text"
                    required
                    [(ngModel)]="loginUsername"
                    name="username"
                    placeholder="Enter username or work email"
                    class="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label
                  class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Password
                </label>
                <div class="relative">
                  <app-icon
                    name="lock"
                    [size]="16"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  ></app-icon>
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    required
                    [(ngModel)]="loginPassword"
                    name="password"
                    placeholder="••••••••"
                    class="w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    (click)="showPassword.set(!showPassword())"
                    class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <app-icon
                      [name]="showPassword() ? 'eye-off' : 'eye'"
                      [size]="16"
                    ></app-icon>
                  </button>
                </div>
              </div>

              <!-- Options Row -->
              <div class="flex items-center justify-between text-xs">
                <label
                  class="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 select-none"
                >
                  <input
                    type="checkbox"
                    [(ngModel)]="rememberMe"
                    name="rememberMe"
                    class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Remember me</span>
                </label>

                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    (click)="isStatusModalOpen.set(true)"
                    class="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-1 cursor-pointer"
                  >
                    <app-icon
                      name="shield-check"
                      [size]="14"
                      className="text-indigo-500"
                    ></app-icon>
                    <span>Check Request Status</span>
                  </button>

                  <button
                    type="button"
                    (click)="isForgotModalOpen.set(true)"
                    class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                [disabled]="isLoggingIn()"
                class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <app-icon name="activity" [size]="16"></app-icon>
                <span>{{
                  isLoggingIn() ? "Authenticating..." : "Sign In to HMS"
                }}</span>
              </button>
            </form>
          </div>

          <!-- CREATE ACCOUNT (STAFF ONBOARDING) FORM -->
          <div *ngIf="activeTab() === 'register'">
            <form (ngSubmit)="handleRegisterSubmit()" class="space-y-4">
              <div
                *ngIf="regError()"
                class="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3 text-rose-800 dark:text-rose-200 text-xs font-medium"
              >
                <app-icon
                  name="alert-circle"
                  [size]="16"
                  className="text-rose-600 shrink-0"
                ></app-icon>
                <span>{{ regError() }}</span>
              </div>

              <div
                *ngIf="regSuccess()"
                class="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-emerald-800 dark:text-emerald-200 text-xs font-medium"
              >
                <app-icon
                  name="check-circle"
                  [size]="16"
                  className="text-emerald-600 shrink-0"
                ></app-icon>
                <span>{{ regSuccess() }}</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Sarah Jenkins"
                    [(ngModel)]="regData.fullName"
                    name="fullName"
                    class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:outline-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="sjenkins"
                    [(ngModel)]="regData.username"
                    name="regUsername"
                    class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:outline-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="sarah@hospital.com"
                    [(ngModel)]="regData.email"
                    name="regEmail"
                    class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:outline-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Employee ID
                  </label>
                  <input
                    type="text"
                    placeholder="EMP-00125"
                    [(ngModel)]="regData.employeeId"
                    name="employeeId"
                    class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:outline-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label
                  class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Invitation / Authorization Code
                </label>
                <input
                  type="text"
                  placeholder="Enter administrator invitation code (e.g. INV-ADMIN-2026)"
                  [(ngModel)]="regData.invitationCode"
                  name="invitationCode"
                  class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:outline-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
                <p class="text-[11px] text-slate-400 mt-1">
                  Use the invitation code provided by your hospital
                  administrator for role verification.
                </p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Password *
                  </label>
                  <div class="relative">
                    <input
                      [type]="showRegPassword() ? 'text' : 'password'"
                      required
                      placeholder="••••••••"
                      [(ngModel)]="regData.password"
                      name="regPassword"
                      class="w-full px-3 py-2 pr-8 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:outline-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      (click)="showRegPassword.set(!showRegPassword())"
                      class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <app-icon
                        [name]="showRegPassword() ? 'eye-off' : 'eye'"
                        [size]="14"
                      ></app-icon>
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Confirm Password *
                  </label>
                  <div class="relative">
                    <input
                      [type]="showRegConfirmPassword() ? 'text' : 'password'"
                      required
                      placeholder="••••••••"
                      [(ngModel)]="regData.confirmPassword"
                      name="regConfirmPassword"
                      class="w-full px-3 py-2 pr-8 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:outline-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      (click)="
                        showRegConfirmPassword.set(!showRegConfirmPassword())
                      "
                      class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <app-icon
                        [name]="showRegConfirmPassword() ? 'eye-off' : 'eye'"
                        [size]="14"
                      ></app-icon>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Password Strength Meter -->
              <div *ngIf="regData.password" class="space-y-1">
                <div class="flex justify-between items-center text-[11px]">
                  <span class="text-slate-500 dark:text-slate-400 font-medium"
                    >Password Strength:</span
                  >
                  <span
                    [class]="
                      'font-semibold ' +
                      (passwordStrength().label === 'Weak'
                        ? 'text-rose-600'
                        : passwordStrength().label === 'Medium'
                          ? 'text-amber-600'
                          : 'text-emerald-600')
                    "
                  >
                    {{ passwordStrength().label }}
                  </span>
                </div>
                <div
                  class="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden"
                >
                  <div
                    [class]="
                      'h-full transition-all duration-300 ' +
                      passwordStrength().color
                    "
                    [style.width.%]="(passwordStrength().score / 5) * 100"
                  ></div>
                </div>
              </div>

              <button
                type="submit"
                [disabled]="isRegistering()"
                class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <app-icon name="user-plus" [size]="16"></app-icon>
                <span>{{
                  isRegistering()
                    ? "Registering Staff Account..."
                    : "Create Account"
                }}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- FORGOT PASSWORD MODAL -->
      <div
        *ngIf="isForgotModalOpen()"
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      >
        <div
          class="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800"
        >
          <div
            class="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3"
          >
            <div>
              <span
                class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider"
              >
                Account Recovery Workflow
              </span>
              <h2
                class="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 mt-0.5"
              >
                <app-icon
                  name="key"
                  [size]="20"
                  className="text-indigo-600"
                ></app-icon>
                <span>Reset Staff Password</span>
              </h2>
            </div>
            <button
              type="button"
              (click)="isForgotModalOpen.set(false)"
              aria-label="Close modal"
              title="Close modal"
              class="cf-modal-close-btn"
            >
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>

          <div
            *ngIf="forgotSuccess()"
            class="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2"
          >
            <div
              class="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-bold"
            >
              <app-icon
                name="check-circle"
                [size]="16"
                className="text-emerald-600"
              ></app-icon>
              <span>Password Reset Token Generated!</span>
            </div>
            <p
              class="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed"
            >
              {{ forgotSuccess() }}
            </p>
            <button
              type="button"
              (click)="isForgotModalOpen.set(false); forgotSuccess.set(null)"
              class="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold mt-2 cursor-pointer"
            >
              Return to Sign In
            </button>
          </div>

          <form
            *ngIf="!forgotSuccess()"
            (ngSubmit)="handleForgotSubmit()"
            class="space-y-4"
          >
            <p
              class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed"
            >
              Enter your registered hospital work email address below. We will
              send a secure password reset link to your verified account.
            </p>

            <div
              *ngIf="forgotError()"
              class="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2"
            >
              <app-icon
                name="alert-circle"
                [size]="16"
                className="text-rose-600 shrink-0 mt-0.5"
              ></app-icon>
              <p
                class="text-xs text-rose-700 dark:text-rose-400 leading-relaxed"
              >
                {{ forgotError() }}
              </p>
            </div>

            <div>
              <label
                class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Registered Work Email *
              </label>
              <div class="relative">
                <app-icon
                  name="mail"
                  [size]="16"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                ></app-icon>
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah@hospital.com"
                  [(ngModel)]="forgotEmail"
                  name="forgotEmail"
                  class="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button
                type="button"
                (click)="isForgotModalOpen.set(false); forgotError.set(null)"
                class="cf-btn-cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="isSendingForgot()"
                class="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <app-icon name="send" [size]="14"></app-icon>
                <span>{{
                  isSendingForgot() ? "Dispatching..." : "Send Reset Link"
                }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- REGISTRATION STATUS CHECKER MODAL -->
      <app-registration-status-modal
        [isOpen]="isStatusModalOpen()"
        (close)="isStatusModalOpen.set(false)"
        (navigateToLogin)="switchTab('login')"
      ></app-registration-status-modal>
    </div>
  `,
})
export class LoginFormComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly activeTab = signal<"login" | "register">("login");
  readonly showPassword = signal(false);
  readonly showRegPassword = signal(false);
  readonly showRegConfirmPassword = signal(false);

  readonly rememberMe = true;
  readonly isForgotModalOpen = signal(false);
  readonly isStatusModalOpen = signal(false);
  forgotEmail = "";
  readonly forgotSuccess = signal<string | null>(null);
  readonly isSendingForgot = signal(false);
  readonly forgotError = signal<string | null>(null);

  loginUsername = "";
  loginPassword = "";
  readonly isLoggingIn = signal(false);

  regData = {
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    employeeId: "EMP-2026-101",
    invitationCode: "",
    role: UserRole.Receptionist,
  };
  readonly regError = signal<string | null>(null);
  readonly regSuccess = signal<string | null>(null);
  readonly isRegistering = signal(false);
  readonly notRegisteredMessage = signal<string | null>(null);
  readonly accountStatusError = signal<{
    code: LoginStatusType;
    message: string;
    details?: string;
  } | null>(null);

  switchTab(tab: "login" | "register"): void {
    this.activeTab.set(tab);
    this.notRegisteredMessage.set(null);
    this.accountStatusError.set(null);
  }

  passwordStrength() {
    const pass = this.regData.password;
    if (!pass) return { score: 0, label: "None", color: "bg-slate-200" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score, label: "Weak", color: "bg-rose-500" };
    if (score <= 4) return { score, label: "Medium", color: "bg-amber-500" };
    return { score, label: "Strong", color: "bg-emerald-500" };
  }

  onLoginSubmit(): void {
    this.notRegisteredMessage.set(null);
    this.accountStatusError.set(null);
    this.isLoggingIn.set(true);

    this.authService
      .login({
        usernameOrEmail: this.loginUsername,
        password: this.loginPassword,
      })
      .subscribe({
        next: (res) => {
          console.log(
            "[HMS Login] Login response received. Navigating to root route ('/')...",
            res,
          );
          this.isLoggingIn.set(false);
          this.router
            .navigateByUrl("/")
            .then((navSuccess) => {
              console.log(
                "[HMS Login] navigateByUrl('/') resolved with:",
                navSuccess,
              );
              if (!navSuccess) {
                console.warn(
                  "[HMS Login] Navigation returned false, retrying with navigate(['/'])",
                );
                this.router.navigate(["/"]);
              }
            })
            .catch((navErr) => {
              console.error(
                "[HMS Login] Navigation failed with error:",
                navErr,
              );
            });
        },
        error: (err) => {
          this.isLoggingIn.set(false);
          const responseData = err?.error;
          const status = err?.status;
          const code = responseData?.code as LoginStatusType | undefined;
          const message = responseData?.message;

          if (
            code === "ACCOUNT_INACTIVE" ||
            (status === 403 && message?.toLowerCase().includes("inactive"))
          ) {
            this.accountStatusError.set({
              code: "ACCOUNT_INACTIVE",
              message: "Account Inactive",
              details:
                message ||
                "Your account has been created but is currently inactive. You cannot sign in until your account is activated by an authorized hospital administrator.",
            });
          } else if (
            code === "ACCOUNT_PENDING_APPROVAL" ||
            (status === 403 && message?.toLowerCase().includes("awaiting"))
          ) {
            this.accountStatusError.set({
              code: "ACCOUNT_PENDING_APPROVAL",
              message: "Registration Awaiting Approval",
              details:
                message ||
                "Your staff onboarding application is currently awaiting administrator review. You will receive an email notification once your request has been reviewed.",
            });
          } else if (
            code === "ACCOUNT_REJECTED" ||
            (status === 403 && message?.toLowerCase().includes("rejected"))
          ) {
            this.accountStatusError.set({
              code: "ACCOUNT_REJECTED",
              message: "Registration Not Approved",
              details:
                message ||
                "Your staff registration request was not approved. Please contact the hospital administration office for further details.",
            });
          } else if (
            code === "ACCOUNT_NOT_FOUND" ||
            responseData?.isNotRegistered ||
            status === 404
          ) {
            this.notRegisteredMessage.set(
              message ||
                `The identity '${this.loginUsername}' is not registered in CareFlow HMS.`,
            );
          } else {
            this.accountStatusError.set({
              code: "INVALID_CREDENTIALS",
              message: "Invalid Credentials",
              details:
                message ||
                "Invalid password or username. Please check your credentials.",
            });
          }
        },
      });
  }

  handleRegisterSubmit(): void {
    this.regError.set(null);
    this.regSuccess.set(null);

    if (this.regData.password !== this.regData.confirmPassword) {
      this.regError.set("Passwords do not match. Please re-enter.");
      return;
    }

    if (this.regData.password.length < 6) {
      this.regError.set("Password must be at least 6 characters long.");
      return;
    }

    this.isRegistering.set(true);

    this.authService
      .submitStaffRegistration({
        fullName: this.regData.fullName.trim(),
        username: this.regData.username.trim(),
        email: this.regData.email.trim(),
        password: this.regData.password,
        confirmPassword: this.regData.confirmPassword,
        employeeId: this.regData.employeeId?.trim(),
        invitationCode: this.regData.invitationCode?.trim() || "RECEPT-MAIN",
      })
      .subscribe({
        next: () => {
          this.isRegistering.set(false);
          this.regSuccess.set(
            "Staff registration request submitted successfully! Your application is now PENDING administrator review.",
          );
        },
        error: (err) => {
          this.isRegistering.set(false);
          this.regError.set(
            err?.error?.message ||
              "Registration failed. Please check your information.",
          );
        },
      });
  }

  handleForgotSubmit(): void {
    if (!this.forgotEmail) return;
    this.isSendingForgot.set(true);
    this.forgotError.set(null);

    this.authService.forgotPassword(this.forgotEmail.trim()).subscribe({
      next: () => {
        this.isSendingForgot.set(false);
        this.forgotSuccess.set(
          `A secure password reset link and single-use token have been dispatched to ${this.forgotEmail}. Please check your hospital webmail inbox (or local Mailpit).`,
        );
      },
      error: (err) => {
        this.isSendingForgot.set(false);
        this.forgotError.set(
          err?.error?.message ||
            "Failed to dispatch password reset email. Please verify the email address.",
        );
      },
    });
  }
}
