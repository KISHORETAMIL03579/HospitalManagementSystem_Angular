import { Component, Output, EventEmitter, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { PatientService } from "@core/services/patient.service";
import {
  Gender,
  BloodGroup,
  CreatePatientRequest,
} from "@core/models/patient.models";
import { IconComponent } from "@shared/components/icon/icon.component";
import { PhoneNumberInputComponent } from "@shared/components/phone-input/phone-input.component";

@Component({
  selector: "app-patient-form",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    PhoneNumberInputComponent,
  ],
  template: `
    <div
      class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 max-w-3xl mx-auto"
    >
      <div
        class="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6"
      >
        <div
          class="bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 p-2.5 rounded-lg"
        >
          <app-icon name="user-plus" [size]="24"></app-icon>
        </div>
        <div>
          <h2 class="text-xl font-bold text-slate-800 dark:text-white">
            Register New Patient
          </h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Enter patient demographics and emergency contact details
          </p>
        </div>
      </div>

      <div
        *ngIf="isSuccess()"
        class="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-sm"
      >
        <app-icon
          name="check-circle"
          [size]="20"
          className="text-emerald-600"
        ></app-icon>
        <span
          >Patient registered successfully with a new Medical Record Number
          (MRN)!</span
        >
      </div>

      <div
        *ngIf="errorMessage()"
        class="mb-6 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-3 text-rose-800 dark:text-rose-300 text-sm"
      >
        <app-icon
          name="alert-circle"
          [size]="20"
          className="text-rose-600"
        ></app-icon>
        <span>{{ errorMessage() }}</span>
      </div>

      <form (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- Personal Demographics -->
        <div>
          <h3
            class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4"
          >
            Personal Demographics
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                First Name
                <span class="text-rose-500 font-bold ml-0.5" aria-hidden="true"
                  >*</span
                >
              </label>
              <input
                type="text"
                required
                placeholder="e.g. John"
                [(ngModel)]="formData.firstName"
                name="firstName"
                class="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Last Name
                <span class="text-rose-500 font-bold ml-0.5" aria-hidden="true"
                  >*</span
                >
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Doe"
                [(ngModel)]="formData.lastName"
                name="lastName"
                class="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Date of Birth
                <span class="text-rose-500 font-bold ml-0.5" aria-hidden="true"
                  >*</span
                >
              </label>
              <input
                type="date"
                required
                [(ngModel)]="formData.dateOfBirth"
                name="dateOfBirth"
                class="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Gender
                <span class="text-rose-500 font-bold ml-0.5" aria-hidden="true"
                  >*</span
                >
              </label>
              <select
                [(ngModel)]="formData.gender"
                name="gender"
                class="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option [ngValue]="Gender.Male">Male</option>
                <option [ngValue]="Gender.Female">Female</option>
                <option [ngValue]="Gender.Other">Other</option>
              </select>
            </div>

            <div>
              <label
                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Blood Group
              </label>
              <select
                [(ngModel)]="formData.bloodGroup"
                name="bloodGroup"
                class="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option [ngValue]="BloodGroup.Unknown">Unknown</option>
                <option [ngValue]="BloodGroup.APositive">A+</option>
                <option [ngValue]="BloodGroup.ANegative">A-</option>
                <option [ngValue]="BloodGroup.BPositive">B+</option>
                <option [ngValue]="BloodGroup.BNegative">B-</option>
                <option [ngValue]="BloodGroup.OPositive">O+</option>
                <option [ngValue]="BloodGroup.ONegative">O-</option>
                <option [ngValue]="BloodGroup.ABPositive">AB+</option>
                <option [ngValue]="BloodGroup.ABNegative">AB-</option>
              </select>
            </div>

            <div>
              <app-phone-number-input
                label="Phone Number"
                [(ngModel)]="formData.phone"
                name="phone"
              ></app-phone-number-input>
            </div>

            <div class="md:col-span-2">
              <label
                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                placeholder="john.doe@example.com"
                [(ngModel)]="formData.email"
                name="email"
                class="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div class="md:col-span-2">
              <label
                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Residential Address
              </label>
              <input
                type="text"
                placeholder="123 Healthcare Blvd, Medical City"
                [(ngModel)]="formData.address"
                name="address"
                class="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <!-- Emergency Contact Section -->
        <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3
            class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4"
          >
            Emergency Contact Information
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Emergency Contact Name
              </label>
              <input
                type="text"
                placeholder="e.g. Jane Doe (Spouse)"
                [(ngModel)]="formData.emergencyContactName"
                name="emergencyContactName"
                class="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <app-phone-number-input
                label="Emergency Contact Phone"
                [(ngModel)]="formData.emergencyContactPhone"
                name="emergencyContactPhone"
              ></app-phone-number-input>
            </div>
          </div>
        </div>

        <!-- Medical History & Clinical Notes -->
        <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3
            class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4"
          >
            Clinical History & Known Conditions
          </h3>
          <textarea
            rows="3"
            placeholder="Chronic conditions, allergies, or past medical notes..."
            [(ngModel)]="formData.medicalHistory"
            name="medicalHistory"
            class="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          ></textarea>
        </div>

        <div
          class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800"
        >
          <button
            type="submit"
            [disabled]="isPending()"
            class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <app-icon name="user-plus" [size]="16"></app-icon>
            <span>{{
              isPending() ? "Registering Patient..." : "Register Patient"
            }}</span>
          </button>
        </div>
      </form>
    </div>
  `,
})
export class PatientFormComponent {
  private patientService = inject(PatientService);

  @Output() success = new EventEmitter<void>();

  readonly Gender = Gender;
  readonly BloodGroup = BloodGroup;

  formData: CreatePatientRequest = {
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: Gender.Male,
    bloodGroup: BloodGroup.Unknown,
    phone: "",
    email: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    medicalHistory: "",
  };

  readonly isPending = signal(false);
  readonly isSuccess = signal(false);
  readonly errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (
      !this.formData.firstName ||
      !this.formData.lastName ||
      !this.formData.dateOfBirth
    ) {
      this.errorMessage.set("Please fill out all required fields.");
      return;
    }

    this.isPending.set(true);
    this.errorMessage.set(null);

    this.patientService.createPatient(this.formData).subscribe({
      next: () => {
        this.isPending.set(false);
        this.isSuccess.set(true);
        this.success.emit();
      },
      error: (err) => {
        this.isPending.set(false);
        this.errorMessage.set(
          err?.error?.message ||
            "Registration failed. Please check the information provided and try again.",
        );
      },
    });
  }
}
