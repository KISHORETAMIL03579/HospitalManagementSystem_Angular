import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DoctorService } from "@core/services/doctor.service";
import { AuthService } from "@core/services/auth.service";
import {
  DoctorDirectoryItemDto,
  DepartmentDto,
  TimeSlotDto,
} from "@core/models/doctor.models";
import { formatCurrency } from "@core/utils/format-utils";
import { PageHeaderComponent } from "@shared/components/page-header/page-header.component";
import { EmptyStateComponent } from "@shared/components/empty-state/empty-state.component";
import { IconComponent } from "@shared/components/icon/icon.component";
import { DoctorAvailabilityBadgeComponent } from "@features/doctors/components/doctor-availability-badge/doctor-availability-badge.component";
import { DoctorDetailsModalComponent } from "@features/doctors/components/doctor-details-modal/doctor-details-modal.component";
import { DoctorScheduleModalComponent } from "@features/doctors/components/doctor-schedule-modal/doctor-schedule-modal.component";
import { BookingModalComponent } from "@features/appointments/components/booking-modal/booking-modal.component";

@Component({
  selector: "app-doctor-list-page",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    EmptyStateComponent,
    IconComponent,
    DoctorAvailabilityBadgeComponent,
    DoctorDetailsModalComponent,
    DoctorScheduleModalComponent,
    BookingModalComponent,
  ],
  template: `
    <div class="space-y-6">
      <app-page-header
        title="Doctor Directory & Schedules"
        subtitle="View clinical staff, real-time availability status, and consultation hours."
        iconName="stethoscope"
      >
        <div actions>
          <button
            *ngIf="canManage()"
            type="button"
            (click)="isAddDoctorModalOpen.set(true)"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <app-icon name="plus" [size]="16"></app-icon>
            <span>Register Doctor</span>
          </button>
        </div>
      </app-page-header>

      <!-- Department Filters & Search Strip -->
      <div
        class="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between"
      >
        <!-- Search bar -->
        <div class="relative flex-1 max-w-md">
          <app-icon
            name="search"
            [size]="16"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          ></app-icon>
          <input
            type="text"
            placeholder="Search doctors by name or specialization..."
            [(ngModel)]="searchTerm"
            (ngModelChange)="onFilterChange()"
            class="w-full pl-10 pr-9 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <!-- Department Dropdown Filter -->
        <div class="flex items-center gap-2">
          <label
            class="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap"
          >
            Department:
          </label>
          <select
            [(ngModel)]="selectedDepartmentId"
            (ngModelChange)="onFilterChange()"
            class="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option [ngValue]="undefined">All Clinical Departments</option>
            <option
              *ngFor="let dept of departments()"
              [ngValue]="dept.departmentId"
            >
              {{ dept.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Doctors Grid -->
      <div *ngIf="isLoading()" class="py-12 text-center text-sm text-slate-400">
        Loading doctor directory...
      </div>

      <div *ngIf="!isLoading() && paginatedDoctors().length === 0" class="py-8">
        <app-empty-state
          iconName="stethoscope"
          title="No Doctors Found"
          description="No clinical specialists match your department or search filter."
        ></app-empty-state>
      </div>

      <div
        *ngIf="!isLoading() && paginatedDoctors().length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        <div
          *ngFor="let doc of paginatedDoctors()"
          class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
        >
          <div>
            <!-- Header with Avatar and Availability -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <div
                  class="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-lg shadow-sm"
                >
                  {{ getInitials(doc.fullName) }}
                </div>
                <div>
                  <h3
                    class="font-bold text-slate-900 dark:text-white text-base"
                  >
                    {{ doc.fullName }}
                  </h3>
                  <p
                    class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5"
                  >
                    <app-icon name="stethoscope" [size]="12"></app-icon>
                    <span>{{ doc.specialization }}</span>
                  </p>
                </div>
              </div>
            </div>

            <!-- Details -->
            <div
              class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs"
            >
              <div
                class="flex items-center justify-between text-slate-600 dark:text-slate-400"
              >
                <span>Department:</span>
                <span class="font-medium text-slate-800 dark:text-slate-200">{{
                  doc.departmentName || "General Clinical"
                }}</span>
              </div>
              <div
                class="flex items-center justify-between text-slate-600 dark:text-slate-400"
              >
                <span>Fee:</span>
                <span class="font-bold text-slate-800 dark:text-slate-100">{{
                  formatFee(doc.consultationFee)
                }}</span>
              </div>
              <div
                class="flex items-center justify-between text-slate-600 dark:text-slate-400"
              >
                <span>Phone:</span>
                <span class="font-medium text-slate-800 dark:text-slate-200">{{
                  doc.phone || "N/A"
                }}</span>
              </div>

              <div class="pt-2">
                <app-doctor-availability-badge
                  [status]="doc.availabilityStatus"
                  [nextSlotText]="
                    doc.nextAvailableSlotText || doc.nextAvailableSlot
                      ? 'Next: ' +
                        (doc.nextAvailableSlotText || doc.nextAvailableSlot)
                      : undefined
                  "
                  size="sm"
                ></app-doctor-availability-badge>
              </div>
            </div>
          </div>

          <!-- Card Actions -->
          <div
            class="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800"
          >
            <button
              type="button"
              (click)="selectedDoctorForDetails.set(doc)"
              class="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition text-center cursor-pointer"
            >
              View Schedule
            </button>
            <button
              type="button"
              (click)="openBooking(doc)"
              class="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition text-center cursor-pointer"
            >
              Book Visit
            </button>
            <button
              *ngIf="canManage()"
              type="button"
              (click)="selectedDoctorForSchedule.set(doc)"
              title="Manage Recurring Hours"
              class="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 transition cursor-pointer"
            >
              <app-icon name="settings" [size]="16"></app-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination Strip -->
      <div
        *ngIf="totalPages() > 1"
        class="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400"
      >
        <div>Page {{ currentPage() }} of {{ totalPages() }}</div>
        <div class="flex items-center gap-1">
          <button
            type="button"
            [disabled]="currentPage() <= 1"
            (click)="currentPage.set(currentPage() - 1)"
            class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
          >
            <app-icon name="chevron-left" [size]="14"></app-icon>
          </button>
          <button
            type="button"
            [disabled]="currentPage() >= totalPages()"
            (click)="currentPage.set(currentPage() + 1)"
            class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
          >
            <app-icon name="chevron-right" [size]="14"></app-icon>
          </button>
        </div>
      </div>

      <!-- Doctor Details Modal -->
      <app-doctor-details-modal
        [isOpen]="selectedDoctorForDetails() !== null"
        [doctor]="selectedDoctorForDetails() || undefined"
        [canManage]="canManage()"
        (close)="selectedDoctorForDetails.set(null)"
        (openSchedule)="onOpenScheduleFromDetails($event)"
        (bookAppointment)="onBookFromDetails($event)"
      ></app-doctor-details-modal>

      <!-- Doctor Schedule Modal -->
      <app-doctor-schedule-modal
        [isOpen]="selectedDoctorForSchedule() !== null"
        [doctor]="selectedDoctorForSchedule() || undefined"
        (close)="selectedDoctorForSchedule.set(null)"
      ></app-doctor-schedule-modal>

      <!-- Booking Modal -->
      <app-booking-modal
        [isOpen]="bookingModalState.isOpen"
        [preselectedDoctorId]="bookingModalState.doctorId"
        [preselectedDate]="bookingModalState.date"
        [preselectedTimeSlot]="bookingModalState.timeSlot"
        (close)="bookingModalState.isOpen = false"
      ></app-booking-modal>
    </div>
  `,
})
export class DoctorListPageComponent implements OnInit {
  private doctorService = inject(DoctorService);
  private authService = inject(AuthService);

  readonly canManage = computed(() => {
    const user = this.authService.currentUser();
    const roleLower = (user?.roleName || user?.role || "")
      .toString()
      .toLowerCase();
    return (
      roleLower.includes("admin") ||
      roleLower.includes("hospitalmanager") ||
      (user?.hierarchyLevel ?? 0) >= 90
    );
  });

  selectedDepartmentId?: number;
  searchTerm = "";
  readonly currentPage = signal(1);
  readonly pageSize = 6;

  readonly allDoctors = signal<DoctorDirectoryItemDto[]>([]);
  readonly departments = signal<DepartmentDto[]>([]);
  readonly isLoading = signal(false);

  readonly isAddDoctorModalOpen = signal(false);
  readonly selectedDoctorForDetails = signal<DoctorDirectoryItemDto | null>(
    null,
  );
  readonly selectedDoctorForSchedule = signal<DoctorDirectoryItemDto | null>(
    null,
  );

  bookingModalState = {
    isOpen: false,
    doctorId: undefined as number | undefined,
    date: undefined as string | undefined,
    timeSlot: undefined as string | undefined,
  };

  ngOnInit(): void {
    this.doctorService
      .getDepartments()
      .subscribe((depts) => this.departments.set(depts));
    this.fetchDoctors();
  }

  fetchDoctors(): void {
    this.isLoading.set(true);
    this.doctorService
      .getDoctorDirectory(
        this.selectedDepartmentId,
        this.searchTerm || undefined,
      )
      .subscribe({
        next: (docs) => {
          this.allDoctors.set(docs || []);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.fetchDoctors();
  }

  readonly totalPages = computed(() =>
    Math.ceil(this.allDoctors().length / this.pageSize),
  );

  readonly paginatedDoctors = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.allDoctors().slice(start, start + this.pageSize);
  });

  getInitials(name?: string): string {
    if (!name) return "DR";
    const clean = name.replace(/^Dr\.?\s*/i, "").trim();
    const parts = clean.split(/\s+/);
    return `${parts[0]?.[0] || "D"}${parts.length > 1 ? parts[parts.length - 1]?.[0] : ""}`.toUpperCase();
  }

  formatFee(fee?: number): string {
    return formatCurrency(fee || 0);
  }

  openBooking(doc: DoctorDirectoryItemDto): void {
    this.bookingModalState = {
      isOpen: true,
      doctorId: doc.doctorId,
      date: new Date().toISOString().split("T")[0],
      timeSlot: undefined,
    };
  }

  onOpenScheduleFromDetails(doc: any): void {
    this.selectedDoctorForDetails.set(null);
    this.selectedDoctorForSchedule.set(doc);
  }

  onBookFromDetails(e: {
    doctor: any;
    slot?: TimeSlotDto;
    date?: string;
  }): void {
    this.selectedDoctorForDetails.set(null);
    this.bookingModalState = {
      isOpen: true,
      doctorId: e.doctor.doctorId,
      date: e.date,
      timeSlot: e.slot?.startTime,
    };
  }
}
