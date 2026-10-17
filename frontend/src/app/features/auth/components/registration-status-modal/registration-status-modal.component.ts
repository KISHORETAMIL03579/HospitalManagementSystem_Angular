import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AuthService } from "@core/services/auth.service";
import { IconComponent } from "@shared/components/icon/icon.component";
import {
  StaffRegistrationRequest,
  isPendingStatus,
  isApprovedStatus,
  isRejectedStatus,
} from "@core/models/auth.models";
import { formatDateByPattern } from "@core/utils/date-utils";

@Component({
  selector: "app-registration-status-modal",
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div
      *ngIf="isOpen"
      class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        class="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6"
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="p-2.5 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl"
            >
              <app-icon name="shield-check" [size]="24"></app-icon>
            </div>
            <div>
              <h3 class="font-bold text-slate-900 dark:text-white text-base">
                Check Onboarding Status
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Track your staff registration approval status in CareFlow.
              </p>
            </div>
          </div>
          <button
            type="button"
            (click)="onCloseModal()"
            aria-label="Close modal"
            title="Close modal"
            class="cf-modal-close-btn"
          >
            <app-icon name="x" [size]="20"></app-icon>
          </button>
        </div>

        <!-- Search Form -->
        <form (ngSubmit)="handleCheckStatus()" class="space-y-3">
          <label
            class="text-xs font-semibold text-slate-700 dark:text-slate-300 block"
          >
            Registered Work Email
          </label>
          <div class="flex gap-2">
            <div class="relative flex-1">
              <app-icon
                name="mail"
                [size]="16"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              ></app-icon>
              <input
                type="email"
                required
                [(ngModel)]="email"
                name="email"
                placeholder="e.g. sarah@example.com"
                class="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              [disabled]="loading()"
              class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <app-icon
                [name]="loading() ? 'refresh-cw' : 'search'"
                [size]="14"
                [className]="loading() ? 'animate-spin' : ''"
              ></app-icon>
              <span>Check Status</span>
            </button>
          </div>
        </form>

        <!-- Error Message -->
        <div
          *ngIf="error()"
          class="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2"
        >
          <app-icon
            name="alert-triangle"
            [size]="16"
            className="text-rose-500 shrink-0 mt-0.5"
          ></app-icon>
          <span>{{ error() }}</span>
        </div>

        <!-- Registration Result Display -->
        <div
          *ngIf="statusRecord()"
          class="space-y-5 animate-in fade-in slide-in-from-bottom-2"
        >
          <!-- Applicant Summary Header -->
          <div
            class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2"
          >
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-900 dark:text-white text-sm">
                {{ statusRecord()?.fullName }}
              </span>
              <span
                *ngIf="isPending(statusRecord()?.status)"
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
              >
                <app-icon
                  name="clock"
                  [size]="14"
                  className="text-amber-600 dark:text-amber-400"
                ></app-icon>
                <span>PENDING REVIEW</span>
              </span>
              <span
                *ngIf="isApproved(statusRecord()?.status)"
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
              >
                <app-icon
                  name="check-circle"
                  [size]="14"
                  className="text-emerald-600 dark:text-emerald-400"
                ></app-icon>
                <span>APPROVED & ACTIVATED</span>
              </span>
              <span
                *ngIf="isRejected(statusRecord()?.status)"
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700"
              >
                <app-icon
                  name="x-circle"
                  [size]="14"
                  className="text-rose-600 dark:text-rose-400"
                ></app-icon>
                <span>REJECTED</span>
              </span>
            </div>

            <div
              class="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700"
            >
              <div>
                <span class="text-slate-400 block text-[10px]"
                  >Requested Role</span
                >
                <span
                  class="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5"
                >
                  <app-icon
                    name="user"
                    [size]="12"
                    className="text-blue-500"
                  ></app-icon>
                  <span>{{ statusRecord()?.requestedRoleName }}</span>
                </span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]"
                  >Employee ID</span
                >
                <span
                  class="font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block"
                >
                  {{ statusRecord()?.employeeId || "N/A" }}
                </span>
              </div>
            </div>
          </div>

          <!-- Application Workflow Timeline -->
          <div class="space-y-3">
            <h4
              class="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
            >
              Application Workflow Timeline
            </h4>

            <div class="space-y-2 text-xs">
              <!-- Step 1 -->
              <div class="flex items-center gap-3">
                <div
                  class="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0"
                >
                  ✓
                </div>
                <div>
                  <div class="font-bold text-slate-800 dark:text-slate-200">
                    Registration Submitted
                  </div>
                  <div class="text-[10px] text-slate-400">
                    Submitted on {{ formatTime(statusRecord()?.submittedAt) }}
                  </div>
                </div>
              </div>

              <!-- Step 2 -->
              <div class="flex items-center gap-3">
                <div
                  [ngClass]="[
                    'w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 text-white',
                    isApproved(statusRecord()?.status)
                      ? 'bg-emerald-500'
                      : isRejected(statusRecord()?.status)
                        ? 'bg-rose-500'
                        : 'bg-amber-500 animate-pulse',
                  ]"
                >
                  {{
                    isApproved(statusRecord()?.status)
                      ? "✓"
                      : isRejected(statusRecord()?.status)
                        ? "✕"
                        : "2"
                  }}
                </div>
                <div>
                  <div class="font-bold text-slate-800 dark:text-slate-200">
                    {{
                      isApproved(statusRecord()?.status)
                        ? "Administrator Approval Completed"
                        : isRejected(statusRecord()?.status)
                          ? "Administrator Review (Rejected)"
                          : "Awaiting Administrator Review"
                    }}
                  </div>
                  <div
                    *ngIf="statusRecord()?.reviewedAt"
                    class="text-[10px] text-slate-400"
                  >
                    Reviewed on {{ formatTime(statusRecord()?.reviewedAt) }}
                    {{
                      statusRecord()?.reviewedByName
                        ? " by " + statusRecord()?.reviewedByName
                        : ""
                    }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Status Specific Warning -->
          <div
            *ngIf="isPending(statusRecord()?.status)"
            class="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-800 dark:text-amber-300 space-y-1"
          >
            <div class="font-bold flex items-center gap-1.5">
              <app-icon
                name="shield-check"
                [size]="16"
                className="text-amber-600 dark:text-amber-400"
              ></app-icon>
              <span>Account Access Disabled During Review</span>
            </div>
            <p
              class="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed"
            >
              In compliance with hospital dynamic RBAC compliance, staff
              accounts pending review have zero access to patient records,
              clinical notes, billing, or pharmacy modules.
            </p>
          </div>

          <div
            *ngIf="isApproved(statusRecord()?.status)"
            class="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between text-xs"
          >
            <div>
              <div class="font-bold text-emerald-900 dark:text-emerald-200">
                Your account is ready for sign in!
              </div>
              <div
                class="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5"
              >
                Authorized Role: {{ statusRecord()?.requestedRoleName }}
              </div>
            </div>
            <button
              type="button"
              (click)="onSignInClick()"
              class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Sign In</span>
              <app-icon name="arrow-right" [size]="14"></app-icon>
            </button>
          </div>

          <div
            *ngIf="isRejected(statusRecord()?.status)"
            class="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-800 dark:text-rose-300 space-y-1"
          >
            <div class="font-bold flex items-center gap-1.5">
              <app-icon
                name="x-circle"
                [size]="16"
                className="text-rose-600 dark:text-rose-400"
              ></app-icon>
              <span>Registration Request Rejected</span>
            </div>
            <p class="text-[11px] text-rose-700 dark:text-rose-400">
              Reason provided:
              <em
                >"{{
                  statusRecord()?.rejectionReason ||
                    "HR credentials verification failed."
                }}"</em
              >
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RegistrationStatusModalComponent {
  private authService = inject(AuthService);

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() navigateToLogin = new EventEmitter<void>();

  email = "";
  loading = signal(false);
  statusRecord = signal<StaffRegistrationRequest | null>(null);
  error = signal<string | null>(null);

  isPending = isPendingStatus;
  isApproved = isApprovedStatus;
  isRejected = isRejectedStatus;

  formatTime(iso?: string): string {
    if (!iso) return "";
    return formatDateByPattern(iso, "MMM dd, yyyy - hh:mm a");
  }

  handleCheckStatus(): void {
    if (!this.email.trim()) return;

    this.loading.set(true);
    this.error.set(null);
    this.statusRecord.set(null);

    this.authService.getRegistrationStatus(this.email.trim()).subscribe({
      next: (data) => {
        this.statusRecord.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(
          err?.error?.message ||
            `No registration application found matching email '${this.email}'. Please verify your email or submit a new staff registration request.`,
        );
        this.loading.set(false);
      },
    });
  }

  onCloseModal(): void {
    this.close.emit();
  }

  onSignInClick(): void {
    this.close.emit();
    this.navigateToLogin.emit();
  }
}
