import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { IconComponent } from "@shared/components/icon/icon.component";

export interface SegmentedOption<T = any> {
  label: string;
  value: T;
  icon?: string;
  badge?: number | string;
}

@Component({
  selector: "app-segmented-control",
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="tablist"
      class="inline-flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 gap-1 border border-slate-200/50 dark:border-slate-700/50"
    >
      <button
        *ngFor="let opt of options"
        type="button"
        role="tab"
        [attr.aria-selected]="selected === opt.value"
        (click)="selectOption(opt.value)"
        [class]="
          'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ' +
          (selected === opt.value
            ? activeClass
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white')
        "
      >
        <app-icon *ngIf="opt.icon" [name]="opt.icon" [size]="14"></app-icon>
        <span>{{ opt.label }}</span>
        <span
          *ngIf="opt.badge !== undefined"
          class="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
        >
          {{ opt.badge }}
        </span>
      </button>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }
    `,
  ],
})
export class SegmentedControlComponent<T = any> {
  @Input() options: SegmentedOption<T>[] = [];
  @Input() selected: T | null = null;
  @Input() activeClass =
    "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs";

  @Output() selectionChange = new EventEmitter<T>();

  selectOption(val: T): void {
    if (this.selected !== val) {
      this.selected = val;
      this.selectionChange.emit(val);
    }
  }
}
