import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AuthService } from "@core/services/auth.service";
import { DoctorService } from "@core/services/doctor.service";
import {
  StaffRegistrationRequest,
  RoleDto,
  isPendingStatus,
  isApprovedStatus,
  isRejectedStatus,
} from "@core/models/auth.models";
import { DepartmentDto } from "@core/models/doctor.models";
import { formatDateByPattern } from "@core/utils/date-utils";
import { PageHeaderComponent } from "@shared/components/page-header/page-header.component";
import { StatusBadgeComponent } from "@shared/components/status-badge/status-badge.component";
import { EmptyStateComponent } from "@shared/components/empty-state/empty-state.component";
import { IconComponent } from "@shared/components/icon/icon.component";

@Component({
  selector: "app-staff-approval-page",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    IconComponent,
  ],
  template: `
    <div class="space-y-6">
      <app-page-header
        title="Staff Registration Approvals"
        subtitle="Review onboarding requests, assign RBAC authorization roles, and dispatch credentials."
        iconName="user-check"
      >
        <div actions>
          <button
            type="button"
            (click)="fetchRequests()"
            [disabled]="loading()"
            class="px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
          >
            <app-icon
              name="refresh-cw"
              [size]="14"
              [className]="loading() ? 'animate-spin' : ''"
            ></app-icon>
            <span>Refresh</span>
          </button>
        </div>
      </app-page-header>

      <!-- Feedback Toast -->
      <div
        *ngIf="feedback()"
        [class]="
          'p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ' +
          (feedback()?.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
            : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800')
        "
      >
        <span>{{ feedback()?.message }}</span>
        <button
          type="button"
          (click)="feedback.set(null)"
          class="cursor-pointer"
        >
          &times;
        </button>
      </div>

      <!-- Filters & Tabs Strip -->
      <div
        class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between"
      >
        <!-- Tabs -->
        <div
          class="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold"
        >
          <button
            type="button"
            (click)="activeTab.set('pending')"
            [class]="
              'px-3 py-1.5 rounded-lg transition cursor-pointer ' +
              (activeTab() === 'pending'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white')
            "
          >
            Pending Review ({{ pendingCount() }})
          </button>
          <button
            type="button"
            (click)="activeTab.set('approved')"
            [class]="
              'px-3 py-1.5 rounded-lg transition cursor-pointer ' +
              (activeTab() === 'approved'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white')
            "
          >
            Approved
          </button>
          <button
            type="button"
            (click)="activeTab.set('rejected')"
            [class]="
              'px-3 py-1.5 rounded-lg transition cursor-pointer ' +
              (activeTab() === 'rejected'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white')
            "
          >
            Rejected
          </button>
          <button
            type="button"
            (click)="activeTab.set('all')"
            [class]="
              'px-3 py-1.5 rounded-lg transition cursor-pointer ' +
              (activeTab() === 'all'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white')
            "
          >
            All
          </button>
        </div>

        <!-- Search Bar -->
        <div class="relative max-w-xs w-full">
          <app-icon
            name="search"
            [size]="14"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          ></app-icon>
          <input
            type="text"
            placeholder="Search applicants by name, email, or role..."
            [(ngModel)]="searchQuery"
            class="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <!-- Requests Table -->
      <div
        class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm table-fixed">
            <thead
              class="bg-slate-100/80 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700"
            >
              <tr>
                <th class="w-[28%] py-3 pl-4 pr-3">Applicant Info</th>
                <th class="w-[22%] py-3 px-3">Requested Role</th>
                <th class="w-[18%] py-3 px-3">Submitted At</th>
                <th class="w-[14%] py-3 px-3">Status</th>
                <th class="w-[18%] py-3 pr-4 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr *ngIf="loading()">
                <td
                  colspan="5"
                  class="py-12 text-center text-xs text-slate-400"
                >
                  Loading staff requests...
                </td>
              </tr>
              <tr *ngIf="!loading() && filteredRequests().length === 0">
                <td colspan="5" class="py-12 text-center">
                  <app-empty-state
                    iconName="user-check"
                    title="No Requests Found"
                    description="No staff registration applications match the current tab or query."
                  ></app-empty-state>
                </td>
              </tr>
              <tr
                *ngFor="let req of filteredRequests()"
                class="hover:bg-indigo-50/50 dark:hover:bg-slate-800/80 transition-colors"
              >
                <td class="py-3.5 pl-4 pr-3 truncate">
                  <div class="font-bold text-slate-900 dark:text-white">
                    {{ req.fullName }}
                  </div>
                  <div
                    class="text-xs text-slate-500 dark:text-slate-400 truncate"
                  >
                    {{ req.email }}
                  </div>
                  <div
                    *ngIf="req.employeeId"
                    class="text-[10px] font-mono text-slate-400"
                  >
                    ID: {{ req.employeeId }}
                  </div>
                </td>
                <td class="py-3.5 px-3">
                  <span
                    class="inline-flex items-center gap-1 font-semibold text-xs text-indigo-600 dark:text-indigo-400"
                  >
                    <app-icon name="user" [size]="12"></app-icon>
                    <span>{{ req.requestedRoleName }}</span>
                  </span>
                </td>
                <td
                  class="py-3.5 px-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap"
                >
                  {{ formatDate(req.submittedAt) }}
                </td>
                <td class="py-3.5 px-3 whitespace-nowrap">
                  <app-status-badge
                    type="staffApproval"
                    [status]="req.status"
                    size="sm"
                  ></app-status-badge>
                </td>
                <td class="py-3.5 pr-4 pl-3 text-right whitespace-nowrap">
                  <div
                    *ngIf="isPending(req.status)"
                    class="flex items-center justify-end gap-1.5"
                  >
                    <button
                      type="button"
                      (click)="openApproveModal(req)"
                      class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      (click)="openRejectModal(req)"
                      class="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                  <div
                    *ngIf="!isPending(req.status)"
                    class="text-xs text-slate-400"
                  >
                    Reviewed {{ formatDate(req.reviewedAt) }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- APPROVE MODAL -->
      <div
        *ngIf="selectedRequestForApprove()"
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
      >
        <div
          class="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
        >
          <div
            class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3"
          >
            <h3 class="font-bold text-slate-900 dark:text-white text-base">
              Approve Staff Account
            </h3>
            <button
              type="button"
              (click)="selectedRequestForApprove.set(null)"
              class="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <app-icon name="x" [size]="18"></app-icon>
            </button>
          </div>

          <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Grant system authorization to
            <strong>{{ selectedRequestForApprove()?.fullName }}</strong> ({{
              selectedRequestForApprove()?.email
            }}).
          </p>

          <div>
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Authorized System Role
            </label>
            <select
              [(ngModel)]="selectedRoleId"
              class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option *ngFor="let r of roles()" [ngValue]="r.roleId">
                {{ r.name }}
              </option>
            </select>
          </div>

          <div
            class="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800"
          >
            <button
              type="button"
              (click)="selectedRequestForApprove.set(null)"
              class="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="confirmApproval()"
              class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
            >
              Confirm Approval
            </button>
          </div>
        </div>
      </div>

      <!-- REJECT MODAL -->
      <div
        *ngIf="selectedRequestForReject()"
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
      >
        <div
          class="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
        >
          <div
            class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3"
          >
            <h3 class="font-bold text-slate-900 dark:text-white text-base">
              Reject Staff Application
            </h3>
            <button
              type="button"
              (click)="selectedRequestForReject.set(null)"
              class="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <app-icon name="x" [size]="18"></app-icon>
            </button>
          </div>

          <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Please provide a rejection reason for
            <strong>{{ selectedRequestForReject()?.fullName }}</strong
            >.
          </p>

          <div>
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Rejection Notice
            </label>
            <textarea
              rows="3"
              required
              placeholder="e.g. Employee ID not found in HR roster."
              [(ngModel)]="rejectionReason"
              class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>

          <div
            class="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800"
          >
            <button
              type="button"
              (click)="selectedRequestForReject.set(null)"
              class="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              [disabled]="!rejectionReason.trim()"
              (click)="confirmRejection()"
              class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50 cursor-pointer"
            >
              Reject Application
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class StaffApprovalPageComponent implements OnInit {
  private authService = inject(AuthService);

  readonly requests = signal<StaffRegistrationRequest[]>([]);
  readonly roles = signal<RoleDto[]>([]);
  readonly loading = signal(false);
  readonly activeTab = signal<"pending" | "approved" | "rejected" | "all">(
    "pending",
  );
  searchQuery = "";

  readonly selectedRequestForApprove = signal<StaffRegistrationRequest | null>(
    null,
  );
  selectedRoleId = 0;

  readonly selectedRequestForReject = signal<StaffRegistrationRequest | null>(
    null,
  );
  rejectionReason = "";

  readonly feedback = signal<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  isPending = isPendingStatus;
  isApproved = isApprovedStatus;
  isRejected = isRejectedStatus;

  readonly pendingCount = computed(
    () => this.requests().filter((r) => isPendingStatus(r.status)).length,
  );

  ngOnInit(): void {
    this.fetchRequests();
    this.authService.getRoles().subscribe((r) => this.roles.set(r));
  }

  fetchRequests(): void {
    this.loading.set(true);
    this.authService.getStaffRequests().subscribe({
      next: (data) => {
        this.requests.set(data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  readonly filteredRequests = computed(() => {
    let list = this.requests();
    const tab = this.activeTab();
    const q = this.searchQuery.toLowerCase().trim();

    if (tab === "pending") list = list.filter((r) => isPendingStatus(r.status));
    else if (tab === "approved")
      list = list.filter((r) => isApprovedStatus(r.status));
    else if (tab === "rejected")
      list = list.filter((r) => isRejectedStatus(r.status));

    if (q) {
      list = list.filter(
        (r) =>
          r.fullName.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          (r.requestedRoleName || "").toLowerCase().includes(q),
      );
    }

    return list;
  });

  formatDate(iso?: string): string {
    if (!iso) return "";
    return formatDateByPattern(iso, "MMM dd, yyyy - hh:mm a");
  }

  openApproveModal(req: StaffRegistrationRequest): void {
    this.selectedRequestForApprove.set(req);
    this.selectedRoleId = req.requestedRoleId || (this.roles()[0]?.roleId ?? 0);
  }

  openRejectModal(req: StaffRegistrationRequest): void {
    this.selectedRequestForReject.set(req);
    this.rejectionReason = "";
  }

  confirmApproval(): void {
    const req = this.selectedRequestForApprove();
    if (!req) return;

    const id = req.requestId || req.id;
    this.authService.approveStaffRequest(id, this.selectedRoleId).subscribe({
      next: () => {
        this.selectedRequestForApprove.set(null);
        this.feedback.set({
          type: "success",
          message: `Application for ${req.fullName} approved successfully!`,
        });
        this.fetchRequests();
      },
      error: (err) => {
        this.feedback.set({
          type: "error",
          message: err?.error?.message || "Failed to approve request.",
        });
      },
    });
  }

  confirmRejection(): void {
    const req = this.selectedRequestForReject();
    if (!req) return;

    const id = req.requestId || req.id;
    this.authService.rejectStaffRequest(id, this.rejectionReason).subscribe({
      next: () => {
        this.selectedRequestForReject.set(null);
        this.feedback.set({
          type: "success",
          message: `Application for ${req.fullName} rejected.`,
        });
        this.fetchRequests();
      },
      error: (err) => {
        this.feedback.set({
          type: "error",
          message: err?.error?.message || "Failed to reject request.",
        });
      },
    });
  }
}
