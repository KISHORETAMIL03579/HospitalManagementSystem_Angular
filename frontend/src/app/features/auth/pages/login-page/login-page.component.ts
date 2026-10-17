import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LoginFormComponent } from "@features/auth/components/login-form/login-form.component";

@Component({
  selector: "app-login-page",
  standalone: true,
  imports: [CommonModule, LoginFormComponent],
  template: `
    <div
      class="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4"
    >
      <app-login-form></app-login-form>
    </div>
  `,
})
export class LoginPageComponent {}
