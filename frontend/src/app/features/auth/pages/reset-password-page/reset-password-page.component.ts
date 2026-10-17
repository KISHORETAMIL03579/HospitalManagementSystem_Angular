import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { AuthService } from "@core/services/auth.service";
import { IconComponent } from "@shared/components/icon/icon.component";

@Component({
  selector: "app-reset-password-page",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  template: `
    <div
      class="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4"
    >
      <div
        class="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6"
      >
        <!-- Header -->
        <div class="space-y-2 text-center">
          <div
            class="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-2"
          >
            <app-icon name="key" [size]="24"></app-icon>
          </div>
          <h2 class="text-xl font-bold text-slate-900 dark:text-white">
            Set New Password
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Please enter and confirm your new secure hospital account password.
          </p>
        </div>

        <!-- Success Message -->
        <div
          *ngIf="isSuccess()"
          class="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3 animate-in fade-in"
        >
          <div
            class="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold"
          >
            <app-icon
              name="check-circle"
              [size]="16"
              className="text-emerald-600 dark:text-emerald-400"
            ></app-icon>
            <span>Password Reset Completed!</span>
          </div>
          <p
            class="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed"
          >
            Your account credentials have been updated securely. You can now
            proceed to log in with your new password.
          </p>
          <a
            routerLink="/login"
            class="block w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold text-center transition cursor-pointer"
          >
            Proceed to Sign In
          </a>
        </div>

        <!-- Reset Form -->
        <form
          *ngIf="!isSuccess()"
          (ngSubmit)="handleSubmit()"
          class="space-y-4"
        >
          <div
            *ngIf="error()"
            class="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-rose-800 dark:text-rose-300 text-xs"
          >
            <app-icon
              name="alert-circle"
              [size]="16"
              className="text-rose-600 shrink-0 mt-0.5"
            ></app-icon>
            <span class="leading-relaxed">{{ error() }}</span>
          </div>

          <div>
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Registered Email
            </label>
            <div class="relative">
              <app-icon
                name="mail"
                [size]="16"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              ></app-icon>
              <input
                type="email"
                disabled
                [value]="email"
                class="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              New Password *
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
                [(ngModel)]="newPassword"
                name="newPassword"
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

          <div>
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Confirm New Password *
            </label>
            <div class="relative">
              <app-icon
                name="lock"
                [size]="16"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              ></app-icon>
              <input
                [type]="showConfirmPassword() ? 'text' : 'password'"
                required
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••"
                class="w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                (click)="showConfirmPassword.set(!showConfirmPassword())"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <app-icon
                  [name]="showConfirmPassword() ? 'eye-off' : 'eye'"
                  [size]="16"
                ></app-icon>
              </button>
            </div>
          </div>

          <!-- Password Strength Indicator -->
          <div *ngIf="newPassword" class="space-y-1">
            <div class="flex justify-between items-center text-[11px]">
              <span class="text-slate-500 dark:text-slate-400 font-medium"
                >Strength:</span
              >
              <span
                [class]="
                  'font-semibold ' +
                  (strength().label === 'Weak'
                    ? 'text-rose-600'
                    : strength().label === 'Medium'
                      ? 'text-amber-600'
                      : 'text-emerald-600')
                "
              >
                {{ strength().label }}
              </span>
            </div>
            <div
              class="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden"
            >
              <div
                [class]="
                  'h-full transition-all duration-300 ' + strength().color
                "
                [style.width.%]="(strength().score / 5) * 100"
              ></div>
            </div>
          </div>

          <button
            type="submit"
            [disabled]="isLoading()"
            class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <app-icon name="key" [size]="14"></app-icon>
            <span>{{
              isLoading() ? "Updating Password..." : "Save New Password"
            }}</span>
          </button>

          <div class="text-center pt-2">
            <a
              routerLink="/login"
              class="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 inline-flex items-center gap-1.5"
            >
              <app-icon name="arrow-left" [size]="14"></app-icon>
              <span>Back to Sign In</span>
            </a>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class ResetPasswordPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  email = "";
  token = "";
  newPassword = "";
  confirmPassword = "";
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly isSuccess = signal(false);

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.token = params["token"] || "";
      this.email = params["email"] || "";
    });
  }

  strength() {
    const pass = this.newPassword;
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

  handleSubmit(): void {
    this.error.set(null);

    if (!this.token) {
      this.error.set(
        "Password reset token is missing. Please check the link from your email.",
      );
      return;
    }
    if (!this.email) {
      this.error.set(
        "Email address is missing. Please check the link from your email.",
      );
      return;
    }
    if (this.newPassword.length < 6) {
      this.error.set("New password must be at least 6 characters long.");
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error.set("Passwords do not match. Please verify and re-enter.");
      return;
    }

    this.isLoading.set(true);

    this.authService
      .resetPassword({
        email: this.email.trim(),
        token: this.token.trim(),
        newPassword: this.newPassword,
        confirmPassword: this.confirmPassword,
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.isSuccess.set(true);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.error.set(
            err?.error?.message ||
              "Failed to reset password. The token may be expired or already used. Please request a new link.",
          );
        },
      });
  }
}
