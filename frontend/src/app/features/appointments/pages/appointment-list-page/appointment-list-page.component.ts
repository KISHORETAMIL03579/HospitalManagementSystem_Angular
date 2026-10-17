import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { AppointmentService } from "@core/services/appointment.service";
import { DoctorService } from "@core/services/doctor.service";
import { AuthService } from "@core/services/auth.service";
import { SettingsService } from "@core/services/settings.service";
import {
  AppointmentDto,
  AppointmentStatus,
} from "@core/models/appointment.models";
import { DoctorDto } from "@core/models/doctor.models";
import { formatTimeSlot, formatDateByPattern } from "@core/utils/date-utils";
import { PageHeaderComponent } from "@shared/components/page-header/page-header.component";
import { StatusBadgeComponent } from "@shared/components/status-badge/status-badge.component";
import { EmptyStateComponent } from "@shared/components/empty-state/empty-state.component";
import { IconComponent } from "@shared/components/icon/icon.component";
import { BookingModalComponent } from "@features/appointments/components/booking-modal/booking-modal.component";

type SortField = "appointmentDate" | "patientName" | "doctorName" | "status";
type SortOrder = "asc" | "desc";

@Component({
  selector: "app-appointment-list-page",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    IconComponent,
    BookingModalComponent,
  ],
  template: `
    <div class="space-y-6">
      <app-page-header
        [title]="isPatient() ? 'My Appointments' : 'Appointment Operations'"
        [subtitle]="
          isPatient()
            ? 'Review your scheduled visits, past consultations, and check-in status.'
            : 'Schedule, track, and manage patient visits across hospital departments.'
        "
        iconName="calendar"
      >
        <div actions>
          <button
            type="button"
            (click)="openBookingModal()"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <app-icon name="plus" [size]="16"></app-icon>
            <span>Book Appointment</span>
          </button>
        </div>
      </app-page-header>

      <!-- Filter Controls Strip -->
      <div
        class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between"
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
            placeholder="Search by patient name, doctor, reason, or MRN..."
            [(ngModel)]="searchTerm"
            (ngModelChange)="onFilterChange()"
            class="w-full pl-10 pr-9 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div class="flex flex-wrap items-center gap-2.5 text-xs">
          <!-- Doctor filter (Staff) -->
          <div *ngIf="!isPatient()">
            <select
              [(ngModel)]="selectedDoctorId"
              (ngModelChange)="onFilterChange()"
              class="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option [ngValue]="undefined">All Doctors</option>
              <option *ngFor="let doc of doctors()" [ngValue]="doc.doctorId">
                Dr. {{ doc.fullName }}
              </option>
            </select>
          </div>

          <!-- Date filter -->
          <div>
            <input
              type="date"
              [(ngModel)]="selectedDate"
              (ngModelChange)="onFilterChange()"
              class="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <!-- Status filter tabs -->
          <select
            [(ngModel)]="selectedStatusFilter"
            (ngModelChange)="onFilterChange()"
            class="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="CheckedIn">Checked In</option>
            <option value="InConsultation">In Consultation</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <!-- Table Section -->
      <div
        class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm table-fixed">
            <thead
              class="bg-slate-100/80 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700"
            >
              <tr>
                <th
                  (click)="handleSort('appointmentDate')"
                  class="w-[22%] py-3 pl-4 pr-3 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 select-none"
                >
                  <div class="flex items-center gap-1.5">
                    <span>Date & Time</span>
                    <app-icon
                      *ngIf="sortField() === 'appointmentDate'"
                      [name]="
                        sortOrder() === 'asc' ? 'chevron-up' : 'chevron-down'
                      "
                      [size]="12"
                    ></app-icon>
                  </div>
                </th>
                <th
                  (click)="handleSort('patientName')"
                  class="w-[24%] py-3 px-3 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 select-none"
                >
                  <div class="flex items-center gap-1.5">
                    <span>Patient</span>
                    <app-icon
                      *ngIf="sortField() === 'patientName'"
                      [name]="
                        sortOrder() === 'asc' ? 'chevron-up' : 'chevron-down'
                      "
                      [size]="12"
                    ></app-icon>
                  </div>
                </th>
                <th
                  (click)="handleSort('doctorName')"
                  class="w-[24%] py-3 px-3 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 select-none"
                >
                  <div class="flex items-center gap-1.5">
                    <span>Doctor</span>
                    <app-icon
                      *ngIf="sortField() === 'doctorName'"
                      [name]="
                        sortOrder() === 'asc' ? 'chevron-up' : 'chevron-down'
                      "
                      [size]="12"
                    ></app-icon>
                  </div>
                </th>
                <th class="w-[16%] py-3 px-3">Status</th>
                <th class="w-[14%] py-3 pr-4 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr *ngIf="isLoading()">
                <td
                  colspan="5"
                  class="py-12 text-center text-sm text-slate-400"
                >
                  Loading appointments...
                </td>
              </tr>
              <tr *ngIf="!isLoading() && paginatedAppointments().length === 0">
                <td colspan="5" class="py-12 text-center">
                  <app-empty-state
                    iconName="calendar"
                    title="No Appointments Found"
                    description="No appointment records match your filters."
                  ></app-empty-state>
                </td>
              </tr>
              <tr
                *ngFor="let apt of paginatedAppointments()"
                (click)="selectedAppointment.set(apt)"
                class="hover:bg-indigo-50/50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group"
              >
                <td class="py-3.5 pl-4 pr-3 text-xs">
                  <div class="font-bold text-slate-900 dark:text-white">
                    {{ formatDate(apt.appointmentDate) }}
                  </div>
                  <div class="text-slate-400 font-mono">
                    {{ formatSlot(apt.timeSlot) }}
                  </div>
                </td>
                <td class="py-3.5 px-3 truncate">
                  <div
                    class="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                  >
                    {{ apt.patientName }}
                  </div>
                  <div
                    class="text-xs text-slate-500 dark:text-slate-400 truncate"
                  >
                    {{ apt.reason || "Routine Checkup" }}
                  </div>
                </td>
                <td class="py-3.5 px-3 truncate">
                  <div class="font-semibold text-slate-800 dark:text-slate-200">
                    {{ apt.doctorName }}
                  </div>
                  <div class="text-xs text-indigo-600 dark:text-indigo-400">
                    {{ apt.specialization || "Clinical Specialist" }}
                  </div>
                </td>
                <td class="py-3.5 px-3 whitespace-nowrap">
                  <app-status-badge
                    type="appointment"
                    [status]="apt.status"
                    size="sm"
                  ></app-status-badge>
                </td>
                <td
                  class="py-3.5 pr-4 pl-3 text-right whitespace-nowrap"
                  (click)="$event.stopPropagation()"
                >
                  <!-- Quick status progression buttons for staff -->
                  <div
                    *ngIf="!isPatient()"
                    class="flex items-center justify-end gap-1"
                  >
                    <button
                      *ngIf="isConfirmed(apt.status)"
                      type="button"
                      (click)="
                        updateStatus(
                          apt.appointmentId,
                          AppointmentStatus.CheckedIn
                        )
                      "
                      title="Mark Checked In"
                      class="px-2 py-1 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-semibold hover:bg-sky-100 cursor-pointer"
                    >
                      Check In
                    </button>
                    <button
                      *ngIf="isCheckedIn(apt.status)"
                      type="button"
                      (click)="
                        updateStatus(
                          apt.appointmentId,
                          AppointmentStatus.InConsultation
                        )
                      "
                      title="Begin Consultation"
                      class="px-2 py-1 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 cursor-pointer"
                    >
                      Consult
                    </button>
                    <button
                      *ngIf="isInConsultation(apt.status)"
                      type="button"
                      (click)="
                        updateStatus(
                          apt.appointmentId,
                          AppointmentStatus.Completed
                        )
                      "
                      title="Complete Consultation"
                      class="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 cursor-pointer"
                    >
                      Done
                    </button>
                    <button
                      *ngIf="
                        !isCompleted(apt.status) && !isCancelled(apt.status)
                      "
                      type="button"
                      (click)="
                        updateStatus(
                          apt.appointmentId,
                          AppointmentStatus.Cancelled
                        )
                      "
                      title="Cancel Appointment"
                      class="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    >
                      <app-icon name="x" [size]="14"></app-icon>
                    </button>
                  </div>

                  <div *ngIf="isPatient()">
                    <button
                      *ngIf="
                        !isCompleted(apt.status) && !isCancelled(apt.status)
                      "
                      type="button"
                      (click)="
                        updateStatus(
                          apt.appointmentId,
                          AppointmentStatus.Cancelled
                        )
                      "
                      class="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Footer -->
        <div
          class="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400"
        >
          <div>Page {{ currentPage() }} of {{ totalPages() || 1 }}</div>
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
      </div>

      <!-- Appointment Details Modal -->
      <div
        *ngIf="selectedAppointment()"
        class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      >
        <div
          class="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5"
        >
          <div
            class="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3"
          >
            <div>
              <span
                class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider"
              >
                Appointment Overview
              </span>
              <h3
                class="text-lg font-bold text-slate-900 dark:text-white mt-0.5"
              >
                Visit #{{ selectedAppointment()?.appointmentId }}
              </h3>
            </div>
            <button
              type="button"
              (click)="selectedAppointment.set(null)"
              class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>

          <div class="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span class="text-slate-400 block mb-0.5">Patient Name</span>
              <span class="font-bold text-slate-900 dark:text-white text-sm">
                {{ selectedAppointment()?.patientName }}
              </span>
            </div>
            <div>
              <span class="text-slate-400 block mb-0.5">Consulting Doctor</span>
              <span class="font-bold text-slate-900 dark:text-white text-sm">
                {{ selectedAppointment()?.doctorName }}
              </span>
              <span class="text-[11px] text-indigo-600 block">
                {{ selectedAppointment()?.specialization }}
              </span>
            </div>
            <div>
              <span class="text-slate-400 block mb-0.5">Scheduled Date</span>
              <span class="font-semibold text-slate-800 dark:text-slate-200">
                {{ formatDate(selectedAppointment()?.appointmentDate) }}
              </span>
            </div>
            <div>
              <span class="text-slate-400 block mb-0.5">Scheduled Slot</span>
              <span
                class="font-semibold text-slate-800 dark:text-slate-200 font-mono"
              >
                {{ formatSlot(selectedAppointment()?.timeSlot) }}
              </span>
            </div>
            <div class="col-span-2">
              <span class="text-slate-400 block mb-0.5">Status</span>
              <app-status-badge
                type="appointment"
                [status]="selectedAppointment()?.status"
                size="sm"
              ></app-status-badge>
            </div>
            <div
              class="col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800"
            >
              <span class="text-slate-400 block mb-0.5">Reason for Visit</span>
              <p class="text-slate-700 dark:text-slate-300">
                {{ selectedAppointment()?.reason || "General Follow-up" }}
              </p>
            </div>
            <div *ngIf="selectedAppointment()?.notes" class="col-span-2">
              <span class="text-slate-400 block mb-0.5">Clinical Notes</span>
              <p class="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {{ selectedAppointment()?.notes }}
              </p>
            </div>
          </div>

          <div
            class="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800"
          >
            <button
              type="button"
              (click)="selectedAppointment.set(null)"
              class="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <!-- Booking Modal -->
      <app-booking-modal
        [isOpen]="isBookingModalOpen()"
        (close)="isBookingModalOpen.set(false)"
        (appointmentBooked)="fetchAppointments()"
      ></app-booking-modal>
    </div>
  `,
})
export class AppointmentListPageComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private doctorService = inject(DoctorService);
  private authService = inject(AuthService);
  private settingsService = inject(SettingsService);
  private route = inject(ActivatedRoute);

  readonly isPatient = this.authService.isPatient;
  readonly AppointmentStatus = AppointmentStatus;

  selectedDoctorId?: number;
  selectedDate = "";
  selectedStatusFilter = "ALL";
  searchTerm = "";

  readonly sortField = signal<SortField>("appointmentDate");
  readonly sortOrder = signal<SortOrder>("asc");
  readonly currentPage = signal(1);
  readonly pageSize = 10;

  readonly allAppointments = signal<AppointmentDto[]>([]);
  readonly doctors = signal<DoctorDto[]>([]);
  readonly isLoading = signal(false);

  readonly isBookingModalOpen = signal(false);
  readonly selectedAppointment = signal<AppointmentDto | null>(null);

  ngOnInit(): void {
    this.doctorService.getDoctors().subscribe((docs) => this.doctors.set(docs));
    this.fetchAppointments();

    this.route.queryParams.subscribe((params) => {
      const aptId = params["appointmentId"];
      if (aptId) {
        const match = this.allAppointments().find(
          (a) => String(a.appointmentId) === aptId,
        );
        if (match) this.selectedAppointment.set(match);
      }
    });
  }

  fetchAppointments(): void {
    this.isLoading.set(true);
    this.appointmentService
      .getAppointments(
        undefined,
        this.selectedDoctorId,
        this.selectedDate || undefined,
      )
      .subscribe({
        next: (apts) => {
          this.allAppointments.set(apts || []);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.fetchAppointments();
  }

  readonly filteredAppointments = computed(() => {
    let list = this.allAppointments();
    const query = this.searchTerm.toLowerCase().trim();
    const status = this.selectedStatusFilter;

    if (query) {
      list = list.filter(
        (a) =>
          (a.patientName || "").toLowerCase().includes(query) ||
          (a.doctorName || "").toLowerCase().includes(query) ||
          (a.reason || "").toLowerCase().includes(query),
      );
    }

    if (status !== "ALL") {
      list = list.filter(
        (a) => String(a.status).toLowerCase() === status.toLowerCase(),
      );
    }

    return list;
  });

  readonly sortedAppointments = computed(() => {
    const list = [...this.filteredAppointments()];
    const field = this.sortField();
    const order = this.sortOrder();

    return list.sort((a: any, b: any) => {
      const valA = a[field] ?? "";
      const valB = b[field] ?? "";
      if (valA < valB) return order === "asc" ? -1 : 1;
      if (valA > valB) return order === "asc" ? 1 : -1;
      return 0;
    });
  });

  readonly totalPages = computed(() =>
    Math.ceil(this.sortedAppointments().length / this.pageSize),
  );

  readonly paginatedAppointments = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.sortedAppointments().slice(start, start + this.pageSize);
  });

  handleSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortOrder.update((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      this.sortField.set(field);
      this.sortOrder.set("asc");
    }
  }

  formatDate(date?: string): string {
    if (!date) return "";
    const s = this.settingsService.settings();
    return formatDateByPattern(date, s.dateFormat, s.timeZone);
  }

  formatSlot(slot?: string): string {
    const s = this.settingsService.settings();
    return formatTimeSlot(slot, s.timeFormat, s.timeZone);
  }

  updateStatus(appointmentId: number, status: AppointmentStatus): void {
    this.appointmentService
      .updateAppointmentStatus(appointmentId, status)
      .subscribe({
        next: () => this.fetchAppointments(),
      });
  }

  openBookingModal(): void {
    this.isBookingModalOpen.set(true);
  }

  isConfirmed(status: any): boolean {
    return (
      status === AppointmentStatus.Confirmed ||
      status === 10 ||
      String(status) === "Confirmed"
    );
  }

  isCheckedIn(status: any): boolean {
    return (
      status === AppointmentStatus.CheckedIn ||
      status === 20 ||
      String(status) === "CheckedIn"
    );
  }

  isInConsultation(status: any): boolean {
    return (
      status === AppointmentStatus.InConsultation ||
      status === 30 ||
      String(status) === "InConsultation"
    );
  }

  isCompleted(status: any): boolean {
    return (
      status === AppointmentStatus.Completed ||
      status === 40 ||
      String(status) === "Completed"
    );
  }

  isCancelled(status: any): boolean {
    return (
      status === AppointmentStatus.Cancelled ||
      status === 50 ||
      String(status) === "Cancelled"
    );
  }
}
