import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
  computed,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DoctorService } from "@core/services/doctor.service";
import { PatientService } from "@core/services/patient.service";
import { AppointmentService } from "@core/services/appointment.service";
import { AuthService } from "@core/services/auth.service";
import {
  DoctorDto,
  TimeSlotDto,
  DoctorAvailabilityDto,
} from "@core/models/doctor.models";
import { PatientDto } from "@core/models/patient.models";
import { IconComponent } from "@shared/components/icon/icon.component";
import { formatCurrency } from "@core/utils/format-utils";

@Component({
  selector: "app-booking-modal",
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div
      *ngIf="isOpen"
      class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        class="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5"
      >
        <!-- Modal Header -->
        <div
          class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3"
        >
          <div class="flex items-center gap-3">
            <div
              class="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl"
            >
              <app-icon name="calendar" [size]="20"></app-icon>
            </div>
            <div>
              <h3 class="font-bold text-slate-900 dark:text-white text-base">
                Book Consultation
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Schedule a clinical consultation with doctor availability
                checking.
              </p>
            </div>
          </div>
          <button
            type="button"
            (click)="onCloseModal()"
            class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm flex items-center justify-center cursor-pointer transition-colors"
          >
            &times;
          </button>
        </div>

        <!-- Success Message -->
        <div
          *ngIf="isSuccess()"
          class="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs font-semibold"
        >
          <app-icon
            name="check-circle"
            [size]="18"
            className="text-emerald-600"
          ></app-icon>
          <span>Appointment booked successfully!</span>
        </div>

        <!-- Error Message -->
        <div
          *ngIf="errorMessage()"
          class="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2"
        >
          <app-icon
            name="alert-circle"
            [size]="16"
            className="text-rose-500 shrink-0 mt-0.5"
          ></app-icon>
          <span>{{ errorMessage() }}</span>
        </div>

        <form (ngSubmit)="handleBook()" class="space-y-4">
          <!-- Patient Selector (Staff only) -->
          <div *ngIf="isStaff()">
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Patient *
            </label>
            <select
              required
              [(ngModel)]="patientId"
              name="patientId"
              class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option [ngValue]="0" disabled>Select patient...</option>
              <option *ngFor="let p of patients()" [ngValue]="p.patientId">
                {{ p.fullName }} (MRN: {{ p.medicalRecordNumber }})
              </option>
            </select>
          </div>

          <!-- Doctor Selector -->
          <div>
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Consulting Doctor *
            </label>
            <select
              required
              [(ngModel)]="doctorId"
              (ngModelChange)="onDoctorOrDateChange()"
              name="doctorId"
              class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option [ngValue]="0" disabled>Select doctor...</option>
              <option *ngFor="let d of doctors()" [ngValue]="d.doctorId">
                Dr. {{ d.fullName }} — {{ d.specialization }} ({{
                  formatFee(d.consultationFee)
                }})
              </option>
            </select>
          </div>

          <!-- Date & Time Row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Appointment Date *
              </label>
              <input
                type="date"
                required
                [min]="minDate"
                [(ngModel)]="appointmentDate"
                (ngModelChange)="onDoctorOrDateChange()"
                name="appointmentDate"
                class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label
                class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Time Slot *
              </label>
              <div *ngIf="isLoadingSlots()" class="text-xs text-slate-400 py-2">
                Checking availability...
              </div>
              <select
                *ngIf="!isLoadingSlots()"
                required
                [(ngModel)]="timeSlot"
                name="timeSlot"
                class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option *ngIf="availableSlots().length === 0" value="09:00">
                  09:00 AM (Default)
                </option>
                <option
                  *ngFor="let s of availableSlots()"
                  [value]="s.startTime.substring(0, 5)"
                  [disabled]="!s.isBookable"
                >
                  {{ s.startTime.substring(0, 5) }} -
                  {{ s.endTime.substring(0, 5) }}
                  {{ !s.isBookable ? "(Unavailable)" : "" }}
                </option>
              </select>
            </div>
          </div>

          <!-- Reason Field -->
          <div>
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Reason for Consultation
            </label>
            <input
              type="text"
              placeholder="e.g. Regular Follow-up, Chest Discomfort, Lab Report Review"
              [(ngModel)]="reason"
              name="reason"
              class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <!-- Notes Field -->
          <div>
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Clinical Notes / Symptoms
            </label>
            <textarea
              rows="2"
              placeholder="Additional notes for the specialist..."
              [(ngModel)]="notes"
              name="notes"
              class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>

          <!-- Modal Actions -->
          <div
            class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800"
          >
            <button
              type="button"
              (click)="onCloseModal()"
              class="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="
                isBooking() || (isStaff() && patientId === 0) || doctorId === 0
              "
              class="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <app-icon name="calendar" [size]="14"></app-icon>
              <span>{{
                isBooking() ? "Booking..." : "Confirm Appointment"
              }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class BookingModalComponent implements OnInit, OnChanges {
  private doctorService = inject(DoctorService);
  private patientService = inject(PatientService);
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);

  @Input() isOpen = false;
  @Input() preselectedPatientId?: number;
  @Input() preselectedDoctorId?: number;
  @Input() preselectedDate?: string;
  @Input() preselectedTimeSlot?: string;

  @Output() close = new EventEmitter<void>();
  @Output() appointmentBooked = new EventEmitter<void>();

  readonly isStaff = this.authService.isStaff;
  readonly minDate = new Date().toISOString().split("T")[0];

  patientId = 0;
  doctorId = 0;
  appointmentDate = new Date().toISOString().split("T")[0];
  timeSlot = "09:00";
  reason = "";
  notes = "";

  readonly doctors = signal<DoctorDto[]>([]);
  readonly patients = signal<PatientDto[]>([]);
  readonly availableSlots = signal<TimeSlotDto[]>([]);
  readonly isLoadingSlots = signal(false);
  readonly isBooking = signal(false);
  readonly isSuccess = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.doctorService.getDoctors().subscribe((docs) => this.doctors.set(docs));
    if (this.isStaff()) {
      this.patientService
        .getPatients("", 1, 100)
        .subscribe((res) => this.patients.set(res.items));
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["preselectedPatientId"] && this.preselectedPatientId) {
      this.patientId = this.preselectedPatientId;
    }
    if (changes["preselectedDoctorId"] && this.preselectedDoctorId) {
      this.doctorId = this.preselectedDoctorId;
    }
    if (changes["preselectedDate"] && this.preselectedDate) {
      this.appointmentDate = this.preselectedDate;
    }
    if (changes["preselectedTimeSlot"] && this.preselectedTimeSlot) {
      this.timeSlot = this.preselectedTimeSlot.substring(0, 5);
    }
    if (changes["isOpen"] && this.isOpen && this.doctorId > 0) {
      this.fetchAvailability();
    }
  }

  onDoctorOrDateChange(): void {
    if (this.doctorId > 0 && this.appointmentDate) {
      this.fetchAvailability();
    }
  }

  fetchAvailability(): void {
    this.isLoadingSlots.set(true);
    this.doctorService
      .getDoctorAvailability(this.doctorId, this.appointmentDate)
      .subscribe({
        next: (avail) => {
          this.availableSlots.set(avail.slots || []);
          this.isLoadingSlots.set(false);
          const bookable = (avail.slots || []).find((s) => s.isBookable);
          if (bookable) {
            this.timeSlot = bookable.startTime.substring(0, 5);
          }
        },
        error: () => this.isLoadingSlots.set(false),
      });
  }

  formatFee(fee?: number): string {
    return formatCurrency(fee || 0);
  }

  handleBook(): void {
    this.errorMessage.set(null);
    this.isBooking.set(true);

    const fullSlot =
      this.timeSlot.length === 5 ? `${this.timeSlot}:00` : this.timeSlot;

    this.appointmentService
      .createAppointment({
        patientId: this.isStaff() ? this.patientId : undefined,
        doctorId: this.doctorId,
        appointmentDate: this.appointmentDate,
        timeSlot: fullSlot,
        reason: this.reason || "General Consultation",
        notes: this.notes,
      })
      .subscribe({
        next: () => {
          this.isBooking.set(false);
          this.isSuccess.set(true);
          this.appointmentBooked.emit();
          setTimeout(() => {
            this.isSuccess.set(false);
            this.close.emit();
          }, 1200);
        },
        error: (err) => {
          this.isBooking.set(false);
          this.errorMessage.set(
            err?.error?.message ||
              "Failed to book appointment. Please select another slot or doctor.",
          );
        },
      });
  }

  onCloseModal(): void {
    this.close.emit();
  }
}
