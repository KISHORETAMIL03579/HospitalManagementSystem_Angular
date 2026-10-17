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
import { DoctorService } from "@core/services/doctor.service";
import { DoctorAvailabilityDto, TimeSlotDto } from "@core/models/doctor.models";
import { IconComponent } from "@shared/components/icon/icon.component";

interface DayOption {
  iso: string;
  dayName: string;
  dayNum: number;
  monthName: string;
  isToday: boolean;
}

@Component({
  selector: "app-doctor-calendar-view",
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="space-y-5">
      <!-- Date Navigation Strip -->
      <div
        class="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <app-icon
              name="calendar"
              [size]="16"
              className="text-indigo-600 dark:text-indigo-400"
            ></app-icon>
            <span
              class="text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              Select Consultation Date
            </span>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              type="button"
              (click)="handlePrevDay()"
              class="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            >
              <app-icon name="chevron-left" [size]="16"></app-icon>
            </button>
            <button
              type="button"
              (click)="handleToday()"
              class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              (click)="handleNextDay()"
              class="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            >
              <app-icon name="chevron-right" [size]="16"></app-icon>
            </button>
          </div>
        </div>

        <!-- 7-Day Quick Strip -->
        <div class="grid grid-cols-7 gap-1.5 sm:gap-2">
          <button
            *ngFor="let day of upcomingDays"
            type="button"
            (click)="selectDate(day.iso)"
            [class]="
              'p-2 sm:p-2.5 rounded-xl border flex flex-col items-center gap-0.5 transition cursor-pointer ' +
              (selectedDate === day.iso
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 text-slate-700 dark:text-slate-200')
            "
          >
            <span
              class="text-[10px] font-bold uppercase tracking-wider opacity-80"
            >
              {{ day.dayName }}
            </span>
            <span class="text-sm sm:text-base font-bold">
              {{ day.dayNum }}
            </span>
            <span class="text-[9px] opacity-75">
              {{ day.monthName }}
            </span>
          </button>
        </div>
      </div>

      <!-- Time Slots Grid Grouped by Session -->
      <div class="space-y-4">
        <div
          *ngIf="isLoading()"
          class="py-8 text-center text-xs text-slate-400"
        >
          Loading available slots for {{ selectedDate }}...
        </div>

        <div
          *ngIf="
            !isLoading() &&
            availability() &&
            (!availability()?.slots || availability()?.slots?.length === 0)
          "
          class="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500"
        >
          <app-icon
            name="calendar"
            [size]="32"
            className="text-slate-400 mx-auto mb-2"
          ></app-icon>
          <p class="text-xs font-semibold">
            No available consultation slots on this date.
          </p>
          <p class="text-[11px] text-slate-400 mt-0.5">
            Please pick another date from the strip above.
          </p>
        </div>

        <div *ngIf="!isLoading() && sessionKeys().length > 0" class="space-y-4">
          <div *ngFor="let session of sessionKeys()" class="space-y-2">
            <h4
              class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5"
            >
              <app-icon name="clock" [size]="14"></app-icon>
              <span>{{ session }}</span>
            </h4>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                *ngFor="let slot of groupedSlots()[session]"
                type="button"
                [disabled]="!slot.isBookable"
                (click)="onSlotClick(slot)"
                [class]="
                  'p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition cursor-pointer ' +
                  (!slot.isBookable
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed'
                    : selectedSlotTime === slot.startTime.substring(0, 5)
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50')
                "
              >
                <span
                  >{{ slot.startTime.substring(0, 5) }} -
                  {{ slot.endTime.substring(0, 5) }}</span
                >
                <app-icon
                  [name]="slot.isBookable ? 'check' : 'x'"
                  [size]="12"
                ></app-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DoctorCalendarViewComponent implements OnInit, OnChanges {
  private doctorService = inject(DoctorService);

  @Input() doctorId = 0;
  @Input() doctorName?: string;
  @Input() selectedSlotTime?: string;

  @Output() selectSlot = new EventEmitter<{
    slot: TimeSlotDto;
    date: string;
  }>();

  selectedDate = new Date().toISOString().split("T")[0];
  readonly availability = signal<DoctorAvailabilityDto | null>(null);
  readonly isLoading = signal(false);

  upcomingDays: DayOption[] = [];

  ngOnInit(): void {
    this.initUpcomingDays();
    if (this.doctorId > 0) this.loadAvailability();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["doctorId"] && this.doctorId > 0) {
      this.loadAvailability();
    }
  }

  private initUpcomingDays(): void {
    const days: DayOption[] = [];
    const baseDate = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const isToday = i === 0;
      const dayName = isToday
        ? "Today"
        : d.toLocaleDateString("en-US", { weekday: "short" });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString("en-US", { month: "short" });
      days.push({ iso, dayName, dayNum, monthName, isToday });
    }
    this.upcomingDays = days;
  }

  loadAvailability(): void {
    this.isLoading.set(true);
    this.doctorService
      .getDoctorAvailability(this.doctorId, this.selectedDate)
      .subscribe({
        next: (avail) => {
          this.availability.set(avail);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  selectDate(iso: string): void {
    this.selectedDate = iso;
    this.loadAvailability();
  }

  handlePrevDay(): void {
    const cur = new Date(this.selectedDate);
    cur.setDate(cur.getDate() - 1);
    this.selectedDate = cur.toISOString().split("T")[0];
    this.loadAvailability();
  }

  handleNextDay(): void {
    const cur = new Date(this.selectedDate);
    cur.setDate(cur.getDate() + 1);
    this.selectedDate = cur.toISOString().split("T")[0];
    this.loadAvailability();
  }

  handleToday(): void {
    this.selectedDate = new Date().toISOString().split("T")[0];
    this.loadAvailability();
  }

  groupedSlots = computed(() => {
    const avail = this.availability();
    if (!avail?.slots) return {};
    const groups: Record<string, TimeSlotDto[]> = {};
    avail.slots.forEach((slot) => {
      const session = slot.sessionName || "Consultation Hours";
      if (!groups[session]) groups[session] = [];
      groups[session].push(slot);
    });
    return groups;
  });

  sessionKeys = computed(() => Object.keys(this.groupedSlots()));

  onSlotClick(slot: TimeSlotDto): void {
    if (!slot.isBookable) return;
    this.selectSlot.emit({ slot, date: this.selectedDate });
  }
}
