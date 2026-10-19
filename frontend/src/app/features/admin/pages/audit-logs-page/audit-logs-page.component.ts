import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { AuditService } from "@core/services/audit.service";
import { AuditLogDto, AuditLogFilter } from "@core/models/audit.models";
import { PageHeaderComponent } from "@shared/components/page-header/page-header.component";
import { IconComponent } from "@shared/components/icon/icon.component";

@Component({
  selector: "app-audit-logs-page",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PageHeaderComponent,
    IconComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <app-page-header
        title="Security & Compliance Audit Logs"
        subtitle="End-to-end enterprise audit trail tracking user authentication, access mutations, and critical healthcare records."
        iconName="shield-check"
      >
        <div actions class="flex items-center gap-3">
          <button
            type="button"
            (click)="loadAuditLogs()"
            [disabled]="isLoading()"
            class="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <app-icon
              name="refresh-cw"
              [size]="14"
              [className]="isLoading() ? 'animate-spin' : ''"
            ></app-icon>
            <span>Refresh</span>
          </button>
        </div>
      </app-page-header>

      <!-- Filter Controls Card -->
      <div
        class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <!-- Entity Filter -->
          <div>
            <label
              class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Entity Name
            </label>
            <input
              type="text"
              [(ngModel)]="filterEntity"
              (keyup.enter)="applyFilters()"
              placeholder="e.g. Patient, User, Appointment"
              class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <!-- Action Filter -->
          <div>
            <label
              class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Action
            </label>
            <input
              type="text"
              [(ngModel)]="filterAction"
              (keyup.enter)="applyFilters()"
              placeholder="e.g. CREATE, UPDATE, DELETE, LOGIN"
              class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <!-- User ID / Email Filter -->
          <div>
            <label
              class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5"
            >
              User ID / Actor
            </label>
            <input
              type="text"
              [(ngModel)]="filterUserId"
              (keyup.enter)="applyFilters()"
              placeholder="Filter by user UUID"
              class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <!-- Actions & Reset -->
          <div class="flex items-end gap-2">
            <button
              type="button"
              (click)="applyFilters()"
              class="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <app-icon name="filter" [size]="14"></app-icon>
              <span>Filter</span>
            </button>
            <button
              type="button"
              (click)="resetFilters()"
              class="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <!-- Logs Table Card -->
      <div
        class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden"
      >
        <div
          class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <span
              class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
            >
              Recorded Events
            </span>
            <span
              class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
            >
              {{ totalCount() }} Total
            </span>
          </div>

          <div class="flex items-center gap-2 text-xs text-slate-500">
            <span>Page {{ currentPage() }} of {{ totalPages() || 1 }}</span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table
            class="w-full text-left text-xs text-slate-600 dark:text-slate-300"
          >
            <thead
              class="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800"
            >
              <tr>
                <th class="py-3 px-4">Timestamp (UTC)</th>
                <th class="py-3 px-4">Action</th>
                <th class="py-3 px-4">Entity</th>
                <th class="py-3 px-4">Actor</th>
                <th class="py-3 px-4">Correlation ID / Trace</th>
                <th class="py-3 px-4">IP Address</th>
                <th class="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
              <!-- Loading Skeleton -->
              <tr *ngIf="isLoading()" class="animate-pulse">
                <td colspan="7" class="py-8 text-center text-slate-400">
                  <div class="inline-flex items-center gap-2">
                    <app-icon
                      name="refresh-cw"
                      [size]="16"
                      className="animate-spin text-indigo-500"
                    ></app-icon>
                    <span>Retrieving audit trail...</span>
                  </div>
                </td>
              </tr>

              <!-- Empty State -->
              <tr *ngIf="!isLoading() && logs().length === 0">
                <td colspan="7" class="py-12 text-center text-slate-400">
                  <app-icon
                    name="shield-check"
                    [size]="32"
                    className="mx-auto mb-2 text-slate-300 dark:text-slate-600"
                  ></app-icon>
                  <p class="font-medium text-slate-600 dark:text-slate-400">
                    No audit events match your criteria
                  </p>
                  <p class="text-[11px] text-slate-400 mt-1">
                    Audit events are created whenever sensitive records are
                    modified or security events occur.
                  </p>
                </td>
              </tr>

              <!-- Log Rows -->
              <tr
                *ngFor="let item of logs()"
                class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
              >
                <td
                  class="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400"
                >
                  {{ item.timestampUtc | date: "yyyy-MM-dd HH:mm:ss" }} UTC
                </td>
                <td class="py-3 px-4 whitespace-nowrap">
                  <span
                    class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                    [ngClass]="getActionBadgeClass(item.action)"
                  >
                    {{ item.action }}
                  </span>
                </td>
                <td class="py-3 px-4 whitespace-nowrap">
                  <div class="font-semibold text-slate-800 dark:text-slate-200">
                    {{ item.entityName }}
                  </div>
                  <div
                    *ngIf="item.entityId"
                    class="text-[10px] text-slate-400 font-mono"
                  >
                    ID: {{ item.entityId }}
                  </div>
                </td>
                <td class="py-3 px-4 whitespace-nowrap">
                  <div class="font-medium text-slate-700 dark:text-slate-300">
                    {{
                      item.username ||
                        item.userEmail ||
                        item.userId ||
                        "Anonymous / System"
                    }}
                  </div>
                  <div *ngIf="item.role" class="text-[10px] text-slate-400">
                    Role: <span class="capitalize">{{ item.role }}</span>
                  </div>
                </td>
                <td
                  class="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400"
                >
                  <span
                    *ngIf="item.correlationId"
                    class="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[10px] text-indigo-600 dark:text-indigo-400 select-all"
                    title="Click to copy trace ID"
                  >
                    {{ item.correlationId }}
                  </span>
                  <span
                    *ngIf="!item.correlationId"
                    class="text-slate-300 dark:text-slate-600"
                    >—</span
                  >
                </td>
                <td
                  class="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400"
                >
                  {{ item.ipAddress || item.clientIp || "—" }}
                </td>
                <td class="py-3 px-4 whitespace-nowrap text-right">
                  <button
                    *ngIf="item.oldValues || item.newValues || item.details"
                    type="button"
                    (click)="inspectLog(item)"
                    class="px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-lg transition cursor-pointer"
                  >
                    View Details
                  </button>
                  <span
                    *ngIf="!item.oldValues && !item.newValues && !item.details"
                    class="text-slate-300 dark:text-slate-600"
                    >—</span
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Bar -->
        <div
          class="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between"
        >
          <span class="text-xs text-slate-500">
            Showing {{ (currentPage() - 1) * pageSize + 1 }} to
            {{ getPageEnd() }} of {{ totalCount() }} entries
          </span>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="previousPage()"
              [disabled]="currentPage() <= 1 || isLoading()"
              class="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              (click)="nextPage()"
              [disabled]="currentPage() >= totalPages() || isLoading()"
              class="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <!-- Detail Modal / Diff Viewer -->
      <div
        *ngIf="selectedLog()"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      >
        <div
          class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden"
        >
          <div
            class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-slate-900 dark:text-white">
                Event Detail & State Mutation
              </span>
              <span
                class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase"
                [ngClass]="getActionBadgeClass(selectedLog()!.action)"
              >
                {{ selectedLog()!.action }}
              </span>
            </div>
            <button
              type="button"
              (click)="selectedLog.set(null)"
              class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <app-icon name="x" [size]="18"></app-icon>
            </button>
          </div>

          <div class="p-5 overflow-y-auto space-y-4 text-xs">
            <div
              class="grid grid-cols-2 gap-4 text-slate-600 dark:text-slate-300"
            >
              <div>
                <span class="text-slate-400 font-semibold">Entity:</span>
                {{ selectedLog()!.entityName }}
              </div>
              <div>
                <span class="text-slate-400 font-semibold">Entity ID:</span>
                {{ selectedLog()!.entityId || "—" }}
              </div>
              <div>
                <span class="text-slate-400 font-semibold">Actor:</span>
                {{ selectedLog()!.userEmail || selectedLog()!.userId }}
              </div>
              <div>
                <span class="text-slate-400 font-semibold"
                  >Correlation ID:</span
                >
                <span
                  class="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 ml-1"
                  >{{ selectedLog()!.correlationId }}</span
                >
              </div>
            </div>

            <!-- Details Note -->
            <div
              *ngIf="selectedLog()!.details"
              class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800"
            >
              <span class="text-slate-400 font-semibold block mb-1"
                >Details:</span
              >
              <p class="text-slate-700 dark:text-slate-200">
                {{ selectedLog()!.details }}
              </p>
            </div>

            <!-- Old Values -->
            <div *ngIf="selectedLog()!.oldValues">
              <h4 class="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Prior State (Old Values)
              </h4>
              <pre
                class="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl font-mono text-[11px] overflow-x-auto text-rose-700 dark:text-rose-400"
                >{{ formatJson(selectedLog()!.oldValues) }}</pre>
            </div>

            <!-- New Values -->
            <div *ngIf="selectedLog()!.newValues">
              <h4 class="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Mutated State (New Values)
              </h4>
              <pre
                class="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl font-mono text-[11px] overflow-x-auto text-emerald-700 dark:text-emerald-400"
                >{{ formatJson(selectedLog()!.newValues) }}</pre>
            </div>
          </div>

          <div
            class="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end"
          >
            <button
              type="button"
              (click)="selectedLog.set(null)"
              class="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AuditLogsPageComponent implements OnInit {
  private auditService = inject(AuditService);

  readonly logs = signal<AuditLogDto[]>([]);
  readonly totalCount = signal<number>(0);
  readonly currentPage = signal<number>(1);
  readonly pageSize = 25;
  readonly isLoading = signal<boolean>(false);
  readonly selectedLog = signal<AuditLogDto | null>(null);

  filterEntity = "";
  filterAction = "";
  filterUserId = "";

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  loadAuditLogs(): void {
    this.isLoading.set(true);

    const filter: AuditLogFilter = {
      page: this.currentPage(),
      pageSize: this.pageSize,
      entityName: this.filterEntity.trim() || undefined,
      action: this.filterAction.trim() || undefined,
      userId: this.filterUserId.trim() || undefined,
    };

    this.auditService.getAuditLogs(filter).subscribe({
      next: (response) => {
        this.logs.set(response.items);
        this.totalCount.set(response.totalCount);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadAuditLogs();
  }

  resetFilters(): void {
    this.filterEntity = "";
    this.filterAction = "";
    this.filterUserId = "";
    this.currentPage.set(1);
    this.loadAuditLogs();
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadAuditLogs();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadAuditLogs();
    }
  }

  totalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize);
  }

  getPageEnd(): number {
    return Math.min(this.currentPage() * this.pageSize, this.totalCount());
  }

  inspectLog(item: AuditLogDto): void {
    this.selectedLog.set(item);
  }

  formatJson(rawJson: string | null | undefined): string {
    if (!rawJson) return "";
    try {
      return JSON.stringify(JSON.parse(rawJson), null, 2);
    } catch {
      return rawJson;
    }
  }

  getActionBadgeClass(action: string): string {
    const act = (action || "").toUpperCase();
    if (
      act.includes("CREATE") ||
      act.includes("INSERT") ||
      act.includes("REGISTER")
    ) {
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800";
    }
    if (
      act.includes("UPDATE") ||
      act.includes("MODIFY") ||
      act.includes("EDIT")
    ) {
      return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800";
    }
    if (
      act.includes("DELETE") ||
      act.includes("REMOVE") ||
      act.includes("REVOKE")
    ) {
      return "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800";
    }
    if (
      act.includes("LOGIN") ||
      act.includes("AUTH") ||
      act.includes("TOKEN")
    ) {
      return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200 dark:border-purple-800";
    }
    return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700";
  }
}
