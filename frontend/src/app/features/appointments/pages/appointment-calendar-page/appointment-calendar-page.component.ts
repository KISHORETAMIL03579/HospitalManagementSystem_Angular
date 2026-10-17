import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { AppointmentService } from "@core/services/appointment.service";
import { DoctorService } from "@core/services/doctor.service";
import { AuthService } from "@core/services/auth.service";
import { SettingsService } from "@core/services/settings.service";
import {
  AppointmentDto,
  AppointmentStatus,
} from "@core/models/appointment.models";
import { DoctorDto } from "@core/models/doctor.models";
import { formatDateByPattern, formatTimeSlot } from "@core/utils/date-utils";
import { StatusBadgeComponent } from "@shared/components/status-badge/status-badge.component";
import { IconComponent } from "@shared/components/icon/icon.component";
import { BookingModalComponent } from "@features/appointments/components/booking-modal/booking-modal.component";
import { AppointmentCalendarViewComponent } from "@features/appointments/components/appointment-calendar-view/appointment-calendar-view.component";

@Component({
  selector: "app-appointment-calendar-page",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    StatusBadgeComponent,
    IconComponent,
    BookingModalComponent,
    AppointmentCalendarViewComponent,
  ],
  template: `
    <div class="space-y-4">
      <!-- Calendar View (Pixel-aligned with User Design Screenshots) -->
      <app-appointment-calendar-view
        [appointments]="appointments()"
        [doctors]="doctors()"
        (selectAppointment)="openDossier($event)"
        (bookAppointment)="handleBookRequest($event)"
      ></app-appointment-calendar-view>

      <!-- ======================================================== -->
      <!-- Appointment Dossier Modal (Matches Recommended Header)   -->
      <!-- ======================================================== -->
      <div
        *ngIf="selectedAppointment()"
        class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      >
        <div
          class="bg-white dark:bg-[#141519] w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5"
        >
          <!-- 1. Header with Back Button and Close Icon -->
          <div
            class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800"
          >
            <div class="flex items-center gap-3">
              <button
                type="button"
                (click)="onBackFromDossier()"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-[#1b1c21] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
              >
                <app-icon name="arrow-left" [size]="14"></app-icon>
                <span>Back</span>
              </button>
              <div>
                <h3
                  class="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
                >
                  Appointment Dossier
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  Appointment details and clinical information
                </p>
              </div>
            </div>

            <!-- Single Close Icon (No redundant bottom close button) -->
            <button
              type="button"
              (click)="closeDossier()"
              class="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <app-icon name="x" [size]="18"></app-icon>
            </button>
          </div>

          <!-- 2. Patient Profile & Status Badge -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3">
              <div
                class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-300 shrink-0"
              >
                <app-icon name="user" [size]="20"></app-icon>
              </div>
              <div>
                <h4
                  class="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
                >
                  {{ selectedAppointment()?.patientName }}
                </h4>
                <span
                  class="text-xs font-mono text-slate-500 dark:text-slate-400 block"
                >
                  MRN: {{ selectedAppointment()?.medicalRecordNumber || "N/A" }}
                </span>
                <span
                  class="text-xs text-blue-600 dark:text-blue-400 font-medium block mt-0.5"
                >
                  {{
                    selectedAppointment()?.specialization || "Clinical Medicine"
                  }}
                </span>
              </div>
            </div>

            <app-status-badge
              type="appointment"
              [status]="selectedAppointment()?.status"
              size="md"
            ></app-status-badge>
          </div>

          <!-- 3. Scheduled Date & Time Slot Grid -->
          <div class="grid grid-cols-2 gap-4 pt-1">
            <div>
              <span
                class="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1"
              >
                Appointment date
              </span>
              <span class="text-sm font-bold text-slate-900 dark:text-white">
                {{ formatDate(selectedAppointment()?.appointmentDate) }}
              </span>
            </div>
            <div>
              <span
                class="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1"
              >
                Time slot
              </span>
              <span
                class="text-sm font-bold font-mono text-slate-900 dark:text-white"
              >
                {{ formatSlot(selectedAppointment()?.timeSlot) }}
              </span>
            </div>
          </div>

          <!-- 4. Consulting Doctor (Single Dr. prefix, no duplicate Dr. Dr.) -->
          <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span
              class="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1"
            >
              Consulting doctor
            </span>
            <div class="text-sm font-bold text-slate-900 dark:text-white">
              {{ formatDoctorName(selectedAppointment()?.doctorName) }}
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400">
              {{
                selectedAppointment()?.specialization || "Consultant Physician"
              }}
            </div>
          </div>

          <!-- 5. Reason for Visit -->
          <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span
              class="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1"
            >
              Reason for visit
            </span>
            <p class="text-sm text-slate-800 dark:text-slate-200">
              {{
                selectedAppointment()?.reason || "Routine Clinical Consultation"
              }}
            </p>
          </div>

          <!-- 6. Clinical Notes (Explicit "No notes recorded" when empty) -->
          <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span
              class="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1"
            >
              Clinical notes
            </span>
            <p
              [class]="
                'text-sm whitespace-pre-wrap ' +
                (selectedAppointment()?.notes
                  ? 'text-slate-700 dark:text-slate-300 italic'
                  : 'text-slate-400 dark:text-slate-500')
              "
            >
              {{ selectedAppointment()?.notes || "No notes recorded." }}
            </p>
          </div>

          <!-- 7. Predictable Action Area (Edit appointment & Update status) -->
          <div
            class="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800"
          >
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="onEditAppointment(selectedAppointment()!)"
                class="flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer shadow-2xs"
              >
                <app-icon name="edit" [size]="14"></app-icon>
                <span>Edit appointment</span>
              </button>

              <button
                type="button"
                (click)="toggleStatusDropdown()"
                class="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                <app-icon name="check-circle" [size]="14"></app-icon>
                <span>Update status</span>
              </button>
            </div>

            <!-- Quick Status Change Pills (when Update status is clicked) -->
            <div
              *ngIf="showStatusMenu()"
              class="flex flex-wrap items-center gap-1.5 animate-fade-in"
            >
              <button
                type="button"
                (click)="onUpdateStatus(AppointmentStatus.Confirmed)"
                class="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
              >
                Confirm
              </button>
              <button
                type="button"
                (click)="onUpdateStatus(AppointmentStatus.CheckedIn)"
                class="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
              >
                Check In
              </button>
              <button
                type="button"
                (click)="onUpdateStatus(AppointmentStatus.Completed)"
                class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
              >
                Complete
              </button>
              <button
                type="button"
                (click)="onUpdateStatus(AppointmentStatus.Cancelled)"
                class="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Booking Modal -->
      <app-booking-modal
        [isOpen]="isBookingModalOpen()"
        [preselectedDoctorId]="preselectedDoctorId"
        [preselectedDate]="preselectedDate"
        (close)="onBookingModalClose()"
        (appointmentBooked)="loadAppointments()"
      ></app-booking-modal>
    </div>
  `,
})
export class AppointmentCalendarPageComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private doctorService = inject(DoctorService);
  private authService = inject(AuthService);
  private settingsService = inject(SettingsService);

  readonly AppointmentStatus = AppointmentStatus;

  readonly isPatient = this.authService.isPatient;
  readonly appointments = signal<AppointmentDto[]>([]);
  readonly doctors = signal<DoctorDto[]>([]);
  readonly isLoading = signal(false);

  readonly isBookingModalOpen = signal(false);
  readonly selectedAppointment = signal<AppointmentDto | null>(null);
  readonly showStatusMenu = signal(false);

  preselectedDoctorId?: number;
  preselectedDate?: string;

  ngOnInit(): void {
    this.loadAppointments();
    this.doctorService.getDoctors().subscribe({
      next: (docs) => this.doctors.set(docs || []),
      error: (err) => console.error("Failed to load doctors:", err),
    });
  }

  loadAppointments(): void {
    this.isLoading.set(true);
    this.appointmentService.getAppointments().subscribe({
      next: (data) => {
        this.appointments.set(data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error("Failed to load appointments:", err);
        this.isLoading.set(false);
      },
    });
  }

  openDossier(apt: AppointmentDto): void {
    this.showStatusMenu.set(false);
    this.selectedAppointment.set(apt);
  }

  onBackFromDossier(): void {
    this.showStatusMenu.set(false);
    this.selectedAppointment.set(null);
  }

  closeDossier(): void {
    this.showStatusMenu.set(false);
    this.selectedAppointment.set(null);
  }

  onEditAppointment(apt: AppointmentDto): void {
    this.closeDossier();
    this.preselectedDoctorId = apt.doctorId;
    this.preselectedDate = apt.appointmentDate
      ? apt.appointmentDate.slice(0, 10)
      : undefined;
    this.isBookingModalOpen.set(true);
  }

  toggleStatusDropdown(): void {
    this.showStatusMenu.update((v) => !v);
  }

  onUpdateStatus(status: AppointmentStatus): void {
    const apt = this.selectedAppointment();
    if (!apt) return;

    this.appointmentService
      .updateAppointmentStatus(apt.appointmentId, status)
      .subscribe({
        next: () => {
          this.loadAppointments();
          this.selectedAppointment.update((current) =>
            current ? { ...current, status } : null,
          );
          this.showStatusMenu.set(false);
        },
        error: (err) => console.error("Failed to update status:", err),
      });
  }

  openNewBooking(): void {
    this.preselectedDoctorId = undefined;
    this.preselectedDate = undefined;
    this.isBookingModalOpen.set(true);
  }

  handleBookRequest(req: { date?: string; doctorId?: number }): void {
    this.preselectedDate = req.date;
    this.preselectedDoctorId = req.doctorId;
    this.isBookingModalOpen.set(true);
  }

  onBookingModalClose(): void {
    this.isBookingModalOpen.set(false);
    this.preselectedDoctorId = undefined;
    this.preselectedDate = undefined;
  }

  formatDoctorName(name?: string): string {
    if (!name) return "Unknown Doctor";
    const clean = name.trim().replace(/^(Dr\.?\s*)+/i, "");
    return `Dr. ${clean}`;
  }

  formatDate(val?: string | Date): string {
    if (!val) return "";
    return formatDateByPattern(
      val,
      this.settingsService.dateFormat(),
      this.settingsService.timeZone(),
    );
  }

  formatSlot(val?: string): string {
    return formatTimeSlot(
      val,
      this.settingsService.timeFormat(),
      this.settingsService.timeZone(),
    );
  }
}
