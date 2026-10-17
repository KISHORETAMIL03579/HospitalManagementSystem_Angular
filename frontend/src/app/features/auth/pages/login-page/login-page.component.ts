import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { AuthService } from "@core/services/auth.service";
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
export class LoginPageComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    if (this.authService.isAuthenticated() && this.authService.currentUser()) {
      console.log(
        "[HMS LoginPage] User already has a valid active session, navigating to '/'",
      );
      this.router.navigateByUrl("/");
    }
  }
}
