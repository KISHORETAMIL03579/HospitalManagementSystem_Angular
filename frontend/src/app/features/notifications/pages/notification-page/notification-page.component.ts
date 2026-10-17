import { Component, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { NotificationService } from "@core/services/notification.service";
import {
  NotificationCategory,
  NotificationPriority,
  NotificationItem,
} from "@core/models/notification.models";
import { PageHeaderComponent } from "@shared/components/page-header/page-header.component";
import { EmptyStateComponent } from "@shared/components/empty-state/empty-state.component";
import { IconComponent } from "@shared/components/icon/icon.component";

@Component({
  selector: "app-notification-page",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    EmptyStateComponent,
    IconComponent,
  ],
  template: `
    <div class="space-y-6">
      <app-page-header
        title="Notifications & Alerts"
        subtitle="Stay updated with real-time clinic updates, appointments, and system alerts."
        iconName="bell"
      >
        <div actions>
          <button
            *ngIf="unreadCount() > 0"
            type="button"
            (click)="markAllAsRead()"
            class="px-3.5 py-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 hover:bg-blue-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <app-icon name="check-circle" [size]="14"></app-icon>
            <span>Mark All as Read</span>
          </button>
        </div>
      </app-page-header>

      <!-- Tabs Strip -->
      <div
        class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between"
      >
        <div
          class="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold overflow-x-auto"
        >
          <button
            type="button"
            (click)="activeTab.set('all')"
            [class]="
              'px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ' +
              (activeTab() === 'all'
                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white')
            "
          >
            All ({{ activeList().length }})
          </button>
          <button
            type="button"
            (click)="activeTab.set('unread')"
            [class]="
              'px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ' +
              (activeTab() === 'unread'
                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white')
            "
          >
            Unread ({{ unreadCount() }})
          </button>
          <button
            type="button"
            (click)="activeTab.set('urgent')"
            [class]="
              'px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ' +
              (activeTab() === 'urgent'
                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white')
            "
          >
            Urgent ({{ urgentCount() }})
          </button>
          <button
            type="button"
            (click)="activeTab.set('archived')"
            [class]="
              'px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ' +
              (activeTab() === 'archived'
                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white')
            "
          >
            Archived ({{ archivedList().length }})
          </button>
        </div>

        <!-- Search Bar -->
        <div class="relative max-w-xs w-full">
          <app-icon
            name="search"
            [size]="14"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          ></app-icon>
          <input
            type="text"
            placeholder="Search notifications..."
            [(ngModel)]="searchQuery"
            class="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <!-- Notification Items List -->
      <div
        class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800"
      >
        <div
          *ngIf="displayedNotifications().length === 0"
          class="py-12 text-center"
        >
          <app-empty-state
            iconName="bell"
            title="No Notifications"
            description="You are completely caught up!"
          ></app-empty-state>
        </div>

        <div
          *ngFor="let item of displayedNotifications()"
          (click)="onNotificationClick(item)"
          [class]="
            'p-4 transition-colors flex items-start gap-4 cursor-pointer ' +
            (!item.isRead
              ? 'bg-blue-50/40 dark:bg-blue-950/20'
              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50')
          "
        >
          <!-- Category Icon -->
          <div
            [class]="
              'p-2.5 rounded-xl shrink-0 mt-0.5 ' +
              getCategoryColor(item.category)
            "
          >
            <app-icon
              [name]="getCategoryIcon(item.category)"
              [size]="18"
            ></app-icon>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0 space-y-1">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-2 min-w-0">
                <h4
                  [class]="
                    'text-sm truncate ' +
                    (!item.isRead
                      ? 'font-bold text-slate-900 dark:text-white'
                      : 'font-semibold text-slate-700 dark:text-slate-300')
                  "
                >
                  {{ item.title }}
                </h4>
                <span
                  [class]="
                    'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ' +
                    getPriorityBadge(item.priority)
                  "
                >
                  {{ item.priority }}
                </span>
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  {{ item.category }}
                </span>
              </div>
              <span class="text-xs text-slate-400 whitespace-nowrap">
                {{ formatTimeAgo(item.createdAt) }}
              </span>
            </div>

            <p
              class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed"
            >
              {{ item.message }}
            </p>
          </div>

          <!-- Actions -->
          <div
            class="flex items-center gap-1 shrink-0 self-center"
            (click)="$event.stopPropagation()"
          >
            <button
              type="button"
              (click)="toggleRead(item)"
              [title]="item.isRead ? 'Mark as Unread' : 'Mark as Read'"
              class="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <app-icon
                [name]="item.isRead ? 'clock' : 'check'"
                [size]="14"
              ></app-icon>
            </button>
            <button
              *ngIf="!item.isArchived"
              type="button"
              (click)="archive(item.id)"
              title="Archive"
              class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <app-icon name="download" [size]="14"></app-icon>
            </button>
            <button
              *ngIf="item.isArchived"
              type="button"
              (click)="unarchive(item.id)"
              title="Unarchive"
              class="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <app-icon name="upload" [size]="14"></app-icon>
            </button>
            <button
              type="button"
              (click)="delete(item.id)"
              title="Delete"
              class="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <app-icon name="trash-2" [size]="14"></app-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class NotificationPageComponent {
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  readonly activeList = this.notificationService.activeList;
  readonly archivedList = this.notificationService.archivedList;
  readonly unreadCount = this.notificationService.unreadCount;
  readonly urgentCount = this.notificationService.urgentCount;

  readonly activeTab = signal<"all" | "unread" | "urgent" | "archived">("all");
  searchQuery = "";

  readonly displayedNotifications = computed(() => {
    let list: NotificationItem[] = [];
    const tab = this.activeTab();
    const q = this.searchQuery.toLowerCase().trim();

    if (tab === "archived") {
      list = this.archivedList();
    } else if (tab === "unread") {
      list = this.activeList().filter((n) => !n.isRead);
    } else if (tab === "urgent") {
      list = this.activeList().filter((n) => n.priority === "Urgent");
    } else {
      list = this.activeList();
    }

    if (q) {
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          n.category.toLowerCase().includes(q),
      );
    }

    return list;
  });

  getCategoryIcon(category: NotificationCategory): string {
    switch (category) {
      case "Staff":
        return "user-check";
      case "Appointments":
        return "calendar";
      case "Patients":
        return "users";
      case "System":
        return "shield-alert";
      default:
        return "bell";
    }
  }

  getCategoryColor(category: NotificationCategory): string {
    switch (category) {
      case "Staff":
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300";
      case "Appointments":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300";
      case "Patients":
        return "bg-teal-100 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300";
      case "System":
        return "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  }

  getPriorityBadge(p: NotificationPriority): string {
    switch (p) {
      case "Urgent":
        return "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300";
      case "High":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300";
      case "Normal":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300";
      default:
        return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
    }
  }

  formatTimeAgo(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    return `${days} d ago`;
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  toggleRead(item: NotificationItem): void {
    if (item.isRead) this.notificationService.markAsUnread(item.id);
    else this.notificationService.markAsRead(item.id);
  }

  archive(id: string): void {
    this.notificationService.archiveNotification(id);
  }

  unarchive(id: string): void {
    this.notificationService.unarchiveNotification(id);
  }

  delete(id: string): void {
    this.notificationService.deleteNotification(id);
  }

  onNotificationClick(item: NotificationItem): void {
    if (!item.isRead) {
      this.notificationService.markAsRead(item.id);
    }
    if (item.actionUrl) {
      this.router.navigateByUrl(item.actionUrl);
    }
  }
}
