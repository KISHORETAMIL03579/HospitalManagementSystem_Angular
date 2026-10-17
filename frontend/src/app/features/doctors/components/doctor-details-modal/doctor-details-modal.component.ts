import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  DoctorDto,
  DoctorDirectoryItemDto,
  TimeSlotDto,
} from "@core/models/doctor.models";
import { DoctorAvailabilityBadgeComponent } from "@features/doctors/components/doctor-availability-badge/doctor-availability-badge.component";
import { DoctorCalendarViewComponent } from "@features/doctors/components/doctor-calendar-view/doctor-calendar-view.component";
import { IconComponent } from "@shared/components/icon/icon.component";
import { formatCurrency } from "@core/utils/format-utils";

@Component({
  selector: "app-doctor-details-modal",
  standalone: true,
  imports: [
    CommonModule,
    DoctorAvailabilityBadgeComponent,
    DoctorCalendarViewComponent,
    IconComponent,
  ],
  template: `
    <div
      *ngIf="isOpen && doctor"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      (click)="onClose()"
    >
      <div
        (click)="$event.stopPropagation()"
        class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        <!-- Modal Header -->
        <div
          class="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60"
        >
          <div
            class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5"
          >
            <div
              class="flex items-start sm:items-center gap-4 min-w-0 flex-1 w-full"
            >
              <!-- Avatar Placeholder -->
              <div
                class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-lg font-bold text-xl sm:text-2xl shrink-0"
              >
                {{ initials }}
              </div>

              <div class="space-y-1.5 flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-2.5">
                  <h2
                    class="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100"
                  >
                    {{ doctor.fullName }}
                  </h2>
                  <app-doctor-availability-badge
                    *ngIf="availabilityStatus"
                    [status]="availabilityStatus"
                    size="sm"
                  ></app-doctor-availability-badge>
                </div>

                <div
                  class="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-600 dark:text-slate-400"
                >
                  <span
                    class="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1"
                  >
                    <app-icon name="stethoscope" [size]="14"></app-icon>
                    <span>{{ doctor.specialization }}</span>
                  </span>
                  <span>•</span>
                  <span class="flex items-center gap-1">
                    <app-icon name="building-2" [size]="14"></app-icon>
                    <span>{{
                      doctor.departmentName || "General Clinical"
                    }}</span>
                  </span>
                  <span>•</span>
                  <span class="font-mono text-slate-500">
                    Lic: {{ doctor.licenseNumber }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div
              class="flex items-center gap-2.5 self-end lg:self-auto shrink-0"
            >
              <button
                *ngIf="canManage"
                type="button"
                (click)="openSchedule.emit(doctor)"
                class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <app-icon name="settings" [size]="14"></app-icon>
                <span>Manage Schedule</span>
              </button>
              <button
                type="button"
                (click)="bookAppointment.emit({ doctor: doctor })"
                class="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <app-icon name="calendar" [size]="14"></app-icon>
                <span>Book Appointment</span>
              </button>
              <button
                type="button"
                (click)="onClose()"
                class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
              >
                <app-icon name="x" [size]="20"></app-icon>
              </button>
            </div>
          </div>
        </div>

        <!-- Body: Details & Live Interactive Schedule -->
        <div class="p-6 overflow-y-auto space-y-6">
          <!-- Information Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div
              class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800"
            >
              <span class="text-slate-400 block mb-1">Consultation Fee</span>
              <span
                class="text-base font-bold text-slate-800 dark:text-slate-100"
              >
                {{ formatFee(doctor.consultationFee) }}
              </span>
            </div>
            <div
              class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800"
            >
              <span class="text-slate-400 block mb-1">Direct Phone</span>
              <span
                class="text-sm font-semibold text-slate-800 dark:text-slate-100"
              >
                {{ doctor.phone || "N/A" }}
              </span>
            </div>
            <div
              class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800"
            >
              <span class="text-slate-400 block mb-1">Direct Email</span>
              <span
                class="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate block"
              >
                {{ doctor.email || "N/A" }}
              </span>
            </div>
          </div>

          <!-- Doctor Live Calendar -->
          <div class="space-y-2">
            <h3
              class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
            >
              Consultation Availability & Live Slots
            </h3>
            <app-doctor-calendar-view
              [doctorId]="doctor.doctorId"
              [doctorName]="doctor.fullName"
              (selectSlot)="onSelectSlot($event)"
            ></app-doctor-calendar-view>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DoctorDetailsModalComponent {
  @Input() isOpen = false;
  @Input() doctor?: DoctorDto | DoctorDirectoryItemDto;
  @Input() canManage = false;

  @Output() close = new EventEmitter<void>();
  @Output() openSchedule = new EventEmitter<
    DoctorDto | DoctorDirectoryItemDto
  >();
  @Output() bookAppointment = new EventEmitter<{
    doctor: DoctorDto | DoctorDirectoryItemDto;
    slot?: TimeSlotDto;
    date?: string;
  }>();

  get availabilityStatus(): string | undefined {
    return (this.doctor as DoctorDirectoryItemDto)?.availabilityStatus;
  }

  get initials(): string {
    if (!this.doctor?.fullName) return "DR";
    const clean = this.doctor.fullName.replace(/^Dr\.?\s*/i, "").trim();
    const parts = clean.split(/\s+/);
    return `${parts[0]?.[0] || "D"}${parts.length > 1 ? parts[parts.length - 1]?.[0] : ""}`.toUpperCase();
  }

  formatFee(fee?: number): string {
    return formatCurrency(fee || 0);
  }

  onClose(): void {
    this.close.emit();
  }

  onSelectSlot(e: { slot: TimeSlotDto; date: string }): void {
    if (this.doctor) {
      this.bookAppointment.emit({
        doctor: this.doctor,
        slot: e.slot,
        date: e.date,
      });
    }
  }
}
