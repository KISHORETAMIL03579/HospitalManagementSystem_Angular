import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { AuthService } from "@core/services/auth.service";
import { PatientService } from "@core/services/patient.service";
import { DoctorService } from "@core/services/doctor.service";
import { AppointmentService } from "@core/services/appointment.service";
import { SettingsService } from "@core/services/settings.service";
import { formatRoleDisplay } from "@core/models/auth.models";
import { PatientDto } from "@core/models/patient.models";
import { DoctorDto, DepartmentDto } from "@core/models/doctor.models";
import {
  AppointmentDto,
  AppointmentStatus,
} from "@core/models/appointment.models";
import { calculateAge } from "@core/utils/format-utils";
import {
  formatTimeSlot,
  formatDateByPattern,
  formatLiveTime,
} from "@core/utils/date-utils";
import { IconComponent } from "@shared/components/icon/icon.component";
import { StatusBadgeComponent } from "@shared/components/status-badge/status-badge.component";

@Component({
  selector: "app-dashboard-page",
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent, StatusBadgeComponent],
  template: `
    <div class="space-y-6">
      <!-- Welcome Banner with Live Real-time Clock -->
      <div
        class="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden"
      >
        <div
          class="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"
        ></div>
        <div
          class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <div
              class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold border border-blue-400/20 mb-3"
            >
              <app-icon
                name="activity"
                [size]="14"
                className="text-blue-300 animate-pulse"
              ></app-icon>
              <span>
                {{
                  isPatient()
                    ? "CareFlow Patient Portal"
                    : "CareFlow Hospital Operating System"
                }}
              </span>
            </div>
            <h1 class="text-2xl font-bold tracking-tight">
              Welcome back,
              {{
                currentUser()?.fullName ||
                  (isPatient() ? "Patient" : "Hospital Staff")
              }}! 👋
            </h1>
            <p class="text-blue-200 text-sm mt-1">
              Signed in as
              <span class="font-semibold text-white">
                {{
                  formatRole(currentUser()?.roleName, currentUser()?.role)
                }} </span
              >.
              {{
                isPatient()
                  ? "Here is your personal healthcare portal and scheduled visits."
                  : "Here is your live hospital overview."
              }}
            </p>
          </div>

          <!-- Real-time Clock Widget & Primary Action -->
          <div class="flex flex-col items-start md:items-end gap-2 shrink-0">
            <div
              class="flex items-center gap-2 bg-blue-950/60 backdrop-blur border border-blue-400/20 px-4 py-2 rounded-xl"
            >
              <app-icon
                name="clock"
                [size]="16"
                className="text-blue-400 animate-pulse"
              ></app-icon>
              <div class="text-sm font-mono font-semibold tracking-wide">
                {{ liveTime() }}
              </div>
              <div
                class="text-xs text-blue-300 font-sans border-l border-blue-400/30 pl-2"
              >
                {{ liveDate() }}
              </div>
            </div>

            <a
              *ngIf="isPatient()"
              routerLink="/appointments"
              class="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-xl text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <app-icon name="calendar" [size]="16"></app-icon>
              <span>Book Appointment</span>
            </a>
            <a
              *ngIf="!isPatient()"
              routerLink="/patients/new"
              class="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-xl text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <app-icon name="user-plus" [size]="16"></app-icon>
              <span>Register New Patient</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Real-time Metrics Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Metric 1: Total Patients (Staff) / My Appointments (Patient) -->
        <div
          *ngIf="isPatient()"
          (click)="navigate('/appointments')"
          class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer group"
        >
          <div class="flex justify-between items-start mb-3">
            <span
              class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
            >
              My Appointments
            </span>
            <div
              class="p-2.5 bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800 rounded-xl"
            >
              <app-icon name="calendar" [size]="20"></app-icon>
            </div>
          </div>
          <div class="text-2xl font-bold text-slate-800 dark:text-white">
            {{ isAppointmentsLoading() ? "..." : appointments().length }}
          </div>
          <div
            class="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-1 font-medium"
          >
            <app-icon name="clock" [size]="14"></app-icon>
            <span>{{ todayScheduledCount() }} scheduled for today</span>
          </div>
        </div>

        <div
          *ngIf="!isPatient()"
          (click)="navigate('/patients')"
          class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group"
        >
          <div class="flex justify-between items-start mb-3">
            <span
              class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
            >
              Total Patients
            </span>
            <div
              class="p-2.5 bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 rounded-xl"
            >
              <app-icon name="users" [size]="20"></app-icon>
            </div>
          </div>
          <div class="text-2xl font-bold text-slate-800 dark:text-white">
            {{ isPatientsLoading() ? "..." : totalPatientsCount() }}
          </div>
          <div
            class="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium"
          >
            <app-icon name="activity" [size]="14"></app-icon>
            <span>Active registered records</span>
          </div>
        </div>

        <!-- Metric 2: Today Visits (Patient) / Hospital Appointments (Staff) -->
        <div
          *ngIf="isPatient()"
          (click)="navigate('/appointments')"
          class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group"
        >
          <div class="flex justify-between items-start mb-3">
            <span
              class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
            >
              Today's Visits
            </span>
            <div
              class="p-2.5 bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 rounded-xl"
            >
              <app-icon name="clock" [size]="20"></app-icon>
            </div>
          </div>
          <div class="text-2xl font-bold text-slate-800 dark:text-white">
            {{ isAppointmentsLoading() ? "..." : todayScheduledCount() }}
          </div>
          <div
            class="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1 font-medium"
          >
            <app-icon name="activity" [size]="14"></app-icon>
            <span>Active appointments today</span>
          </div>
        </div>

        <div
          *ngIf="!isPatient()"
          (click)="navigate('/appointments')"
          class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer group"
        >
          <div class="flex justify-between items-start mb-3">
            <span
              class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
            >
              Appointments
            </span>
            <div
              class="p-2.5 bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800 rounded-xl"
            >
              <app-icon name="calendar" [size]="20"></app-icon>
            </div>
          </div>
          <div class="text-2xl font-bold text-slate-800 dark:text-white">
            {{
              isAppointmentsLoading() ? "..." : appointments().length + " Total"
            }}
          </div>
          <div
            class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1"
          >
            <app-icon name="clock" [size]="14"></app-icon>
            <span>{{ todayScheduledCount() }} pending today</span>
          </div>
        </div>

        <!-- Metric 3: Doctors On Duty -->
        <div
          (click)="
            isPatient() ? navigate('/appointments') : navigate('/doctors')
          "
          class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer group"
        >
          <div class="flex justify-between items-start mb-3">
            <span
              class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
            >
              {{ isPatient() ? "Specialists Available" : "Doctors On Duty" }}
            </span>
            <div
              class="p-2.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 rounded-xl"
            >
              <app-icon name="stethoscope" [size]="20"></app-icon>
            </div>
          </div>
          <div class="text-2xl font-bold text-slate-800 dark:text-white">
            {{ isDoctorsLoading() ? "..." : activeDoctorsCount() + " Active" }}
          </div>
          <div
            class="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium"
          >
            <app-icon name="shield-check" [size]="14"></app-icon>
            <span
              >Across
              {{ isDeptsLoading() ? "..." : departments().length }}
              Departments</span
            >
          </div>
        </div>

        <!-- Metric 4: Clinical Departments -->
        <div
          (click)="
            isPatient() ? navigate('/appointments') : navigate('/doctors')
          "
          class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group"
        >
          <div class="flex justify-between items-start mb-3">
            <span
              class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
            >
              Clinical Departments
            </span>
            <div
              class="p-2.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 rounded-xl"
            >
              <app-icon name="building-2" [size]="20"></app-icon>
            </div>
          </div>
          <div class="text-2xl font-bold text-slate-800 dark:text-white">
            {{ isDeptsLoading() ? "..." : departments().length + " Active" }}
          </div>
          <div
            class="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-1 font-medium"
          >
            <app-icon name="activity" [size]="14"></app-icon>
            <span>Specialty care & diagnostics</span>
          </div>
        </div>
      </div>

      <!-- Main Real-time Data Section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column: Patient's Appointments OR Recent Registrations -->
        <div
          class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4"
        >
          <!-- Patient View: Appointments Table -->
          <ng-container *ngIf="isPatient()">
            <div
              class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3"
            >
              <div>
                <h2 class="font-bold text-slate-900 dark:text-white text-base">
                  My Scheduled Appointments
                </h2>
                <p class="text-xs text-slate-400">
                  Your upcoming consultations and healthcare visits
                </p>
              </div>
              <a
                routerLink="/appointments"
                class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                <span>View All</span>
                <app-icon name="arrow-right" [size]="14"></app-icon>
              </a>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm table-fixed">
                <thead
                  class="bg-slate-100/80 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700"
                >
                  <tr>
                    <th class="w-[34%] py-2.5 text-left pl-3 pr-3 rounded-l-lg">
                      Doctor & Specialty
                    </th>
                    <th class="w-[26%] py-2.5 text-left px-3">Reason</th>
                    <th class="w-[22%] py-2.5 text-left px-3">Date & Time</th>
                    <th
                      class="w-[18%] py-2.5 text-right pl-3 pr-3 rounded-r-lg"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr *ngIf="isAppointmentsLoading()">
                    <td
                      colspan="4"
                      class="py-6 text-center text-xs text-slate-400"
                    >
                      Loading your appointments...
                    </td>
                  </tr>
                  <tr
                    *ngIf="
                      !isAppointmentsLoading() && appointments().length === 0
                    "
                  >
                    <td
                      colspan="4"
                      class="py-8 text-center text-xs text-slate-400"
                    >
                      No appointments booked yet. Click "Book Appointment" to
                      schedule your visit.
                    </td>
                  </tr>
                  <tr
                    *ngFor="let apt of appointments()"
                    (click)="
                      navigate(
                        '/appointments?appointmentId=' + apt.appointmentId
                      )
                    "
                    class="hover:bg-blue-50/60 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group"
                  >
                    <td
                      class="py-3.5 pl-3 pr-3 font-medium text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate"
                    >
                      <div class="font-semibold">{{ apt.doctorName }}</div>
                      <div class="text-xs text-slate-500 dark:text-slate-400">
                        {{ apt.specialization || "General Consultation" }}
                      </div>
                    </td>
                    <td
                      class="py-3.5 px-3 text-slate-600 dark:text-slate-300 truncate"
                    >
                      {{ apt.reason || "Routine Checkup" }}
                    </td>
                    <td
                      class="py-3.5 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap text-xs"
                    >
                      <div class="font-medium">
                        {{ formatDate(apt.appointmentDate) }}
                      </div>
                      <div class="text-slate-500 dark:text-slate-400 font-mono">
                        {{ formatSlot(apt.timeSlot) }}
                      </div>
                    </td>
                    <td class="py-3.5 pl-3 pr-3 text-right whitespace-nowrap">
                      <app-status-badge
                        type="appointment"
                        [status]="apt.status"
                        size="sm"
                      ></app-status-badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ng-container>

          <!-- Staff View: Recent Patients Table -->
          <ng-container *ngIf="!isPatient()">
            <div
              class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3"
            >
              <div>
                <h2 class="font-bold text-slate-900 dark:text-white text-base">
                  Recent Patient Registrations
                </h2>
                <p class="text-xs text-slate-400">
                  Latest patient records saved to database
                </p>
              </div>
              <a
                routerLink="/patients"
                class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                <span>View All</span>
                <app-icon name="arrow-right" [size]="14"></app-icon>
              </a>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm table-fixed">
                <thead
                  class="bg-slate-100/80 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700"
                >
                  <tr>
                    <th class="w-[28%] py-2.5 text-left pl-3 pr-3 rounded-l-lg">
                      MRN
                    </th>
                    <th class="w-[36%] py-2.5 text-left px-3">Patient Name</th>
                    <th class="w-[16%] py-2.5 text-left px-3">Age</th>
                    <th
                      class="w-[20%] py-2.5 text-right pl-3 pr-3 rounded-r-lg"
                    >
                      Registered
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr *ngIf="isPatientsLoading()">
                    <td
                      colspan="4"
                      class="py-6 text-center text-xs text-slate-400"
                    >
                      Loading recent records...
                    </td>
                  </tr>
                  <tr
                    *ngIf="
                      !isPatientsLoading() && recentPatients().length === 0
                    "
                  >
                    <td
                      colspan="4"
                      class="py-8 text-center text-xs text-slate-400"
                    >
                      No patients registered yet.
                    </td>
                  </tr>
                  <tr
                    *ngFor="let p of recentPatients()"
                    (click)="navigate('/patients?patientId=' + p.patientId)"
                    class="hover:bg-blue-50/60 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group"
                  >
                    <td
                      class="py-3.5 pl-3 pr-3 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:underline truncate"
                    >
                      {{ p.medicalRecordNumber }}
                    </td>
                    <td
                      class="py-3.5 px-3 font-medium text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate"
                    >
                      {{ p.fullName }}
                    </td>
                    <td
                      class="py-3.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap"
                    >
                      {{ getAge(p.dateOfBirth) }} yrs
                    </td>
                    <td
                      class="py-3.5 pl-3 pr-3 text-right text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap"
                    >
                      {{ formatDate(p.createdAt) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ng-container>
        </div>

        <!-- Right Column: Quick Operations & Upcoming Appointments -->
        <div class="space-y-6">
          <!-- Upcoming Appointments for Staff -->
          <div
            *ngIf="!isPatient()"
            class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4"
          >
            <div
              class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3"
            >
              <div>
                <h2 class="font-bold text-slate-900 dark:text-white text-base">
                  Recent Appointments
                </h2>
                <p class="text-xs text-slate-400">Scheduled patient visits</p>
              </div>
              <a
                routerLink="/appointments"
                class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                <span>View All</span>
                <app-icon name="arrow-right" [size]="14"></app-icon>
              </a>
            </div>

            <div class="space-y-3">
              <div
                *ngIf="isAppointmentsLoading()"
                class="text-xs text-slate-400 py-4 text-center"
              >
                Loading appointments...
              </div>
              <div
                *ngIf="!isAppointmentsLoading() && appointments().length === 0"
                class="text-xs text-slate-400 py-4 text-center"
              >
                No appointments booked yet.
              </div>
              <div
                *ngFor="let apt of recentAppointments()"
                (click)="
                  navigate('/appointments?appointmentId=' + apt.appointmentId)
                "
                class="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/50 dark:hover:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 flex items-center justify-between text-xs cursor-pointer transition-all shadow-2xs group"
              >
                <div>
                  <div
                    class="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                  >
                    {{ apt.patientName }}
                  </div>
                  <div
                    class="text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5"
                  >
                    <app-icon
                      name="stethoscope"
                      [size]="12"
                      className="text-indigo-500"
                    ></app-icon>
                    <span>{{ apt.doctorName }}</span>
                  </div>
                </div>
                <div class="text-right">
                  <div
                    class="font-mono font-medium text-slate-700 dark:text-slate-300"
                  >
                    {{ formatSlot(apt.timeSlot) }}
                  </div>
                  <div class="mt-0.5">
                    <app-status-badge
                      type="appointment"
                      [status]="apt.status"
                      size="sm"
                    ></app-status-badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Navigation / Operations Panel -->
          <div
            class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3"
          >
            <h2 class="font-bold text-slate-900 dark:text-white text-sm">
              {{ isPatient() ? "Quick Navigation" : "Quick Operations" }}
            </h2>
            <div class="grid grid-cols-2 gap-2">
              <ng-container *ngIf="isPatient()">
                <a
                  routerLink="/appointments"
                  class="p-3 bg-purple-100/70 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-900 dark:text-purple-200 border border-purple-200/90 dark:border-purple-800 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  <app-icon
                    name="calendar"
                    [size]="20"
                    className="text-purple-700 dark:text-purple-300"
                  ></app-icon>
                  <span>My Visits</span>
                </a>
                <a
                  routerLink="/appointments"
                  class="p-3 bg-emerald-100/70 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200/90 dark:border-emerald-800 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  <app-icon
                    name="stethoscope"
                    [size]="20"
                    className="text-emerald-700 dark:text-emerald-300"
                  ></app-icon>
                  <span>Book Visit</span>
                </a>
                <a
                  routerLink="/settings"
                  class="p-3 bg-blue-100/70 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-200 border border-blue-200/90 dark:border-blue-800 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  <app-icon
                    name="settings"
                    [size]="20"
                    className="text-blue-700 dark:text-blue-300"
                  ></app-icon>
                  <span>My Profile</span>
                </a>
                <a
                  routerLink="/patients"
                  class="p-3 bg-amber-100/70 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-200/90 dark:border-amber-800 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  <app-icon
                    name="activity"
                    [size]="20"
                    className="text-amber-700 dark:text-amber-300"
                  ></app-icon>
                  <span>Health Record</span>
                </a>
              </ng-container>

              <ng-container *ngIf="!isPatient()">
                <a
                  routerLink="/patients/new"
                  class="p-3 bg-blue-100/70 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-200 border border-blue-200/90 dark:border-blue-800 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  <app-icon
                    name="user-plus"
                    [size]="20"
                    className="text-blue-700 dark:text-blue-300"
                  ></app-icon>
                  <span>New Patient</span>
                </a>
                <a
                  routerLink="/appointments"
                  class="p-3 bg-purple-100/70 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-900 dark:text-purple-200 border border-purple-200/90 dark:border-purple-800 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  <app-icon
                    name="calendar"
                    [size]="20"
                    className="text-purple-700 dark:text-purple-300"
                  ></app-icon>
                  <span>Book Visit</span>
                </a>
                <a
                  routerLink="/doctors"
                  class="p-3 bg-emerald-100/70 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200/90 dark:border-emerald-800 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  <app-icon
                    name="stethoscope"
                    [size]="20"
                    className="text-emerald-700 dark:text-emerald-300"
                  ></app-icon>
                  <span>Doctors</span>
                </a>
                <a
                  routerLink="/patients"
                  class="p-3 bg-amber-100/70 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-200/90 dark:border-amber-800 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  <app-icon
                    name="users"
                    [size]="20"
                    className="text-amber-700 dark:text-amber-300"
                  ></app-icon>
                  <span>Patients</span>
                </a>
              </ng-container>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardPageComponent implements OnInit {
  private authService = inject(AuthService);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private appointmentService = inject(AppointmentService);
  private settingsService = inject(SettingsService);
  private router = inject(Router);

  readonly currentUser = this.authService.currentUser;
  readonly isPatient = this.authService.isPatient;

  readonly isPatientsLoading = signal(false);
  readonly isDoctorsLoading = signal(false);
  readonly isDeptsLoading = signal(false);
  readonly isAppointmentsLoading = signal(false);

  readonly totalPatientsCount = signal(0);
  readonly recentPatients = signal<PatientDto[]>([]);
  readonly doctors = signal<DoctorDto[]>([]);
  readonly departments = signal<DepartmentDto[]>([]);
  readonly appointments = signal<AppointmentDto[]>([]);

  readonly liveTime = computed(() => {
    const clock = this.settingsService.liveClock();
    const s = this.settingsService.settings();
    return formatLiveTime(clock, s.timeFormat, s.timeZone);
  });

  readonly liveDate = computed(() => {
    const clock = this.settingsService.liveClock();
    const s = this.settingsService.settings();
    return formatDateByPattern(clock, s.dateFormat, s.timeZone);
  });

  readonly activeDoctorsCount = computed(() => {
    return this.doctors().filter((d) => d.isActive !== false).length;
  });

  readonly todayScheduledCount = computed(() => {
    const today = new Date().toISOString().split("T")[0];
    return this.appointments().filter((a) => {
      const matchDate = a.appointmentDate.startsWith(today);
      const isConfirmed =
        a.status === AppointmentStatus.Confirmed ||
        a.status === AppointmentStatus.CheckedIn ||
        String(a.status) === "Confirmed" ||
        String(a.status) === "CheckedIn";
      return matchDate && isConfirmed;
    }).length;
  });

  readonly recentAppointments = computed(() => this.appointments().slice(0, 4));

  ngOnInit(): void {
    console.log(
      "[HMS Dashboard] Initializing dashboard page. Current User:",
      this.currentUser()?.username,
      "Role:",
      this.currentUser()?.roleName,
    );
    this.loadData();
  }

  loadData(): void {
    if (!this.authService.isAuthenticated()) {
      console.warn(
        "[HMS Dashboard] Aborting data load: user is not authenticated.",
      );
      return;
    }

    console.log("[HMS Dashboard] Loading dashboard metrics and data sets...");
    if (!this.isPatient()) {
      this.isPatientsLoading.set(true);
      this.patientService.getPatients("", 1, 5).subscribe({
        next: (res) => {
          console.log("[HMS Dashboard] Patients loaded count:", res.totalCount);
          this.totalPatientsCount.set(res.totalCount);
          this.recentPatients.set(res.items);
          this.isPatientsLoading.set(false);
        },
        error: (err) => {
          console.error("[HMS Dashboard] Failed to load patients:", err);
          this.isPatientsLoading.set(false);
        },
      });
    }

    this.isDoctorsLoading.set(true);
    this.doctorService.getDoctors().subscribe({
      next: (docs) => {
        console.log("[HMS Dashboard] Doctors loaded count:", docs.length);
        this.doctors.set(docs);
        this.isDoctorsLoading.set(false);
      },
      error: (err) => {
        console.error("[HMS Dashboard] Failed to load doctors:", err);
        this.isDoctorsLoading.set(false);
      },
    });

    this.isDeptsLoading.set(true);
    this.doctorService.getDepartments().subscribe({
      next: (depts) => {
        console.log("[HMS Dashboard] Departments loaded count:", depts.length);
        this.departments.set(depts);
        this.isDeptsLoading.set(false);
      },
      error: (err) => {
        console.error("[HMS Dashboard] Failed to load departments:", err);
        this.isDeptsLoading.set(false);
      },
    });

    this.isAppointmentsLoading.set(true);
    this.appointmentService.getAppointments().subscribe({
      next: (apts) => {
        console.log("[HMS Dashboard] Appointments loaded count:", apts.length);
        this.appointments.set(apts);
        this.isAppointmentsLoading.set(false);
      },
      error: (err) => {
        console.error("[HMS Dashboard] Failed to load appointments:", err);
        this.isAppointmentsLoading.set(false);
      },
    });
  }

  navigate(path: string): void {
    this.router.navigateByUrl(path);
  }

  formatRole(roleName?: string, role?: string | number): string {
    return formatRoleDisplay(roleName, role);
  }

  getAge(dob?: string): number {
    return calculateAge(dob);
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
}
