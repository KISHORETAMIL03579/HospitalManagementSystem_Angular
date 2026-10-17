import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, ActivatedRoute, RouterModule } from "@angular/router";
import { PatientService } from "@core/services/patient.service";
import { PatientDto, Gender } from "@core/models/patient.models";
import { calculateAge, formatDate } from "@core/utils/format-utils";
import { IconComponent } from "@shared/components/icon/icon.component";
import { EmptyStateComponent } from "@shared/components/empty-state/empty-state.component";
import { BookingModalComponent } from "@features/appointments/components/booking-modal/booking-modal.component";

type SortField =
  "medicalRecordNumber" | "fullName" | "dateOfBirth" | "gender" | "createdAt";
type SortOrder = "asc" | "desc";

@Component({
  selector: "app-patient-table",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IconComponent,
    EmptyStateComponent,
    BookingModalComponent,
  ],
  template: `
    <div class="space-y-4">
      <!-- Search & Filters -->
      <div
        class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between"
      >
        <div class="relative flex-1 max-w-md">
          <app-icon
            name="search"
            [size]="16"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          ></app-icon>
          <input
            type="text"
            placeholder="Search patients by name, MRN, phone, or email..."
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearchChange()"
            class="w-full pl-10 pr-9 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <button
            *ngIf="searchTerm"
            type="button"
            (click)="searchTerm = ''; onSearchChange()"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <app-icon name="x" [size]="14"></app-icon>
          </button>
        </div>

        <div
          class="text-xs text-slate-500 dark:text-slate-400 font-medium self-end sm:self-center"
        >
          Showing {{ paginatedPatients().length }} of
          {{ sortedPatients().length }} patients
        </div>
      </div>

      <!-- Table Container -->
      <div
        class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm table-fixed">
            <thead
              class="bg-slate-100/80 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700"
            >
              <tr>
                <th
                  (click)="handleSort('medicalRecordNumber')"
                  class="w-[20%] py-3 pl-4 pr-3 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors select-none"
                >
                  <div class="flex items-center gap-1.5">
                    <span>MRN</span>
                    <app-icon
                      *ngIf="sortField() === 'medicalRecordNumber'"
                      [name]="
                        sortOrder() === 'asc' ? 'chevron-up' : 'chevron-down'
                      "
                      [size]="12"
                    ></app-icon>
                  </div>
                </th>
                <th
                  (click)="handleSort('fullName')"
                  class="w-[26%] py-3 px-3 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors select-none"
                >
                  <div class="flex items-center gap-1.5">
                    <span>Patient Name</span>
                    <app-icon
                      *ngIf="sortField() === 'fullName'"
                      [name]="
                        sortOrder() === 'asc' ? 'chevron-up' : 'chevron-down'
                      "
                      [size]="12"
                    ></app-icon>
                  </div>
                </th>
                <th
                  (click)="handleSort('gender')"
                  class="w-[14%] py-3 px-3 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors select-none"
                >
                  <div class="flex items-center gap-1.5">
                    <span>Gender</span>
                    <app-icon
                      *ngIf="sortField() === 'gender'"
                      [name]="
                        sortOrder() === 'asc' ? 'chevron-up' : 'chevron-down'
                      "
                      [size]="12"
                    ></app-icon>
                  </div>
                </th>
                <th
                  (click)="handleSort('dateOfBirth')"
                  class="w-[18%] py-3 px-3 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors select-none"
                >
                  <div class="flex items-center gap-1.5">
                    <span>Age / DOB</span>
                    <app-icon
                      *ngIf="sortField() === 'dateOfBirth'"
                      [name]="
                        sortOrder() === 'asc' ? 'chevron-up' : 'chevron-down'
                      "
                      [size]="12"
                    ></app-icon>
                  </div>
                </th>
                <th class="w-[14%] py-3 px-3">Contact</th>
                <th class="w-[8%] py-3 pr-4 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr *ngIf="isLoading()">
                <td
                  colspan="6"
                  class="py-12 text-center text-sm text-slate-400"
                >
                  Loading patient records...
                </td>
              </tr>
              <tr *ngIf="!isLoading() && paginatedPatients().length === 0">
                <td colspan="6" class="py-12 text-center">
                  <app-empty-state
                    iconName="users"
                    title="No Patients Found"
                    description="No patient records match your current search query."
                  ></app-empty-state>
                </td>
              </tr>
              <tr
                *ngFor="let p of paginatedPatients()"
                (click)="openPatientDetails(p)"
                class="hover:bg-blue-50/60 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group"
              >
                <td
                  class="py-3.5 pl-4 pr-3 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:underline truncate"
                >
                  {{ p.medicalRecordNumber }}
                </td>
                <td class="py-3.5 px-3 truncate">
                  <div
                    class="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400"
                  >
                    {{ p.fullName }}
                  </div>
                  <div
                    class="text-xs text-slate-500 dark:text-slate-400 truncate"
                  >
                    {{ p.email || "No email" }}
                  </div>
                </td>
                <td class="py-3.5 px-3 whitespace-nowrap">
                  <span [ngClass]="getGenderClass(p.gender)">
                    {{ getGenderLabel(p.gender) }}
                  </span>
                </td>
                <td class="py-3.5 px-3 whitespace-nowrap text-xs">
                  <div class="font-semibold text-slate-800 dark:text-slate-200">
                    {{ getAge(p.dateOfBirth) }} yrs
                  </div>
                  <div class="text-slate-400">
                    {{ formatDob(p.dateOfBirth) }}
                  </div>
                </td>
                <td
                  class="py-3.5 px-3 text-xs text-slate-600 dark:text-slate-300 truncate"
                >
                  {{ p.phone || "N/A" }}
                </td>
                <td
                  class="py-3.5 pr-4 pl-3 text-right whitespace-nowrap"
                  (click)="$event.stopPropagation()"
                >
                  <button
                    type="button"
                    (click)="openBookingForPatient(p)"
                    title="Book Appointment"
                    class="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <app-icon name="calendar" [size]="16"></app-icon>
                  </button>
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
              (click)="goToPage(currentPage() - 1)"
              class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <app-icon name="chevron-left" [size]="14"></app-icon>
            </button>
            <button
              type="button"
              [disabled]="currentPage() >= totalPages()"
              (click)="goToPage(currentPage() + 1)"
              class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <app-icon name="chevron-right" [size]="14"></app-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Patient Details Drawer / Modal -->
      <div
        *ngIf="selectedPatient()"
        class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      >
        <div
          class="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 overflow-hidden"
        >
          <div
            class="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-bold text-lg flex items-center justify-center"
              >
                {{ selectedPatient()?.firstName?.[0]
                }}{{ selectedPatient()?.lastName?.[0] }}
              </div>
              <div>
                <h3 class="font-bold text-slate-900 dark:text-white text-lg">
                  {{ selectedPatient()?.fullName }}
                </h3>
                <span
                  class="font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold"
                >
                  MRN: {{ selectedPatient()?.medicalRecordNumber }}
                </span>
              </div>
            </div>
            <button
              type="button"
              (click)="selectedPatient.set(null)"
              class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>

          <div class="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span class="text-slate-400 block mb-0.5">Date of Birth</span>
              <span class="font-semibold text-slate-800 dark:text-slate-200">
                {{ formatDob(selectedPatient()?.dateOfBirth) }} ({{
                  getAge(selectedPatient()?.dateOfBirth)
                }}
                yrs)
              </span>
            </div>
            <div>
              <span class="text-slate-400 block mb-0.5">Gender</span>
              <span class="font-semibold text-slate-800 dark:text-slate-200">
                {{ getGenderLabel(selectedPatient()?.gender) }}
              </span>
            </div>
            <div>
              <span class="text-slate-400 block mb-0.5">Blood Group</span>
              <span class="font-semibold text-slate-800 dark:text-slate-200">
                {{ selectedPatient()?.bloodGroup || "Not specified" }}
              </span>
            </div>
            <div>
              <span class="text-slate-400 block mb-0.5">Phone Number</span>
              <span class="font-semibold text-slate-800 dark:text-slate-200">
                {{ selectedPatient()?.phone || "N/A" }}
              </span>
            </div>
            <div class="col-span-2">
              <span class="text-slate-400 block mb-0.5">Email</span>
              <span class="font-semibold text-slate-800 dark:text-slate-200">
                {{ selectedPatient()?.email || "N/A" }}
              </span>
            </div>
            <div class="col-span-2">
              <span class="text-slate-400 block mb-0.5"
                >Residential Address</span
              >
              <span class="font-semibold text-slate-800 dark:text-slate-200">
                {{ selectedPatient()?.address || "No address registered" }}
              </span>
            </div>
            <div
              class="col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800"
            >
              <span class="text-slate-400 block mb-0.5">Emergency Contact</span>
              <span class="font-semibold text-slate-800 dark:text-slate-200">
                {{ selectedPatient()?.emergencyContactName || "N/A" }} ({{
                  selectedPatient()?.emergencyContactPhone || "N/A"
                }})
              </span>
            </div>
            <div
              *ngIf="selectedPatient()?.medicalHistory"
              class="col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800"
            >
              <span class="text-slate-400 block mb-0.5">Clinical History</span>
              <p
                class="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap"
              >
                {{ selectedPatient()?.medicalHistory }}
              </p>
            </div>
          </div>

          <div
            class="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800"
          >
            <button
              type="button"
              (click)="openBookingForPatient(selectedPatient()!)"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <app-icon name="calendar" [size]="14"></app-icon>
              <span>Book Appointment</span>
            </button>
            <button
              type="button"
              (click)="selectedPatient.set(null)"
              class="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <!-- Booking Modal for selected patient -->
      <app-booking-modal
        [isOpen]="isBookingOpen()"
        [preselectedPatientId]="bookingPatientId"
        (close)="isBookingOpen.set(false)"
      ></app-booking-modal>
    </div>
  `,
})
export class PatientTableComponent implements OnInit {
  private patientService = inject(PatientService);
  private route = inject(ActivatedRoute);

  searchTerm = "";
  readonly sortField = signal<SortField>("createdAt");
  readonly sortOrder = signal<SortOrder>("desc");
  readonly currentPage = signal(1);
  readonly pageSize = 10;

  readonly allPatients = signal<PatientDto[]>([]);
  readonly isLoading = signal(false);
  readonly selectedPatient = signal<PatientDto | null>(null);

  readonly isBookingOpen = signal(false);
  bookingPatientId?: number;

  ngOnInit(): void {
    this.fetchPatients();
    this.route.queryParams.subscribe((params) => {
      const pid = params["patientId"];
      if (pid) {
        const match = this.allPatients().find(
          (p) => String(p.patientId) === pid,
        );
        if (match) this.selectedPatient.set(match);
      }
    });
  }

  fetchPatients(): void {
    this.isLoading.set(true);
    this.patientService.getPatients(this.searchTerm, 1, 500).subscribe({
      next: (res) => {
        this.allPatients.set(res.items || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  onSearchChange(): void {
    this.currentPage.set(1);
    this.fetchPatients();
  }

  readonly sortedPatients = computed(() => {
    const list = [...this.allPatients()];
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
    Math.ceil(this.sortedPatients().length / this.pageSize),
  );

  readonly paginatedPatients = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.sortedPatients().slice(start, start + this.pageSize);
  });

  handleSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortOrder.update((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      this.sortField.set(field);
      this.sortOrder.set("asc");
    }
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) {
      this.currentPage.set(p);
    }
  }

  getAge(dob?: string): number {
    return calculateAge(dob);
  }

  formatDob(dob?: string): string {
    return formatDate(dob);
  }

  getGenderLabel(gender: Gender | number | string | undefined): string {
    if (
      gender === Gender.Male ||
      gender === 1 ||
      String(gender).toLowerCase() === "male"
    )
      return "Male";
    if (
      gender === Gender.Female ||
      gender === 2 ||
      String(gender).toLowerCase() === "female"
    )
      return "Female";
    return "Other";
  }

  getGenderClass(gender: Gender | number | string | undefined): string {
    const label = this.getGenderLabel(gender);
    if (label === "Male")
      return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800";
    if (label === "Female")
      return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800";
    return "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
  }

  openPatientDetails(p: PatientDto): void {
    this.selectedPatient.set(p);
  }

  openBookingForPatient(p: PatientDto): void {
    this.bookingPatientId = p.patientId;
    this.selectedPatient.set(null);
    this.isBookingOpen.set(true);
  }
}
