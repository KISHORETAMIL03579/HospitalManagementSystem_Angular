import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { AuthService } from "@core/services/auth.service";
import { PatientService } from "@core/services/patient.service";
import { PatientDto, Gender } from "@core/models/patient.models";
import { calculateAge, formatDate } from "@core/utils/format-utils";
import { PageHeaderComponent } from "@shared/components/page-header/page-header.component";
import { PatientTableComponent } from "@features/patients/components/patient-table/patient-table.component";
import { IconComponent } from "@shared/components/icon/icon.component";

@Component({
  selector: "app-patient-list-page",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageHeaderComponent,
    PatientTableComponent,
    IconComponent,
  ],
  template: `
    <div class="space-y-6">
      <app-page-header
        [title]="isPatient() ? 'My Health Profile' : 'Patient Directory'"
        [subtitle]="
          isPatient()
            ? 'View your personal hospital registration, health record, and emergency details.'
            : 'Manage and view all registered hospital patients'
        "
        [iconName]="isPatient() ? 'user-check' : 'users'"
      >
        <div actions>
          <a
            *ngIf="!isPatient()"
            routerLink="/patients/new"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <app-icon name="user-plus" [size]="16"></app-icon>
            <span>Register Patient</span>
          </a>
          <a
            *ngIf="isPatient()"
            routerLink="/appointments"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <app-icon name="calendar" [size]="16"></app-icon>
            <span>Book Appointment</span>
          </a>
        </div>
      </app-page-header>

      <!-- Patient View: Personal Health Profile -->
      <ng-container *ngIf="isPatient()">
        <div class="space-y-6">
          <div
            *ngIf="isProfileLoading()"
            class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500 animate-pulse"
          >
            Loading your personal health profile...
          </div>

          <div
            *ngIf="!isProfileLoading() && !myProfile()"
            class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center"
          >
            <app-icon
              name="alert-triangle"
              [size]="48"
              className="text-amber-500 mx-auto mb-3"
            ></app-icon>
            <h3
              class="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1"
            >
              Patient Record Not Linked
            </h3>
            <p
              class="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto"
            >
              Your login account is active, but a clinical patient profile has
              not yet been connected. Please consult hospital reception to link
              your MRN.
            </p>
          </div>

          <div
            *ngIf="!isProfileLoading() && myProfile()"
            class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
          >
            <!-- Profile Card Header -->
            <div
              class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-4"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-2xl text-white shadow-inner"
                >
                  {{ myProfile()?.firstName?.[0]
                  }}{{ myProfile()?.lastName?.[0] }}
                </div>
                <div>
                  <h2 class="text-xl font-bold">{{ myProfile()?.fullName }}</h2>
                  <div
                    class="flex items-center gap-2 mt-1 text-blue-100 text-xs"
                  >
                    <span
                      class="font-mono bg-white/20 px-2 py-0.5 rounded font-semibold"
                    >
                      MRN: {{ myProfile()?.medicalRecordNumber }}
                    </span>
                    <span>•</span>
                    <span>
                      {{ getAge(myProfile()?.dateOfBirth) }} years old ({{
                        getGenderText(myProfile()?.gender)
                      }})
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <span
                  class="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-100 border border-emerald-300/30"
                >
                  Active Patient
                </span>
              </div>
            </div>

            <!-- Patient Details Grid -->
            <div
              class="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <!-- Demographic & Vitals -->
              <div class="space-y-4">
                <h3
                  class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
                >
                  Demographic Details
                </h3>
                <div class="space-y-3 text-sm">
                  <div
                    class="flex items-center gap-2.5 text-slate-700 dark:text-slate-300"
                  >
                    <app-icon
                      name="calendar"
                      [size]="16"
                      className="text-blue-500 shrink-0"
                    ></app-icon>
                    <span>
                      <strong class="font-medium text-slate-900 dark:text-white"
                        >Date of Birth:</strong
                      >
                      {{ formatDob(myProfile()?.dateOfBirth) }}
                    </span>
                  </div>
                  <div
                    class="flex items-center gap-2.5 text-slate-700 dark:text-slate-300"
                  >
                    <app-icon
                      name="activity"
                      [size]="16"
                      className="text-rose-500 shrink-0"
                    ></app-icon>
                    <span>
                      <strong class="font-medium text-slate-900 dark:text-white"
                        >Blood Group:</strong
                      >
                      {{ myProfile()?.bloodGroup || "Not specified" }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Contact Information -->
              <div class="space-y-4">
                <h3
                  class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
                >
                  Contact Information
                </h3>
                <div class="space-y-3 text-sm">
                  <div
                    class="flex items-center gap-2.5 text-slate-700 dark:text-slate-300"
                  >
                    <app-icon
                      name="phone"
                      [size]="16"
                      className="text-emerald-500 shrink-0"
                    ></app-icon>
                    <span>{{ myProfile()?.phone || "No phone provided" }}</span>
                  </div>
                  <div
                    class="flex items-center gap-2.5 text-slate-700 dark:text-slate-300"
                  >
                    <app-icon
                      name="mail"
                      [size]="16"
                      className="text-blue-500 shrink-0"
                    ></app-icon>
                    <span>{{ myProfile()?.email || "No email provided" }}</span>
                  </div>
                  <div
                    class="flex items-center gap-2.5 text-slate-700 dark:text-slate-300"
                  >
                    <app-icon
                      name="map-pin"
                      [size]="16"
                      className="text-indigo-500 shrink-0"
                    ></app-icon>
                    <span>{{
                      myProfile()?.address || "No address on file"
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Emergency Contact -->
              <div class="space-y-4">
                <h3
                  class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
                >
                  Emergency Contact
                </h3>
                <div
                  class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-sm"
                >
                  <div class="font-semibold text-slate-800 dark:text-slate-200">
                    {{ myProfile()?.emergencyContactName || "Not assigned" }}
                  </div>
                  <div
                    class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5"
                  >
                    <app-icon
                      name="phone"
                      [size]="14"
                      className="text-slate-400"
                    ></app-icon>
                    <span>{{
                      myProfile()?.emergencyContactPhone || "N/A"
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Medical History Section -->
            <div
              *ngIf="myProfile()?.medicalHistory"
              class="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800"
            >
              <h3
                class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2"
              >
                Medical History & Notes
              </h3>
              <div
                class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap"
              >
                {{ myProfile()?.medicalHistory }}
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- Staff View: Patient Table -->
      <ng-container *ngIf="!isPatient()">
        <app-patient-table></app-patient-table>
      </ng-container>
    </div>
  `,
})
export class PatientListPageComponent implements OnInit {
  private authService = inject(AuthService);
  private patientService = inject(PatientService);

  readonly isPatient = this.authService.isPatient;
  readonly isProfileLoading = signal(false);
  readonly myProfile = signal<PatientDto | null>(null);

  ngOnInit(): void {
    if (this.isPatient()) {
      this.isProfileLoading.set(true);
      this.patientService.getMyPatientProfile().subscribe({
        next: (profile: PatientDto) => {
          this.myProfile.set(profile);
          this.isProfileLoading.set(false);
        },
        error: () => this.isProfileLoading.set(false),
      });
    }
  }

  getAge(dob?: string): number {
    return calculateAge(dob);
  }

  formatDob(dob?: string): string {
    return formatDate(dob);
  }

  getGenderText(gender: Gender | number | undefined): string {
    if (gender === Gender.Male || gender === 1) return "Male";
    if (gender === Gender.Female || gender === 2) return "Female";
    return "Other";
  }
}
