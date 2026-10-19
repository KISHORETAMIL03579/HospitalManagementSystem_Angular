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
  selector: "app-pagination",
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400"
    >
      <div class="flex items-center gap-2">
        <span class="font-medium">
          Page {{ currentPage }} of {{ safeTotalPages }}
        </span>
        <span
          *ngIf="totalItems !== undefined"
          class="text-slate-400 dark:text-slate-500"
        >
          • {{ totalItems }} {{ itemName }}
        </span>
      </div>

      <div class="flex items-center gap-1.5">
        <button
          type="button"
          [disabled]="currentPage <= 1"
          (click)="onPageChange(currentPage - 1)"
          aria-label="Previous page"
          title="Previous page"
          class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
        >
          <app-icon name="chevron-left" [size]="14"></app-icon>
        </button>

        <button
          type="button"
          [disabled]="currentPage >= safeTotalPages"
          (click)="onPageChange(currentPage + 1)"
          aria-label="Next page"
          title="Next page"
          class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
        >
          <app-icon name="chevron-right" [size]="14"></app-icon>
        </button>
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
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems?: number;
  @Input() itemName = "items";

  @Output() pageChange = new EventEmitter<number>();

  get safeTotalPages(): number {
    return Math.max(1, this.totalPages || 1);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.safeTotalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
}
