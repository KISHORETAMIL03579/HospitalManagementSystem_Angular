import {
  Component,
  input,
  Output,
  EventEmitter,
  signal,
  computed,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DateTime } from "luxon";
import {
  AppointmentDto,
  AppointmentStatus,
} from "@core/models/appointment.models";
import { DoctorDto } from "@core/models/doctor.models";
import { SettingsService } from "@core/services/settings.service";
import { IconComponent } from "@shared/components/icon/icon.component";
import { StatusBadgeComponent } from "@shared/components/status-badge/status-badge.component";

export type CalendarGranularity = "month" | "week" | "day";

interface DayCell {
  date: Date;
  dateString: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  appointments: AppointmentDto[];
}

@Component({
  selector: "app-appointment-calendar-view",
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent],
  template: `
    <div
      class="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs transition-colors"
    >
      <!-- 1. Top Title Header (Clean single header) -->
      <div class="flex items-start sm:items-center justify-between gap-4">
        <div>
          <h2
            class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
          >
            Clinical Calendar
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage appointments, doctors and availability
          </p>
        </div>

        <button
          type="button"
          (click)="onBookNewAppointment()"
          class="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-sm flex items-center gap-1.5 transition cursor-pointer shrink-0"
        >
          <app-icon name="plus" [size]="16" className="text-white"></app-icon>
          <span>New Appointment</span>
        </button>
      </div>

      <!-- 2. Metrics Cards (Accurately partitioned counts) -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <!-- Card 1: Total Appointments -->
        <div
          class="bg-slate-50 border border-slate-200/90 dark:bg-slate-800/60 dark:border-slate-700 rounded-2xl p-4 flex flex-col justify-between shadow-2xs"
        >
          <span class="text-xs text-slate-500 dark:text-slate-400 font-medium"
            >Total appointments</span
          >
          <div
            class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white my-1"
          >
            {{ totalVisitsCount() }}
          </div>
          <span class="text-[11px] text-slate-500"
            >Active filters & date range</span
          >
        </div>

        <!-- Card 2: Confirmed -->
        <div
          class="bg-slate-50 border border-slate-200/90 dark:bg-slate-800/60 dark:border-slate-700 rounded-2xl p-4 flex flex-col justify-between shadow-2xs"
        >
          <span class="text-xs text-slate-500 dark:text-slate-400 font-medium"
            >Confirmed</span
          >
          <div
            class="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 my-1"
          >
            {{ confirmedVisitsCount() }}
          </div>
          <span class="text-[11px] text-slate-500"
            >Confirmed consultations</span
          >
        </div>

        <!-- Card 3: Pending -->
        <div
          class="bg-slate-50 border border-slate-200/90 dark:bg-slate-800/60 dark:border-slate-700 rounded-2xl p-4 flex flex-col justify-between shadow-2xs"
        >
          <span class="text-xs text-slate-500 dark:text-slate-400 font-medium"
            >Pending</span
          >
          <div
            class="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 my-1"
          >
            {{ pendingVisitsCount() }}
          </div>
          <span class="text-[11px] text-slate-500">Awaiting confirmation</span>
        </div>

        <!-- Card 4: Cancelled -->
        <div
          class="bg-slate-50 border border-slate-200/90 dark:bg-slate-800/60 dark:border-slate-700 rounded-2xl p-4 flex flex-col justify-between shadow-2xs"
        >
          <span class="text-xs text-slate-500 dark:text-slate-400 font-medium"
            >Cancelled</span
          >
          <div
            class="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 my-1"
          >
            {{ cancelledVisitsCount() }}
          </div>
          <span class="text-[11px] text-slate-500">Cancelled & No-Show</span>
        </div>
      </div>

      <!-- 3. Period Row (Only one navigation control, beside main heading) -->
      <div class="flex items-center justify-between gap-4 pt-1">
        <div>
          <h3
            class="text-lg sm:text-xl font-bold text-slate-900 dark:text-white"
          >
            {{ currentPeriodTitle() }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select a date to view its agenda
          </p>
        </div>

        <!-- Single Month Navigation Control: < Today > -->
        <div
          class="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 shadow-2xs"
        >
          <button
            type="button"
            (click)="navigatePrev()"
            title="Previous period"
            class="w-7 h-7 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <app-icon name="chevron-left" [size]="15"></app-icon>
          </button>
          <button
            type="button"
            (click)="navigateToday()"
            [class]="
              'px-3 py-1 text-xs font-semibold rounded-full transition cursor-pointer ' +
              (isCurrentPeriodToday()
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white')
            "
          >
            Today
          </button>
          <button
            type="button"
            (click)="navigateNext()"
            title="Next period"
            class="w-7 h-7 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <app-icon name="chevron-right" [size]="15"></app-icon>
          </button>
        </div>
      </div>

      <!-- 4. Filters & View Switcher Row (Reactive filter signals) -->
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3">
          <!-- Doctor Dropdown -->
          <div>
            <label
              class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >Doctor</label
            >
            <div class="relative">
              <select
                [ngModel]="selectedDoctorId()"
                (ngModelChange)="onDoctorChange($event)"
                class="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full pl-4 pr-9 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none min-w-[170px] shadow-2xs"
              >
                <option value="ALL">All doctors</option>
                <option *ngFor="let doc of doctors()" [value]="doc.doctorId">
                  Dr. {{ doc.fullName }}
                </option>
              </select>
              <app-icon
                name="chevron-down"
                [size]="14"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              ></app-icon>
            </div>
          </div>

          <!-- Status Dropdown -->
          <div>
            <label
              class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >Status</label
            >
            <div class="relative">
              <select
                [ngModel]="selectedStatus()"
                (ngModelChange)="onStatusChange($event)"
                class="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full pl-4 pr-9 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none min-w-[150px] shadow-2xs"
              >
                <option value="ALL">All statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Pending">Pending</option>
                <option value="CheckedIn">Checked In</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <app-icon
                name="chevron-down"
                [size]="14"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              ></app-icon>
            </div>
          </div>

          <!-- Clear Filters Action -->
          <div *ngIf="hasActiveFilters()" class="pt-5">
            <button
              type="button"
              (click)="clearFilters()"
              class="px-3.5 py-1.5 rounded-full text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <app-icon name="x" [size]="12"></app-icon>
              <span>Clear filters</span>
            </button>
          </div>
        </div>

        <!-- Calendar View Switcher (Month | Week | Day) -->
        <div>
          <label
            class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 sm:text-right"
            >Calendar view</label
          >
          <div
            class="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 shadow-2xs"
          >
            <button
              type="button"
              (click)="granularity.set('month')"
              [class]="
                'px-4 py-1 text-xs font-semibold rounded-full transition cursor-pointer ' +
                (granularity() === 'month'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white')
              "
            >
              Month
            </button>
            <button
              type="button"
              (click)="granularity.set('week')"
              [class]="
                'px-4 py-1 text-xs font-semibold rounded-full transition cursor-pointer ' +
                (granularity() === 'week'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white')
              "
            >
              Week
            </button>
            <button
              type="button"
              (click)="granularity.set('day')"
              [class]="
                'px-4 py-1 text-xs font-semibold rounded-full transition cursor-pointer ' +
                (granularity() === 'day'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white')
              "
            >
              Day
            </button>
          </div>
        </div>
      </div>

      <!-- 5. Calendar Grid (Month View) -->
      <div *ngIf="granularity() === 'month'" class="space-y-3">
        <!-- Weekday Headers -->
        <div
          class="grid grid-cols-7 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 py-1"
        >
          <div *ngFor="let dayName of weekDayNames">
            {{ dayName }}
          </div>
        </div>

        <!-- Month Day Cells (Rounded individual boxes with gap) -->
        <div class="grid grid-cols-7 gap-2">
          <div
            *ngFor="let cell of monthCells()"
            (click)="onDayCellClick(cell)"
            [class]="
              'min-h-[100px] sm:min-h-[115px] p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group select-none ' +
              (cell.isSelected
                ? 'bg-blue-50/90 dark:bg-blue-950/80 border-2 border-blue-600 dark:border-blue-400 text-blue-950 dark:text-blue-100 font-bold shadow-md z-10'
                : !cell.isCurrentMonth
                  ? 'bg-slate-50/40 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 opacity-40 text-slate-400 dark:text-slate-600'
                  : 'bg-slate-50/80 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-slate-500 text-slate-800 dark:text-white shadow-2xs')
            "
          >
            <!-- Top Row: Day Number (Always visible) -->
            <div class="flex items-center justify-between">
              <span
                [class]="
                  'text-xs font-bold ' +
                  (cell.isSelected
                    ? 'text-blue-900 dark:text-blue-300 font-extrabold'
                    : cell.isToday
                      ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                      : '')
                "
              >
                {{ cell.dayNumber }}
              </span>

              <!-- Dot if appointments exist -->
              <span
                *ngIf="cell.appointments.length > 0 && !cell.isSelected"
                class="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"
              ></span>
            </div>

            <!-- Bottom Area: Max 2 appointment pills with time & short patient label + "+N more" button -->
            <div class="space-y-1 mt-auto overflow-hidden">
              <div
                *ngFor="let apt of cell.appointments.slice(0, 2)"
                (click)="onAppointmentClick(apt, $event)"
                [class]="
                  'px-2 py-0.5 rounded-md text-[10px] font-medium tracking-tight truncate border cursor-pointer hover:opacity-90 transition flex items-center gap-1 ' +
                  getAppointmentPillClass(apt.status, cell.isSelected)
                "
                [title]="
                  apt.patientName +
                  ' with Dr. ' +
                  apt.doctorName +
                  ' (' +
                  (apt.timeSlot || 'Scheduled') +
                  ') - ' +
                  (apt.reason || 'Consultation')
                "
              >
                <span class="font-bold font-mono shrink-0">{{
                  formatSlotTime(apt.timeSlot)
                }}</span>
                <span class="truncate font-semibold">{{
                  getShortPatientName(apt.patientName)
                }}</span>
              </div>

              <!-- "+N more" Button: Opens modal containing ALL appointments without changing selected date -->
              <button
                *ngIf="cell.appointments.length > 2"
                type="button"
                (click)="onMoreAppointmentsClick(cell, $event)"
                class="w-full text-left text-[9.5px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer py-0.5 block truncate"
              >
                +{{ cell.appointments.length - 2 }} more
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 6. Week View -->
      <div
        *ngIf="granularity() === 'week'"
        class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xs"
      >
        <div
          class="grid grid-cols-7 divide-x divide-slate-200 dark:divide-slate-700"
        >
          <div
            *ngFor="let day of weekDays()"
            class="min-h-[400px] flex flex-col"
          >
            <div
              (click)="
                onDayCellClick({
                  date: day.date,
                  dateString: day.dateString,
                  dayNumber: day.date.getDate(),
                  isCurrentMonth: true,
                  isToday: day.isToday,
                  isSelected: day.dateString === selectedDateString(),
                  appointments: day.appointments,
                })
              "
              [class]="
                'p-3 text-center border-b border-slate-200 dark:border-slate-700 cursor-pointer transition ' +
                (day.isToday
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                  : 'bg-slate-50 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700')
              "
            >
              <div
                class="text-[11px] font-bold uppercase tracking-wider opacity-80"
              >
                {{ day.date | date: "EEE" }}
              </div>
              <div class="text-base font-bold mt-0.5">
                {{ day.date | date: "d MMM" }}
              </div>
              <div class="text-[10px] text-slate-500 mt-0.5">
                {{ day.appointments.length }} visits
              </div>
            </div>
            <div class="p-2 space-y-2 flex-1 overflow-y-auto">
              <div
                *ngIf="day.appointments.length === 0"
                class="text-center py-10 text-[11px] text-slate-400"
              >
                No visits
              </div>
              <div
                *ngFor="let apt of day.appointments"
                (click)="onAppointmentClick(apt, $event)"
                class="p-2 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 hover:border-blue-500 text-xs transition cursor-pointer space-y-1 shadow-2xs"
              >
                <div
                  class="flex items-center justify-between font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold"
                >
                  <span>{{ formatSlotTime(apt.timeSlot) }}</span>
                  <span class="text-slate-500 text-[9px]">{{
                    apt.status
                  }}</span>
                </div>
                <div class="font-bold text-slate-900 dark:text-white truncate">
                  {{ apt.patientName }}
                </div>
                <div
                  class="text-[10px] text-slate-500 dark:text-slate-400 truncate"
                >
                  Dr. {{ apt.doctorName }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 7. Day View -->
      <div
        *ngIf="granularity() === 'day'"
        class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xs"
      >
        <div
          class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700"
        >
          <div>
            <span
              class="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider"
              >Clinical Agenda</span
            >
            <h4 class="text-lg font-bold text-slate-900 dark:text-white">
              {{ activeJsDate() | date: "fullDate" }}
            </h4>
          </div>
          <span
            class="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300"
          >
            {{ dayAppointments().length }} Visits
          </span>
        </div>
        <div
          *ngIf="dayAppointments().length === 0"
          class="py-12 text-center text-slate-400 text-xs"
        >
          No appointments scheduled for this day. Click "+ New Appointment" to
          add a consultation.
        </div>
        <div *ngIf="dayAppointments().length > 0" class="space-y-2.5">
          <div
            *ngFor="let apt of dayAppointments()"
            (click)="onAppointmentClick(apt, $event)"
            class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 hover:border-blue-500 transition cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
          >
            <div class="flex items-center gap-3">
              <span
                class="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-mono text-xs font-bold"
              >
                {{ formatSlotTime(apt.timeSlot) }}
              </span>
              <div>
                <h5 class="text-sm font-bold text-slate-900 dark:text-white">
                  {{ apt.patientName }}
                </h5>
                <span class="text-xs text-slate-500 dark:text-slate-400"
                  >Dr. {{ apt.doctorName }} • {{ apt.specialization }}</span
                >
              </div>
            </div>
            <app-status-badge
              [status]="apt.status"
              size="sm"
            ></app-status-badge>
          </div>
        </div>
      </div>

      <!-- 8. Agenda Section for Selected Day (Compact and Chronological) -->
      <div class="space-y-3 pt-2">
        <!-- Top Agenda Row: "Agenda for [Selected Date]" on left, "Doctor Shifts" pill button on right -->
        <div class="flex items-center justify-between">
          <span class="text-sm font-bold text-slate-900 dark:text-white">
            Agenda for {{ selectedDayShortLabel() }}
          </span>

          <button
            type="button"
            (click)="toggleDoctorShifts()"
            class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-slate-500 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium transition cursor-pointer shadow-2xs"
          >
            <app-icon
              name="clock"
              [size]="14"
              className="text-slate-500 dark:text-slate-300"
            ></app-icon>
            <span>Doctor Shifts</span>
          </button>
        </div>

        <!-- Selected-Day Card Container -->
        <div
          class="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs"
        >
          <!-- Title & Visits Badge -->
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-base font-bold text-slate-900 dark:text-white">
                {{ selectedDateFull() }}
              </h4>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Selected-day appointments
              </p>
            </div>

            <span
              class="px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-2xs"
            >
              {{ selectedDayAppointments().length }} visits
            </span>
          </div>

          <!-- Empty State (Reduced height, compact layout) -->
          <div
            *ngIf="selectedDayAppointments().length === 0"
            class="py-4 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-700/60 rounded-xl bg-white/60 dark:bg-slate-800/30"
          >
            <div
              class="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400"
            >
              <app-icon name="calendar" [size]="16"></app-icon>
              <span
                class="text-xs font-semibold text-slate-700 dark:text-slate-300"
                >No appointments scheduled for this date</span
              >
            </div>
            <p class="text-[11px] text-slate-400">
              Try changing the filters or schedule a new consultation.
            </p>
            <div>
              <button
                type="button"
                (click)="onBookNewAppointment()"
                class="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <app-icon name="plus" [size]="13"></app-icon>
                <span>Schedule Appointment</span>
              </button>
            </div>
          </div>

          <!-- List of Visits (When visits exist on selected day) -->
          <div
            *ngIf="selectedDayAppointments().length > 0"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            <div
              *ngFor="let apt of selectedDayAppointments()"
              (click)="onAppointmentClick(apt)"
              class="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition cursor-pointer space-y-2 group shadow-2xs"
            >
              <div class="flex items-center justify-between gap-2">
                <span
                  class="font-bold text-xs font-mono text-blue-600 dark:text-blue-400 flex items-center gap-1"
                >
                  <app-icon name="clock" [size]="13"></app-icon>
                  <span>{{ formatSlotTime(apt.timeSlot) }}</span>
                </span>
                <app-status-badge
                  [status]="apt.status"
                  size="sm"
                ></app-status-badge>
              </div>
              <div>
                <h5
                  class="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition"
                >
                  {{ apt.patientName }}
                </h5>
                <span
                  class="text-[11px] font-mono text-slate-500 dark:text-slate-400 block"
                >
                  MRN: {{ apt.medicalRecordNumber || "N/A" }}
                </span>
              </div>
              <div
                class="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700"
              >
                <app-icon
                  name="stethoscope"
                  [size]="13"
                  className="text-slate-400"
                ></app-icon>
                <span class="font-medium">Dr. {{ apt.doctorName }}</span>
                <span>•</span>
                <span class="text-slate-400 truncate">{{
                  apt.specialization
                }}</span>
              </div>
              <div
                *ngIf="apt.reason"
                class="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-transparent"
              >
                "{{ apt.reason }}"
              </div>
            </div>
          </div>

          <!-- Bottom Footer Note -->
          <div
            class="pt-3 border-t border-slate-200/80 dark:border-slate-700 text-[11px] text-slate-400 dark:text-slate-500"
          >
            Interactive UI connected with CareFlow HMS appointment & clinical
            availability API.
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- 9. Expanded "+N More" Day Appointments Modal / Popover    -->
      <!-- ======================================================== -->
      <div
        *ngIf="expandedDayModal()"
        class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      >
        <div
          class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl"
        >
          <!-- Modal Header -->
          <div
            class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800"
          >
            <div>
              <h4
                class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2"
              >
                <app-icon
                  name="calendar"
                  [size]="18"
                  className="text-blue-600 dark:text-blue-400"
                ></app-icon>
                <span>{{
                  getModalDateHeader(expandedDayModal()?.dateString)
                }}</span>
              </h4>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                {{ expandedDayModal()?.appointments?.length }} scheduled
                appointments for this day
              </p>
            </div>
            <button
              type="button"
              (click)="closeExpandedDayModal()"
              class="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            >
              <app-icon name="x" [size]="18"></app-icon>
            </button>
          </div>

          <!-- Full Appointments List -->
          <div class="max-h-[60vh] overflow-y-auto space-y-2.5 pr-1">
            <div
              *ngFor="let apt of expandedDayModal()?.appointments"
              (click)="onAppointmentFromModal(apt)"
              class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition cursor-pointer space-y-1.5 shadow-2xs group"
            >
              <div class="flex items-center justify-between gap-2">
                <span
                  class="font-bold text-xs font-mono text-blue-600 dark:text-blue-400 flex items-center gap-1"
                >
                  <app-icon name="clock" [size]="13"></app-icon>
                  <span>{{ formatSlotTime(apt.timeSlot) }}</span>
                </span>
                <app-status-badge
                  [status]="apt.status"
                  size="sm"
                ></app-status-badge>
              </div>
              <div>
                <h5
                  class="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition"
                >
                  {{ apt.patientName }}
                </h5>
                <span
                  class="text-[11px] font-mono text-slate-500 dark:text-slate-400"
                >
                  MRN: {{ apt.medicalRecordNumber || "N/A" }}
                </span>
              </div>
              <div
                class="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-700/60"
              >
                <app-icon
                  name="stethoscope"
                  [size]="13"
                  className="text-slate-400"
                ></app-icon>
                <span class="font-medium">Dr. {{ apt.doctorName }}</span>
                <span>•</span>
                <span class="text-slate-400 truncate">{{
                  apt.specialization
                }}</span>
              </div>
              <div
                *ngIf="apt.reason"
                class="text-[11px] text-slate-500 dark:text-slate-400 italic"
              >
                "{{ apt.reason }}"
              </div>
            </div>
          </div>

          <!-- Modal Footer Actions -->
          <div
            class="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800"
          >
            <button
              type="button"
              (click)="onBookFromModal(expandedDayModal()?.dateString)"
              class="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <app-icon name="plus" [size]="14"></app-icon>
              <span>Schedule on this Day</span>
            </button>
            <button
              type="button"
              (click)="closeExpandedDayModal()"
              class="px-4 py-2 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <!-- 10. Doctor Shifts Drawer / Overlay Modal -->
      <div
        *ngIf="isDoctorShiftsOpen()"
        class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      >
        <div
          class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 space-y-4 shadow-2xl"
        >
          <div
            class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800"
          >
            <div>
              <h4
                class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2"
              >
                <app-icon
                  name="clock"
                  [size]="18"
                  className="text-blue-600 dark:text-blue-400"
                ></app-icon>
                <span>Doctor Shifts & Working Schedules</span>
              </h4>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Regular hours, break times, and on-duty clinicians
              </p>
            </div>
            <button
              type="button"
              (click)="isDoctorShiftsOpen.set(false)"
              class="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            >
              <app-icon name="x" [size]="18"></app-icon>
            </button>
          </div>

          <div class="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
            <div
              *ngFor="let doc of doctors()"
              class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-2xs"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/60 border border-blue-200 dark:border-blue-700/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs"
                >
                  Dr
                </div>
                <div>
                  <h5 class="text-sm font-bold text-slate-900 dark:text-white">
                    Dr. {{ doc.fullName }}
                  </h5>
                  <span class="text-xs text-slate-500 dark:text-slate-400"
                    >{{ doc.specialization }} ·
                    {{ doc.departmentName || "Outpatient Clinic" }}</span
                  >
                  <div
                    class="text-[11px] text-blue-600 dark:text-blue-400 font-mono mt-0.5"
                  >
                    Shift:
                    {{
                      doc.startTime ? doc.startTime.substring(0, 5) : "09:00"
                    }}
                    -
                    {{ doc.endTime ? doc.endTime.substring(0, 5) : "17:00" }} ·
                    Lunch: 13:00 - 14:00
                  </div>
                </div>
              </div>

              <button
                type="button"
                (click)="onBookForDoctor(doc.doctorId)"
                class="px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer shrink-0 shadow-2xs"
              >
                Book
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AppointmentCalendarViewComponent {
  // Reactive signal inputs
  readonly appointments = input<AppointmentDto[]>([]);
  readonly doctors = input<DoctorDto[]>([]);

  @Output() selectAppointment = new EventEmitter<AppointmentDto>();
  @Output() bookAppointment = new EventEmitter<{
    date?: string;
    doctorId?: number;
  }>();

  private settingsService = inject(SettingsService);

  readonly weekDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  readonly activeDate = signal<DateTime>(DateTime.now());
  readonly granularity = signal<CalendarGranularity>("month");
  readonly selectedDateString = signal<string>(DateTime.now().toISODate()!);
  readonly isDoctorShiftsOpen = signal(false);
  readonly expandedDayModal = signal<DayCell | null>(null);

  // Reactive filter signals
  readonly selectedDoctorId = signal<number | "ALL">("ALL");
  readonly selectedStatus = signal<string>("ALL");

  readonly activeJsDate = computed(() => this.activeDate().toJSDate());

  readonly hasActiveFilters = computed(() => {
    return this.selectedDoctorId() !== "ALL" || this.selectedStatus() !== "ALL";
  });

  readonly isCurrentPeriodToday = computed(() => {
    const now = DateTime.now();
    const d = this.activeDate();
    const g = this.granularity();
    if (g === "month") return d.hasSame(now, "month") && d.hasSame(now, "year");
    if (g === "week") return d.hasSame(now, "week");
    return d.hasSame(now, "day");
  });

  private getAppointmentDateIso(dateStr?: string): string {
    if (!dateStr) return "";
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      return dateStr.substring(0, 10);
    }
    try {
      const dt = DateTime.fromISO(dateStr, {
        zone: this.settingsService.timeZone(),
      });
      if (dt.isValid) return dt.toISODate() || "";
    } catch {
      // fallback
    }
    return dateStr.slice(0, 10);
  }

  // Single source of truth: filtered dataset derived from appointments + reactive filter signals
  readonly filteredAppointments = computed(() => {
    let list = this.appointments();

    const docId = this.selectedDoctorId();
    if (docId !== "ALL") {
      list = list.filter((a) => Number(a.doctorId) === Number(docId));
    }

    const statusFilter = this.selectedStatus();
    if (statusFilter !== "ALL") {
      const target = statusFilter.toLowerCase();
      list = list.filter((a) => {
        const s = String(a.status).toLowerCase();
        if (target === "pending") {
          return s === "pending" || s === "0";
        }
        if (target === "confirmed") {
          return s === "confirmed" || s === "10";
        }
        if (target === "checkedin") {
          return s === "checkedin" || s === "20";
        }
        if (target === "inconsultation") {
          return s === "inconsultation" || s === "30";
        }
        if (target === "completed") {
          return s === "completed" || s === "40";
        }
        if (target === "cancelled") {
          return (
            s === "cancelled" || s === "50" || s === "noshow" || s === "60"
          );
        }
        return s === target;
      });
    }

    return list;
  });

  // Metrics derived from the active filtered dataset
  readonly totalVisitsCount = computed(
    () => this.filteredAppointments().length,
  );

  readonly confirmedVisitsCount = computed(() => {
    return this.filteredAppointments().filter((a) => {
      const s = String(a.status).toLowerCase();
      return s === "confirmed" || s === "10";
    }).length;
  });

  readonly pendingVisitsCount = computed(() => {
    return this.filteredAppointments().filter((a) => {
      const s = String(a.status).toLowerCase();
      return (
        s === "pending" ||
        s === "0" ||
        s === "checkedin" ||
        s === "20" ||
        s === "inconsultation" ||
        s === "30"
      );
    }).length;
  });

  readonly cancelledVisitsCount = computed(() => {
    return this.filteredAppointments().filter((a) => {
      const s = String(a.status).toLowerCase();
      return s === "cancelled" || s === "50" || s === "noshow" || s === "60";
    }).length;
  });

  readonly currentPeriodTitle = computed(() => {
    const d = this.activeDate();
    const g = this.granularity();
    if (g === "day") return d.toFormat("cccc, dd LLL yyyy");
    if (g === "week") {
      const sundayOffset = d.weekday % 7;
      const start = d.minus({ days: sundayOffset });
      const end = start.plus({ days: 6 });
      return `${start.toFormat("dd LLL")} - ${end.toFormat("dd LLL yyyy")}`;
    }
    return d.toFormat("LLLL yyyy");
  });

  readonly selectedDayShortLabel = computed(() => {
    const iso = this.selectedDateString();
    if (!iso) return "Today";
    const dt = DateTime.fromISO(iso);
    return dt.isValid ? dt.toFormat("d LLLL") : iso;
  });

  readonly selectedDateFull = computed(() => {
    const iso = this.selectedDateString();
    if (!iso) return "Today";
    const dt = DateTime.fromISO(iso);
    return dt.isValid ? dt.toFormat("d LLLL yyyy") : iso;
  });

  readonly selectedDayAppointments = computed(() => {
    const iso = this.selectedDateString();
    if (!iso) return [];
    return this.getAppointmentsForDate(iso);
  });

  readonly monthCells = computed(() => {
    const active = this.activeDate();
    const firstOfMonth = active.startOf("month");
    const lastOfMonth = active.endOf("month");
    const todayStr = DateTime.now().toISODate()!;
    const selStr = this.selectedDateString();

    const startDayOfWeek = firstOfMonth.weekday % 7; // 0=Sun, 1=Mon, ..., 6=Sat
    const cells: DayCell[] = [];

    // Fill days before the 1st of the month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dt = firstOfMonth.minus({ days: i + 1 });
      const dateString = dt.toISODate()!;
      cells.push({
        date: dt.toJSDate(),
        dateString,
        dayNumber: dt.day,
        isCurrentMonth: false,
        isToday: dateString === todayStr,
        isSelected: dateString === selStr,
        appointments: this.getAppointmentsForDate(dateString),
      });
    }

    // Days in current month
    for (let d = 1; d <= lastOfMonth.day; d++) {
      const dt = firstOfMonth.set({ day: d });
      const dateString = dt.toISODate()!;
      cells.push({
        date: dt.toJSDate(),
        dateString,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateString === todayStr,
        isSelected: dateString === selStr,
        appointments: this.getAppointmentsForDate(dateString),
      });
    }

    // Complete grid to multiple of 7 (35 or 42 cells)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let r = 1; r <= remaining; r++) {
      const dt = lastOfMonth.plus({ days: r });
      const dateString = dt.toISODate()!;
      cells.push({
        date: dt.toJSDate(),
        dateString,
        dayNumber: dt.day,
        isCurrentMonth: false,
        isToday: dateString === todayStr,
        isSelected: dateString === selStr,
        appointments: this.getAppointmentsForDate(dateString),
      });
    }

    return cells;
  });

  readonly weekDays = computed(() => {
    const d = this.activeDate();
    const sundayOffset = d.weekday % 7;
    const startOfWeek = d.minus({ days: sundayOffset });
    const todayStr = DateTime.now().toISODate()!;
    const days = [];

    for (let i = 0; i < 7; i++) {
      const dt = startOfWeek.plus({ days: i });
      const dateString = dt.toISODate()!;
      days.push({
        date: dt.toJSDate(),
        dateString,
        isToday: dateString === todayStr,
        appointments: this.getAppointmentsForDate(dateString),
      });
    }
    return days;
  });

  readonly dayAppointments = computed(() => {
    const dateStr = this.activeDate().toISODate()!;
    return this.getAppointmentsForDate(dateStr);
  });

  navigatePrev(): void {
    const g = this.granularity();
    let next: DateTime;
    if (g === "month") {
      next = this.activeDate().minus({ months: 1 });
    } else if (g === "week") {
      next = this.activeDate().minus({ weeks: 1 });
    } else {
      next = this.activeDate().minus({ days: 1 });
    }
    this.activeDate.set(next);
    this.syncSelectedDateWithActivePeriod(next);
  }

  navigateNext(): void {
    const g = this.granularity();
    let next: DateTime;
    if (g === "month") {
      next = this.activeDate().plus({ months: 1 });
    } else if (g === "week") {
      next = this.activeDate().plus({ weeks: 1 });
    } else {
      next = this.activeDate().plus({ days: 1 });
    }
    this.activeDate.set(next);
    this.syncSelectedDateWithActivePeriod(next);
  }

  private syncSelectedDateWithActivePeriod(date: DateTime): void {
    const now = DateTime.now();
    // If navigating to the month that contains today, select today
    if (date.hasSame(now, "month") && date.hasSame(now, "year")) {
      this.selectedDateString.set(now.toISODate()!);
    } else {
      // Otherwise select the 1st of that month so the agenda displays the navigated month's date
      this.selectedDateString.set(date.startOf("month").toISODate()!);
    }
  }

  navigateToday(): void {
    const now = DateTime.now();
    this.activeDate.set(now);
    this.selectedDateString.set(now.toISODate()!);
  }

  onDayCellClick(cell: DayCell): void {
    this.selectedDateString.set(cell.dateString);
    const cellDate = DateTime.fromISO(cell.dateString);
    if (cellDate.isValid && !cell.isCurrentMonth) {
      this.activeDate.set(cellDate);
    }
  }

  onMoreAppointmentsClick(cell: DayCell, event: Event): void {
    event.stopPropagation();
    // Opens the popover modal without mutating selectedDateString
    this.expandedDayModal.set(cell);
  }

  closeExpandedDayModal(): void {
    this.expandedDayModal.set(null);
  }

  onAppointmentFromModal(apt: AppointmentDto): void {
    this.closeExpandedDayModal();
    this.selectAppointment.emit(apt);
  }

  onBookFromModal(dateString?: string): void {
    this.closeExpandedDayModal();
    this.bookAppointment.emit({
      date: dateString || this.selectedDateString(),
    });
  }

  getModalDateHeader(dateStr?: string): string {
    if (!dateStr) return "Appointments";
    const dt = DateTime.fromISO(dateStr);
    return dt.isValid ? dt.toFormat("EEEE, d LLLL yyyy") : dateStr;
  }

  onAppointmentClick(apt: AppointmentDto, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectAppointment.emit(apt);
  }

  onBookNewAppointment(): void {
    this.bookAppointment.emit({ date: this.selectedDateString() });
  }

  onBookForDoctor(doctorId: number): void {
    this.isDoctorShiftsOpen.set(false);
    this.bookAppointment.emit({ doctorId, date: this.selectedDateString() });
  }

  toggleDoctorShifts(): void {
    this.isDoctorShiftsOpen.update((v) => !v);
  }

  onDoctorChange(val: any): void {
    const norm = val === "ALL" || val === "" ? "ALL" : Number(val);
    this.selectedDoctorId.set(norm);
  }

  onStatusChange(val: string): void {
    this.selectedStatus.set(val || "ALL");
  }

  clearFilters(): void {
    this.selectedDoctorId.set("ALL");
    this.selectedStatus.set("ALL");
  }

  formatSlotTime(timeStr?: string): string {
    if (!timeStr) return "09:00";
    const trimmed = timeStr.trim();
    if (/^\d{2}:\d{2}/.test(trimmed)) {
      return trimmed.substring(0, 5);
    }
    return trimmed;
  }

  getShortPatientName(name?: string): string {
    if (!name) return "Patient";
    const parts = name.trim().split(" ");
    if (parts.length > 1) {
      return `${parts[0]} ${parts[1][0]}.`;
    }
    return parts[0];
  }

  getAppointmentPillClass(
    status: AppointmentStatus | string | number,
    isSelectedCell: boolean,
  ): string {
    if (isSelectedCell) {
      return "bg-blue-600 text-white border-blue-700 shadow-xs";
    }

    const s = String(status).toLowerCase();
    if (s === "10" || s === "confirmed") {
      // Soft light blue pill
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/60 dark:text-blue-200 dark:border-blue-800";
    }
    if (
      s === "0" ||
      s === "pending" ||
      s === "20" ||
      s === "checkedin" ||
      s === "30" ||
      s === "inconsultation"
    ) {
      // Soft amber pill
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-800";
    }
    if (s === "40" || s === "completed") {
      // Soft emerald pill
      return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-800";
    }
    // Cancelled / No show
    return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/60 dark:text-rose-200 dark:border-rose-800";
  }

  private getAppointmentsForDate(dateStr: string): AppointmentDto[] {
    return this.filteredAppointments().filter((apt) => {
      return this.getAppointmentDateIso(apt.appointmentDate) === dateStr;
    });
  }
}
