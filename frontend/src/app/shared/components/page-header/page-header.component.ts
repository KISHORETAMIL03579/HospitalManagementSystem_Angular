import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IconComponent } from "../icon/icon.component";

@Component({
  selector: "app-page-header",
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <!-- Banner Variant -->
    <div
      *ngIf="variant === 'banner'"
      [class]="
        'flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm ' +
        className
      "
    >
      <div>
        <div class="flex items-center gap-3">
          <div
            *ngIf="iconBgColor && iconName"
            [class]="'p-2 rounded-xl shrink-0 ' + iconBgColor"
          >
            <app-icon [name]="iconName" [size]="24"></app-icon>
          </div>
          <span
            *ngIf="!iconBgColor && iconName"
            class="shrink-0 text-blue-600 dark:text-blue-400"
          >
            <app-icon [name]="iconName" [size]="28"></app-icon>
          </span>
          <div>
            <div class="flex items-center gap-2">
              <h1
                class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight"
              >
                {{ title }}
              </h1>
              <ng-content select="[badge]"></ng-content>
            </div>
            <p
              *ngIf="subtitle"
              class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5"
            >
              {{ subtitle }}
            </p>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-3 self-start sm:self-auto flex-wrap">
        <ng-content select="[actions]"></ng-content>
      </div>
    </div>

    <!-- Default Variant -->
    <div
      *ngIf="variant !== 'banner'"
      [class]="
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ' +
        className
      "
    >
      <div>
        <h1
          class="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5"
        >
          <app-icon
            *ngIf="iconName"
            [name]="iconName"
            [size]="28"
            className="text-blue-600 dark:text-blue-400"
          ></app-icon>
          <span>{{ title }}</span>
          <ng-content select="[badge]"></ng-content>
        </h1>
        <p
          *ngIf="subtitle"
          class="text-slate-500 dark:text-slate-400 text-sm mt-1"
        >
          {{ subtitle }}
        </p>
      </div>
      <div class="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
        <ng-content select="[actions]"></ng-content>
      </div>
    </div>
  `,
})
export class PageHeaderComponent {
  @Input() title = "";
  @Input() subtitle?: string;
  @Input() iconName?: string;
  @Input() iconBgColor?: string;
  @Input() className = "";
  @Input() variant: "default" | "banner" = "default";
}
