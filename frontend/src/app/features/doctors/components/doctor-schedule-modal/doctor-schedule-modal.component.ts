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
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DoctorService } from "@core/services/doctor.service";
import {
  DoctorDto,
  DoctorDirectoryItemDto,
  SaveDoctorScheduleDto,
  ScheduleExceptionType,
  DoctorScheduleExceptionDto,
} from "@core/models/doctor.models";
import { IconComponent } from "@shared/components/icon/icon.component";

@Component({
  selector: "app-doctor-schedule-modal",
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div
      *ngIf="isOpen && doctor"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
      (click)="onClose()"
    >
      <div
        (click)="$event.stopPropagation()"
        class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        <!-- Modal Header -->
        <div
          class="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <div
              class="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl"
            >
              <app-icon name="calendar" [size]="20"></app-icon>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 dark:text-white text-lg">
                Schedule & Availability Manager
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Manage recurring weekly hours and custom exception periods for
                {{ doctor.fullName }}.
              </p>
            </div>
          </div>
          <button
            type="button"
            (click)="onClose()"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <app-icon name="x" [size]="20"></app-icon>
          </button>
        </div>

        <!-- Mode Tabs -->
        <div
          class="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 px-6 pt-3"
        >
          <button
            type="button"
            (click)="activeTab.set('schedules')"
            [class]="
              'pb-3 px-4 text-xs font-semibold border-b-2 transition cursor-pointer ' +
              (activeTab() === 'schedules'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200')
            "
          >
            Recurring Weekly Hours
          </button>
          <button
            type="button"
            (click)="activeTab.set('exceptions')"
            [class]="
              'pb-3 px-4 text-xs font-semibold border-b-2 transition cursor-pointer ' +
              (activeTab() === 'exceptions'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200')
            "
          >
            Schedule Exceptions & Leaves
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto space-y-6">
          <!-- Success Message -->
          <div
            *ngIf="successMessage()"
            class="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-semibold"
          >
            <app-icon
              name="check-circle"
              [size]="16"
              className="text-emerald-600"
            ></app-icon>
            <span>{{ successMessage() }}</span>
          </div>

          <!-- TAB 1: Recurring Weekly Hours -->
          <div *ngIf="activeTab() === 'schedules'" class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500 dark:text-slate-400">
                Define the doctor's weekly consultation time slots.
              </span>
              <button
                type="button"
                (click)="addScheduleRow()"
                class="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <app-icon name="plus" [size]="14"></app-icon>
                <span>Add Time Window</span>
              </button>
            </div>

            <div class="space-y-2.5">
              <div
                *ngFor="let row of schedulesList(); let i = index"
                class="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs"
              >
                <!-- Day of week -->
                <div class="sm:col-span-3">
                  <label
                    class="block text-[10px] text-slate-400 uppercase font-semibold mb-1"
                    >Day</label
                  >
                  <select
                    [(ngModel)]="row.dayOfWeek"
                    class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option *ngFor="let d of daysOfWeek" [ngValue]="d.value">
                      {{ d.label }}
                    </option>
                  </select>
                </div>

                <!-- Start Time -->
                <div class="sm:col-span-2">
                  <label
                    class="block text-[10px] text-slate-400 uppercase font-semibold mb-1"
                    >Start</label
                  >
                  <input
                    type="time"
                    [(ngModel)]="row.startTime"
                    class="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <!-- End Time -->
                <div class="sm:col-span-2">
                  <label
                    class="block text-[10px] text-slate-400 uppercase font-semibold mb-1"
                    >End</label
                  >
                  <input
                    type="time"
                    [(ngModel)]="row.endTime"
                    class="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <!-- Slot Duration -->
                <div class="sm:col-span-2">
                  <label
                    class="block text-[10px] text-slate-400 uppercase font-semibold mb-1"
                    >Duration</label
                  >
                  <select
                    [(ngModel)]="row.slotDurationMinutes"
                    class="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option [ngValue]="15">15 min</option>
                    <option [ngValue]="20">20 min</option>
                    <option [ngValue]="30">30 min</option>
                    <option [ngValue]="45">45 min</option>
                    <option [ngValue]="60">60 min</option>
                  </select>
                </div>

                <!-- Session Label & Delete -->
                <div class="sm:col-span-3 flex items-center gap-2">
                  <div class="flex-1">
                    <label
                      class="block text-[10px] text-slate-400 uppercase font-semibold mb-1"
                      >Session</label
                    >
                    <input
                      type="text"
                      [(ngModel)]="row.sessionName"
                      placeholder="e.g. Morning OPD"
                      class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    (click)="removeScheduleRow(i)"
                    class="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg mt-4 cursor-pointer"
                  >
                    <app-icon name="trash-2" [size]="14"></app-icon>
                  </button>
                </div>
              </div>
            </div>

            <div
              class="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800"
            >
              <button
                type="button"
                [disabled]="isSaving()"
                (click)="saveSchedules()"
                class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <app-icon name="check-circle" [size]="14"></app-icon>
                <span>{{
                  isSaving() ? "Saving Schedules..." : "Save Weekly Schedule"
                }}</span>
              </button>
            </div>
          </div>

          <!-- TAB 2: Exceptions & Leaves -->
          <div *ngIf="activeTab() === 'exceptions'" class="space-y-4">
            <!-- Add Exception Form -->
            <form
              (ngSubmit)="handleCreateException()"
              class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3"
            >
              <h4
                class="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider"
              >
                Add Date Override / Leave Notice
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label class="block text-slate-500 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    [(ngModel)]="exceptionForm.date"
                    name="excDate"
                    class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label class="block text-slate-500 mb-1">Type *</label>
                  <select
                    [(ngModel)]="exceptionForm.exceptionType"
                    name="excType"
                    class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option [ngValue]="ScheduleExceptionType.Unavailable">
                      Full Day Leave / Off
                    </option>
                    <option [ngValue]="ScheduleExceptionType.CustomHours">
                      Custom Working Hours
                    </option>
                  </select>
                </div>

                <div>
                  <label class="block text-slate-500 mb-1">Reason</label>
                  <input
                    type="text"
                    placeholder="e.g. Medical Conference, Personal Leave"
                    [(ngModel)]="exceptionForm.reason"
                    name="excReason"
                    class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div
                *ngIf="
                  exceptionForm.exceptionType ===
                  ScheduleExceptionType.CustomHours
                "
                class="grid grid-cols-2 gap-3 text-xs"
              >
                <div>
                  <label class="block text-slate-500 mb-1">Custom Start</label>
                  <input
                    type="time"
                    [(ngModel)]="exceptionForm.startTime"
                    name="excStart"
                    class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-slate-500 mb-1">Custom End</label>
                  <input
                    type="time"
                    [(ngModel)]="exceptionForm.endTime"
                    name="excEnd"
                    class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div class="flex justify-end pt-2">
                <button
                  type="submit"
                  class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <app-icon name="plus" [size]="14"></app-icon>
                  <span>Submit Exception</span>
                </button>
              </div>
            </form>

            <!-- Current Exceptions List -->
            <div class="space-y-2">
              <h4
                class="text-xs font-bold text-slate-500 uppercase tracking-wider"
              >
                Scheduled Leaves & Overrides
              </h4>
              <div
                *ngIf="exceptionsList().length === 0"
                class="text-xs text-slate-400 py-3 text-center"
              >
                No exceptions on record.
              </div>
              <div
                *ngFor="let exc of exceptionsList()"
                class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
              >
                <div>
                  <div class="font-bold text-slate-800 dark:text-white">
                    {{ exc.date }} —
                    {{
                      exc.exceptionType === ScheduleExceptionType.Unavailable
                        ? "Full Day Off"
                        : "Custom Hours"
                    }}
                  </div>
                  <div class="text-[11px] text-slate-400">
                    Reason: {{ exc.reason || "None provided" }}
                  </div>
                </div>
                <button
                  type="button"
                  (click)="deleteException(exc.exceptionId)"
                  class="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                >
                  <app-icon name="trash-2" [size]="14"></app-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DoctorScheduleModalComponent implements OnInit, OnChanges {
  private doctorService = inject(DoctorService);

  @Input() isOpen = false;
  @Input() doctor?: DoctorDto | DoctorDirectoryItemDto;
  @Output() close = new EventEmitter<void>();

  readonly activeTab = signal<"schedules" | "exceptions">("schedules");
  readonly schedulesList = signal<SaveDoctorScheduleDto[]>([]);
  readonly exceptionsList = signal<DoctorScheduleExceptionDto[]>([]);
  readonly isSaving = signal(false);
  readonly successMessage = signal<string | null>(null);

  readonly ScheduleExceptionType = ScheduleExceptionType;

  readonly daysOfWeek = [
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
    { value: 0, label: "Sunday" },
  ];

  exceptionForm = {
    date: new Date().toISOString().split("T")[0],
    exceptionType: ScheduleExceptionType.Unavailable,
    startTime: "10:00",
    endTime: "13:00",
    reason: "",
  };

  ngOnInit(): void {
    if (this.doctor) this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["doctor"] && this.doctor && this.isOpen) {
      this.loadData();
    }
  }

  loadData(): void {
    if (!this.doctor) return;
    this.doctorService
      .getDoctorSchedules(this.doctor.doctorId)
      .subscribe((schedules) => {
        this.schedulesList.set(
          schedules.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime.substring(0, 5),
            endTime: s.endTime.substring(0, 5),
            slotDurationMinutes: s.slotDurationMinutes || 30,
            sessionName: s.sessionName || "Clinic Session",
          })),
        );
      });

    this.doctorService
      .getDoctorExceptions(this.doctor.doctorId)
      .subscribe((exceptions) => {
        this.exceptionsList.set(exceptions || []);
      });
  }

  addScheduleRow(): void {
    this.schedulesList.update((list) => [
      ...list,
      {
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
        slotDurationMinutes: 30,
        sessionName: "Clinic Session",
      },
    ]);
  }

  removeScheduleRow(index: number): void {
    this.schedulesList.update((list) => list.filter((_, i) => i !== index));
  }

  saveSchedules(): void {
    if (!this.doctor) return;
    this.isSaving.set(true);
    this.successMessage.set(null);

    this.doctorService
      .saveDoctorSchedules(this.doctor.doctorId, this.schedulesList())
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.successMessage.set("Weekly schedules saved successfully!");
          setTimeout(() => this.successMessage.set(null), 2500);
        },
        error: () => this.isSaving.set(false),
      });
  }

  handleCreateException(): void {
    if (!this.doctor) return;
    this.doctorService
      .createDoctorException(this.doctor.doctorId, {
        date: this.exceptionForm.date,
        exceptionType: this.exceptionForm.exceptionType,
        startTime: this.exceptionForm.startTime
          ? `${this.exceptionForm.startTime}:00`
          : undefined,
        endTime: this.exceptionForm.endTime
          ? `${this.exceptionForm.endTime}:00`
          : undefined,
        reason: this.exceptionForm.reason,
      })
      .subscribe({
        next: () => {
          this.loadData();
          this.exceptionForm.reason = "";
        },
      });
  }

  deleteException(id: number): void {
    if (!this.doctor) return;
    this.doctorService
      .deleteDoctorException(this.doctor.doctorId, id)
      .subscribe({
        next: () => this.loadData(),
      });
  }

  onClose(): void {
    this.close.emit();
  }
}
