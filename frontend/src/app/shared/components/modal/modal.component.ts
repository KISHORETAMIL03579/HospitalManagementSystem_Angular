import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { IconComponent } from "@shared/components/icon/icon.component";

export type ModalSize =
  "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full";

@Component({
  selector: "app-modal",
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      *ngIf="isOpen"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="title || 'Modal dialog'"
      class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      (click)="onBackdropClick()"
    >
      <div (click)="$event.stopPropagation()" [class]="containerClasses">
        <!-- Modal Header -->
        <div
          *ngIf="showHeader"
          class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 shrink-0"
        >
          <div class="flex items-center gap-3 min-w-0 pr-2">
            <div *ngIf="icon" [class]="iconWrapperClasses">
              <app-icon [name]="icon" [size]="iconSize"></app-icon>
            </div>
            <div class="min-w-0">
              <h3
                *ngIf="title"
                class="font-bold text-slate-900 dark:text-white text-base truncate"
              >
                {{ title }}
              </h3>
              <p
                *ngIf="subtitle"
                class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2"
              >
                {{ subtitle }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <!-- Optional Header Actions Slot -->
            <ng-content select="[header-actions]"></ng-content>

            <!-- Close Button -->
            <button
              *ngIf="showCloseButton"
              type="button"
              (click)="onClose()"
              aria-label="Close modal"
              title="Close modal"
              class="cf-modal-close-btn"
            >
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>
        </div>

        <!-- Custom Header Projection (if full header override is desired) -->
        <ng-content select="[custom-header]"></ng-content>

        <!-- Modal Body Content -->
        <div [class]="resolvedBodyClasses">
          <ng-content></ng-content>
        </div>

        <!-- Modal Footer Slot (optional) -->
        <div
          *ngIf="hasFooterSlot"
          class="border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-end gap-3 shrink-0"
        >
          <ng-content select="[footer]"></ng-content>
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
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() iconSize = 20;
  @Input() iconColorClass =
    "p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl";
  @Input() size: ModalSize = "lg";
  @Input() closeOnBackdrop = true;
  @Input() showCloseButton = true;
  @Input() showHeader = true;
  @Input() hasFooterSlot = false;
  @Input() bodyClass = "p-6 space-y-5 overflow-y-auto max-h-[82vh]";

  @Output() close = new EventEmitter<void>();

  @HostListener("document:keydown.escape", ["$event"])
  onEscapeKey(event: Event): void {
    if (this.isOpen) {
      event.preventDefault();
      this.onClose();
    }
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop) {
      this.onClose();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  get containerClasses(): string {
    const sizeMap: Record<ModalSize, string> = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      "2xl": "max-w-2xl",
      "3xl": "max-w-3xl",
      "4xl": "max-w-4xl",
      full: "max-w-6xl",
    };

    const width = sizeMap[this.size] || "max-w-lg";
    return `bg-white dark:bg-slate-900 rounded-3xl ${width} w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden max-h-[92vh]`;
  }

  get iconWrapperClasses(): string {
    return this.iconColorClass;
  }

  get resolvedBodyClasses(): string {
    return this.bodyClass;
  }
}
