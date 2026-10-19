import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { IconComponent } from "@shared/components/icon/icon.component";

@Component({
  selector: "app-stat-card",
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      (click)="clickable ? cardClick.emit() : null"
      [class]="
        'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between transition-all ' +
        (clickable
          ? 'cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md'
          : '')
      "
    >
      <div class="min-w-0 pr-3">
        <span
          class="text-xs font-medium text-slate-500 dark:text-slate-400 block truncate"
        >
          {{ title }}
        </span>
        <p
          class="text-xl font-bold text-slate-900 dark:text-white mt-0.5 truncate"
        >
          {{ value }}
        </p>
        <p
          *ngIf="subtitle"
          class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate"
        >
          {{ subtitle }}
        </p>
      </div>

      <div
        *ngIf="icon"
        [class]="
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ' +
          iconColorClass
        "
      >
        <app-icon [name]="icon" [size]="iconSize"></app-icon>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class StatCardComponent {
  @Input() title = "";
  @Input() value: string | number = 0;
  @Input() icon?: string;
  @Input() iconSize = 20;
  @Input() iconColorClass =
    "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400";
  @Input() subtitle?: string;
  @Input() clickable = false;

  @Output() cardClick = new EventEmitter<void>();
}
