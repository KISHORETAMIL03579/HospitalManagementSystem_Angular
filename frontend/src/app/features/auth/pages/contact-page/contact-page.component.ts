import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IconComponent } from "@shared/components/icon/icon.component";

@Component({
  selector: "app-contact-page",
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div
      class="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4"
    >
      <div
        class="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        <!-- Banner -->
        <div
          class="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-8 py-7 text-white"
        >
          <div class="flex items-center gap-2 mb-2">
            <app-icon
              name="stethoscope"
              [size]="20"
              className="text-blue-400"
            ></app-icon>
            <span
              class="text-xs uppercase tracking-wider font-semibold text-blue-200"
            >
              CareFlow HMS Support Desk
            </span>
          </div>
          <h1 class="text-xl font-bold flex items-center gap-2">
            <app-icon
              name="info"
              [size]="20"
              className="text-indigo-400"
            ></app-icon>
            <span>Hospital Administration & IT Helpdesk</span>
          </h1>
          <p class="text-xs text-blue-200 mt-1">
            Assistance for staff registration, clinical credentials, and account
            statuses.
          </p>
        </div>

        <!-- Support Details -->
        <div class="p-8 space-y-6">
          <div class="space-y-4">
            <div
              class="flex items-start gap-3.5 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl"
            >
              <app-icon
                name="mail"
                [size]="20"
                className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
              ></app-icon>
              <div>
                <p
                  class="text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  Email Support
                </p>
                <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  General Administration:
                  <a
                    href="mailto:support@careflow.com"
                    class="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                  >
                    support@careflow.com
                  </a>
                </p>
                <p class="text-xs text-slate-600 dark:text-slate-400">
                  IT / Security Officer:
                  <a
                    href="mailto:security@careflow.com"
                    class="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                  >
                    security@careflow.com
                  </a>
                </p>
              </div>
            </div>

            <div
              class="flex items-start gap-3.5 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl"
            >
              <app-icon
                name="phone"
                [size]="20"
                className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
              ></app-icon>
              <div>
                <p
                  class="text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  Phone Helpdesk
                </p>
                <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Clinical IT Support: +1 (800) 555-CARE (ext 204)
                </p>
                <p class="text-xs text-slate-600 dark:text-slate-400">
                  Hospital Administration: +1 (800) 555-0199
                </p>
              </div>
            </div>

            <div
              class="flex items-start gap-3.5 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl"
            >
              <app-icon
                name="clock"
                [size]="20"
                className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
              ></app-icon>
              <div>
                <p
                  class="text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  Operating Hours
                </p>
                <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Staff Onboarding Desk: Mon - Fri, 8:00 AM - 6:00 PM EST
                </p>
                <p class="text-xs text-slate-600 dark:text-slate-400">
                  Clinical Emergency IT: 24/7 Priority Hotline
                </p>
              </div>
            </div>

            <div
              class="flex items-start gap-3.5 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl"
            >
              <app-icon
                name="building-2"
                [size]="20"
                className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
              ></app-icon>
              <div>
                <p
                  class="text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  Physical Office
                </p>
                <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  CareFlow Medical Center · Administration Building, 3rd Floor,
                  Wing B
                </p>
              </div>
            </div>
          </div>

          <a
            routerLink="/login"
            class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <app-icon name="arrow-left" [size]="16"></app-icon>
            <span>Return to Sign In</span>
          </a>
        </div>
      </div>
    </div>
  `,
})
export class ContactPageComponent {}
