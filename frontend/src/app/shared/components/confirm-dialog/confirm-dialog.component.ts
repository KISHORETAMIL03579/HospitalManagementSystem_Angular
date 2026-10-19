import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { IconComponent } from "@shared/components/icon/icon.component";

export type ConfirmVariant = "danger" | "warning" | "primary" | "info";

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  iconName?: string;
}

@Component({
  selector: "app-confirm-dialog",
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div
      role="alertdialog"
      aria-modal="true"
      [attr.aria-label]="title"
      class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      (click)="onCancel()"
    >
      <div
        (click)="$event.stopPropagation()"
        class="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-150"
      >
        <div class="flex items-start gap-4">
          <div [class]="iconWrapperClasses">
            <app-icon [name]="resolvedIcon" [size]="22"></app-icon>
          </div>
          <div class="space-y-1.5 flex-1 min-w-0">
            <h3
              class="text-base font-bold text-slate-900 dark:text-white leading-snug"
            >
              {{ title }}
            </h3>
            <p
              class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line"
            >
              {{ message }}
            </p>
          </div>
        </div>

        <div
          class="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800"
        >
          <button
            type="button"
            (click)="onCancel()"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            {{ cancelText }}
          </button>
          <button
            type="button"
            (click)="onConfirm()"
            [class]="confirmButtonClasses"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  @Input() title = "Confirm Action";
  @Input() message = "Are you sure you want to proceed?";
  @Input() confirmText = "Confirm";
  @Input() cancelText = "Cancel";
  @Input() variant: ConfirmVariant = "primary";
  @Input() iconName?: string;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  @HostListener("document:keydown.escape", ["$event"])
  onEscapeKey(event: Event): void {
    event.preventDefault();
    this.onCancel();
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  get resolvedIcon(): string {
    if (this.iconName) return this.iconName;
    switch (this.variant) {
      case "danger":
        return "alert-triangle";
      case "warning":
        return "alert-circle";
      case "info":
        return "info";
      default:
        return "help-circle";
    }
  }

  get iconWrapperClasses(): string {
    const base = "p-3 rounded-2xl shrink-0";
    switch (this.variant) {
      case "danger":
        return `${base} bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400`;
      case "warning":
        return `${base} bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400`;
      case "info":
        return `${base} bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400`;
      default:
        return `${base} bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400`;
    }
  }

  get confirmButtonClasses(): string {
    const base =
      "px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition cursor-pointer";
    switch (this.variant) {
      case "danger":
        return `${base} bg-rose-600 hover:bg-rose-700 active:bg-rose-800`;
      case "warning":
        return `${base} bg-amber-600 hover:bg-amber-700 active:bg-amber-800`;
      case "info":
        return `${base} bg-sky-600 hover:bg-sky-700 active:bg-sky-800`;
      default:
        return `${base} bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800`;
    }
  }
}
