import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IconComponent } from "../icon/icon.component";

@Component({
  selector: "app-empty-state",
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      [class]="
        'flex flex-col items-center justify-center py-12 px-4 text-center ' +
        className
      "
    >
      <div
        class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3"
      >
        <app-icon [name]="iconName" [size]="24"></app-icon>
      </div>
      <h3
        class="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1"
      >
        {{ title }}
      </h3>
      <p
        *ngIf="description"
        class="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4"
      >
        {{ description }}
      </p>
      <div class="mt-2">
        <ng-content select="[action]"></ng-content>
      </div>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() iconName = "folder-open";
  @Input() title = "";
  @Input() description?: string;
  @Input() className = "";
}
