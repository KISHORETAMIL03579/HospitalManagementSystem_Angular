import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { PatientFormComponent } from "@features/patients/components/patient-form/patient-form.component";
import { IconComponent } from "@shared/components/icon/icon.component";

@Component({
  selector: "app-patient-create-page",
  standalone: true,
  imports: [CommonModule, RouterModule, PatientFormComponent, IconComponent],
  template: `
    <div class="space-y-6">
      <div>
        <a
          routerLink="/patients"
          class="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 mb-2 transition-colors cursor-pointer"
        >
          <app-icon name="arrow-left" [size]="16"></app-icon>
          <span>Back to Patient Directory</span>
        </a>
      </div>

      <app-patient-form (success)="onSuccess()"></app-patient-form>
    </div>
  `,
})
export class PatientCreatePageComponent {
  private router = inject(Router);

  onSuccess(): void {
    setTimeout(() => {
      this.router.navigate(["/patients"]);
    }, 1500);
  }
}
