import {
  Component,
  inject,
  signal,
  HostListener,
  ElementRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { NotificationService } from "../../core/services/notification.service";
import { IconComponent } from "../../shared/components/icon/icon.component";
import { NotificationCategory } from "../../core/models/notification.models";

@Component({
  selector: "app-notification-bell",
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="relative">
      <!-- Bell Button -->
      <button
        type="button"
        (click)="toggleOpen($event)"
        [attr.aria-label]="'Notifications (' + unreadCount() + ' unread)'"
        title="View Notifications"
        class="relative flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700 cursor-pointer"
      >
        <app-icon name="bell" [size]="16"></app-icon>
        <span
          *ngIf="unreadCount() > 0"
          class="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs animate-pulse"
        >
          {{ unreadCount() > 9 ? "9+" : unreadCount() }}
        </span>
      </button>

      <!-- Dropdown Popover -->
      <div
        *ngIf="isOpen()"
        class="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between p-3.5 border-b border-slate-100 dark:border-slate-800"
        >
          <div class="flex items-center gap-2">
            <h4
              class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider"
            >
              Notifications
            </h4>
            <span
              *ngIf="unreadCount() > 0"
              class="px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold"
            >
              {{ unreadCount() }} new
            </span>
          </div>

          <div class="flex items-center gap-2">
            <button
              *ngIf="unreadCount() > 0"
              type="button"
              (click)="markAllAsRead()"
              class="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <app-icon name="check-circle" [size]="12"></app-icon>
              <span>Mark all read</span>
            </button>
            <button
              type="button"
              (click)="closeDropdown()"
              class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
            >
              <app-icon name="x" [size]="14"></app-icon>
            </button>
          </div>
        </div>

        <!-- List Body -->
        <div
          class="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60"
        >
          <div
            *ngIf="recentNotifications().length === 0"
            class="p-8 text-center text-xs text-slate-500 dark:text-slate-400"
          >
            <app-icon
              name="bell"
              [size]="24"
              className="mx-auto mb-2 text-slate-400 dark:text-slate-500"
            ></app-icon>
            <p>No new notifications</p>
          </div>

          <div
            *ngFor="let n of recentNotifications()"
            (click)="onNotificationClick(n)"
            [ngClass]="[
              'p-3.5 transition-colors cursor-pointer flex items-start gap-3 border-l-4',
              !n.isRead
                ? 'border-l-blue-600 bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-50 dark:hover:bg-blue-950/50'
                : 'border-l-slate-300 dark:border-l-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60',
            ]"
          >
            <div
              [ngClass]="[
                'p-2 rounded-xl shrink-0 mt-0.5',
                !n.isRead
                  ? n.priority === 'Urgent'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
              ]"
            >
              <app-icon
                [name]="getCategoryIcon(n.category)"
                [size]="16"
              ></app-icon>
            </div>

            <div class="flex-1 min-w-0 space-y-1">
              <div class="flex items-center justify-between gap-1 flex-wrap">
                <div class="flex items-center gap-1.5 min-w-0">
                  <p
                    [ngClass]="[
                      'text-xs truncate',
                      !n.isRead
                        ? 'font-bold text-slate-950 dark:text-white'
                        : 'font-normal text-slate-700 dark:text-slate-300',
                    ]"
                  >
                    {{ n.title }}
                  </p>
                  <span
                    [ngClass]="[
                      'px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider border',
                      !n.isRead
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border-blue-200'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200',
                    ]"
                  >
                    {{ !n.isRead ? "UNREAD" : "READ" }}
                  </span>
                </div>
                <span class="text-[10px] text-slate-400 shrink-0">
                  {{ formatTimeAgo(n.createdAt) }}
                </span>
              </div>
              <p
                [ngClass]="[
                  'text-[11px] line-clamp-2 leading-relaxed',
                  !n.isRead
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-slate-500 dark:text-slate-400',
                ]"
              >
                {{ n.message }}
              </p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 text-center"
        >
          <a
            routerLink="/notifications"
            (click)="closeDropdown()"
            class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>View all notifications</span>
            <app-icon name="arrow-right" [size]="14"></app-icon>
          </a>
        </div>
      </div>
    </div>
  `,
})
export class NotificationBellComponent {
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  readonly isOpen = signal(false);
  readonly unreadCount = this.notificationService.unreadCount;

  recentNotifications() {
    return this.notificationService.activeList().slice(0, 5);
  }

  toggleOpen(event: MouseEvent) {
    event.stopPropagation();
    this.isOpen.update((v) => !v);
  }

  closeDropdown() {
    this.isOpen.set(false);
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead();
  }

  onNotificationClick(n: any) {
    this.notificationService.markAsRead(n.id);
    if (n.actionUrl) {
      this.closeDropdown();
      this.router.navigateByUrl(n.actionUrl);
    }
  }

  getCategoryIcon(cat: NotificationCategory): string {
    switch (cat) {
      case "Staff":
        return "user-check";
      case "Appointments":
        return "calendar";
      case "Patients":
        return "users";
      case "System":
        return "shield-alert";
      case "Laboratory":
        return "activity";
      case "Pharmacy":
        return "activity";
      case "Billing":
        return "activity";
      case "Clinical":
        return "activity";
      default:
        return "bell";
    }
  }

  formatTimeAgo(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }
}
