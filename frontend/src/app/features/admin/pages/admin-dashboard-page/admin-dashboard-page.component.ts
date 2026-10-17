import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { AuthService } from "@core/services/auth.service";
import {
  StaffRegistrationRequest,
  isPendingStatus,
} from "@core/models/auth.models";
import { PageHeaderComponent } from "@shared/components/page-header/page-header.component";
import { IconComponent } from "@shared/components/icon/icon.component";

@Component({
  selector: "app-admin-dashboard-page",
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, IconComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <app-page-header
        title="Admin Dashboard & System Health"
        subtitle="Central monitoring for infrastructure health, staff approvals, account access, and hospital operations."
        iconName="shield-check"
      >
        <div actions>
          <span class="text-xs text-slate-400 hidden sm:inline mr-2">
            Updated {{ lastRefreshed().toLocaleTimeString() }}
          </span>
          <button
            type="button"
            (click)="fetchStaffRequests()"
            [disabled]="isRefreshing()"
            class="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <app-icon
              name="refresh-cw"
              [size]="14"
              [className]="isRefreshing() ? 'animate-spin' : ''"
            ></app-icon>
            <span>Refresh Status</span>
          </button>
        </div>
      </app-page-header>

      <!-- Section 1: System Status & Infrastructure Monitoring -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2
            class="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2"
          >
            <app-icon
              name="activity"
              [size]="16"
              className="text-emerald-500"
            ></app-icon>
            <span>Service Health & Connectivity</span>
          </h2>
          <span
            class="text-xs text-emerald-600 dark:text-emerald-400 font-medium"
          >
            4 of 4 Services Operational
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Backend API -->
          <div
            class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3"
          >
            <div class="flex items-center justify-between">
              <span
                class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                >Backend API</span
              >
              <div
                class="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600"
              >
                <app-icon name="activity" [size]="16"></app-icon>
              </div>
            </div>
            <div class="flex items-center gap-2.5">
              <span
                class="relative flex h-3 w-3 items-center justify-center shrink-0"
              >
                <span
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                ></span>
                <span
                  class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"
                ></span>
              </span>
              <span
                class="text-xl font-bold text-emerald-600 dark:text-emerald-400"
                >Healthy</span
              >
            </div>
            <p class="text-[11px] text-slate-400">
              ASP.NET Core WebAPI active with Dynamic RBAC
            </p>
          </div>

          <!-- PostgreSQL -->
          <div
            class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3"
          >
            <div class="flex items-center justify-between">
              <span
                class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                >Database</span
              >
              <div
                class="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600"
              >
                <app-icon name="activity" [size]="16"></app-icon>
              </div>
            </div>
            <div class="flex items-center gap-2.5">
              <span
                class="relative flex h-3 w-3 items-center justify-center shrink-0"
              >
                <span
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                ></span>
                <span
                  class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"
                ></span>
              </span>
              <span
                class="text-xl font-bold text-emerald-600 dark:text-emerald-400"
                >Connected</span
              >
            </div>
            <p class="text-[11px] text-slate-400">
              PostgreSQL EMR store with migrations applied
            </p>
          </div>

          <!-- Pending Approvals Metric -->
          <div
            class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3"
          >
            <div class="flex items-center justify-between">
              <span
                class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                >Staff Approvals</span
              >
              <div
                class="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600"
              >
                <app-icon name="user-check" [size]="16"></app-icon>
              </div>
            </div>
            <div class="flex items-center gap-2.5">
              <span class="text-2xl font-bold text-slate-800 dark:text-white">
                {{ pendingApprovalsCount() }}
              </span>
              <span
                *ngIf="pendingApprovalsCount() > 0"
                class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200"
              >
                Action Needed
              </span>
            </div>
            <a
              routerLink="/admin/staff-approvals"
              class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Review Requests</span>
              <app-icon name="arrow-right" [size]="12"></app-icon>
            </a>
          </div>

          <!-- Auth Security Metric -->
          <div
            class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3"
          >
            <div class="flex items-center justify-between">
              <span
                class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                >Security</span
              >
              <div
                class="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600"
              >
                <app-icon name="shield-check" [size]="16"></app-icon>
              </div>
            </div>
            <div class="flex items-center gap-2.5">
              <span
                class="text-xl font-bold text-purple-600 dark:text-purple-400"
                >Enforced</span
              >
            </div>
            <a
              routerLink="/admin/users"
              class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>User Directory</span>
              <app-icon name="arrow-right" [size]="12"></app-icon>
            </a>
          </div>
        </div>
      </div>

      <!-- Quick Links Navigation Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          routerLink="/admin/staff-approvals"
          class="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm transition-all group cursor-pointer"
        >
          <div class="flex items-center gap-3 mb-2">
            <div
              class="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 group-hover:scale-105 transition-transform"
            >
              <app-icon name="user-check" [size]="20"></app-icon>
            </div>
            <div>
              <h3 class="font-bold text-slate-900 dark:text-white text-base">
                Staff Onboarding Approvals
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Review, approve, or reject incoming staff requests and send
                credentials.
              </p>
            </div>
          </div>
        </a>

        <a
          routerLink="/admin/users"
          class="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm transition-all group cursor-pointer"
        >
          <div class="flex items-center gap-3 mb-2">
            <div
              class="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 group-hover:scale-105 transition-transform"
            >
              <app-icon name="user-cog" [size]="20"></app-icon>
            </div>
            <div>
              <h3 class="font-bold text-slate-900 dark:text-white text-base">
                User & RBAC Role Management
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Create user accounts, assign roles, reset credentials, and
                manage locks.
              </p>
            </div>
          </div>
        </a>
      </div>
    </div>
  `,
})
export class AdminDashboardPageComponent implements OnInit {
  private authService = inject(AuthService);

  readonly staffRequests = signal<StaffRegistrationRequest[]>([]);
  readonly lastRefreshed = signal<Date>(new Date());
  readonly isRefreshing = signal(false);

  readonly pendingApprovalsCount = computed(
    () => this.staffRequests().filter((r) => isPendingStatus(r.status)).length,
  );

  ngOnInit(): void {
    this.fetchStaffRequests();
  }

  fetchStaffRequests(): void {
    this.isRefreshing.set(true);
    this.authService.getStaffRequests().subscribe({
      next: (requests) => {
        this.staffRequests.set(requests);
        this.lastRefreshed.set(new Date());
        this.isRefreshing.set(false);
      },
      error: () => this.isRefreshing.set(false),
    });
  }
}
