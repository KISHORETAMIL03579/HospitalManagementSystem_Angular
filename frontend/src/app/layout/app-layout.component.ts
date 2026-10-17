import { Component, inject, signal, computed, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule, NavigationEnd } from "@angular/router";
import { filter } from "rxjs";
import { AuthService } from "@core/services/auth.service";
import { SettingsService } from "@core/services/settings.service";
import { formatRoleDisplay } from "@core/models/auth.models";
import { IconComponent } from "@shared/components/icon/icon.component";
import { NotificationBellComponent } from "./notification-bell/notification-bell.component";

interface NavSubItem {
  label: string;
  path: string;
  icon: string;
  badge?: string;
}

interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: readonly string[];
  badge?: string;
  disabled?: boolean;
  children?: NavSubItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    path: "/",
    icon: "activity",
  },
  {
    label: "Patients",
    path: "/patients",
    icon: "users",
    roles: ["admin", "hospitalmanager", "doctor", "nurse", "receptionist"],
  },
  {
    label: "Appointments",
    path: "/appointments",
    icon: "clipboard-list",
    roles: [
      "admin",
      "hospitalmanager",
      "doctor",
      "nurse",
      "receptionist",
      "patient",
    ],
  },
  {
    label: "Calendar",
    path: "/calendar",
    icon: "calendar",
    roles: [
      "admin",
      "hospitalmanager",
      "doctor",
      "nurse",
      "receptionist",
      "patient",
    ],
  },
  {
    label: "Doctors",
    path: "/doctors",
    icon: "stethoscope",
    roles: ["admin", "hospitalmanager", "doctor", "nurse", "receptionist"],
  },
  {
    label: "Administration",
    path: "/admin",
    icon: "shield-check",
    roles: ["admin", "hospitalmanager"],
    children: [
      {
        label: "Admin Dashboard",
        path: "/admin",
        icon: "shield-check",
      },
      {
        label: "Staff Approvals",
        path: "/admin/staff-approvals",
        icon: "user-check",
      },
      {
        label: "User Management",
        path: "/admin/users",
        icon: "user-cog",
      },
    ],
  },
  {
    label: "Prescriptions",
    path: "/prescriptions",
    icon: "activity",
    badge: "Soon",
    disabled: true,
    roles: [
      "admin",
      "hospitalmanager",
      "doctor",
      "nurse",
      "pharmacist",
      "patient",
    ],
  },
  {
    label: "Laboratory",
    path: "/laboratory",
    icon: "activity",
    badge: "Soon",
    disabled: true,
    roles: ["admin", "hospitalmanager", "doctor", "labtechnician", "nurse"],
  },
  {
    label: "Billing",
    path: "/billing",
    icon: "activity",
    badge: "Soon",
    disabled: true,
    roles: ["admin", "hospitalmanager", "receptionist"],
  },
  {
    label: "Notifications",
    path: "/notifications",
    icon: "bell",
  },
  {
    label: "Settings",
    path: "/settings",
    icon: "settings",
  },
];

const ROUTE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/patients": "Patients",
  "/patients/new": "Register Patient",
  "/appointments": "Appointments",
  "/calendar": "Calendar",
  "/doctors": "Doctors",
  "/admin": "Admin Dashboard",
  "/admin/staff-approvals": "Staff Approvals",
  "/admin/users": "User Management",
  "/prescriptions": "Prescriptions",
  "/laboratory": "Laboratory",
  "/billing": "Billing",
  "/notifications": "Notifications",
  "/settings": "Settings",
};

function normalizeRole(
  role?: string | null,
  roleLevel?: number | string | null,
): string {
  const normalized = role?.trim().toLowerCase() ?? "";
  const aliases: Record<string, string> = {
    "hospital manager": "hospitalmanager",
    hospital_manager: "hospitalmanager",
    "lab technician": "labtechnician",
    labtech: "labtechnician",
    lab_technician: "labtechnician",
    "100": "admin",
    "90": "hospitalmanager",
    "80": "doctor",
    "75": "pharmacist",
    "70": "labtechnician",
    "60": "nurse",
    "40": "receptionist",
    "20": "patient",
  };

  if (aliases[normalized]) return aliases[normalized];

  const cleaned = normalized.replace(/[\s_-]/g, "");
  if (cleaned && !/^\d+$/.test(cleaned)) return cleaned;

  const levelKey = String(roleLevel ?? "")
    .trim()
    .toLowerCase();
  return aliases[levelKey] ?? cleaned;
}

@Component({
  selector: "app-layout",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IconComponent,
    NotificationBellComponent,
  ],
  template: `
    <div
      class="flex h-dvh overflow-hidden bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100"
    >
      <!-- Desktop Sidebar -->
      <aside
        class="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-white md:flex"
      >
        <!-- Logo -->
        <div
          class="flex items-center gap-3 border-b border-slate-800 px-4 py-3.5"
        >
          <div class="rounded-xl bg-blue-600 p-2 text-white">
            <app-icon name="activity" [size]="20"></app-icon>
          </div>
          <div class="min-w-0">
            <h1 class="text-base font-bold leading-tight tracking-tight">
              CareFlow HMS
            </h1>
            <p
              class="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-400"
            >
              Hospital System
            </p>
          </div>
        </div>

        <!-- Navigation -->
        <nav
          aria-label="Main navigation"
          class="cf-sidebar-scroll flex flex-1 flex-col justify-between overflow-y-auto px-3 py-2.5"
        >
          <div class="space-y-0.5">
            <ng-container *ngFor="let item of primaryNavItems()">
              <ng-container
                *ngTemplateOutlet="
                  navItemTemplate;
                  context: { item: item, isMobile: false }
                "
              ></ng-container>
            </ng-container>
          </div>

          <div
            *ngIf="bottomNavItems().length > 0"
            class="mt-2 pt-2 border-t border-slate-800/80 space-y-0.5"
          >
            <ng-container *ngFor="let item of bottomNavItems()">
              <ng-container
                *ngTemplateOutlet="
                  navItemTemplate;
                  context: { item: item, isMobile: false }
                "
              ></ng-container>
            </ng-container>
          </div>
        </nav>

        <!-- User Footer -->
        <div
          class="flex items-center gap-3 border-t border-slate-800 bg-slate-950/50 px-4 py-3"
        >
          <div
            aria-hidden="true"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/20 text-xs font-bold text-blue-300"
          >
            {{ userInitials() }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-xs font-semibold text-slate-100">
              {{ currentUser()?.fullName || "Authenticated User" }}
            </p>
            <p
              class="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400"
            >
              <app-icon
                name="shield-check"
                [size]="12"
                className="text-emerald-400"
              ></app-icon>
              <span class="truncate">
                {{ formatRole(currentUser()?.roleName, currentUser()?.role) }}
              </span>
            </p>
          </div>
          <button
            type="button"
            (click)="handleLogout()"
            aria-label="Sign out"
            title="Sign out"
            class="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer"
          >
            <app-icon name="log-out" [size]="16"></app-icon>
          </button>
        </div>
      </aside>

      <!-- Mobile Navigation Backdrop -->
      <button
        *ngIf="isMobileNavOpen()"
        type="button"
        aria-label="Close navigation menu"
        class="fixed inset-0 z-40 bg-slate-950/60 md:hidden border-0 cursor-default"
        (click)="closeMobileNav()"
      ></button>

      <!-- Mobile Sidebar -->
      <aside
        id="mobile-navigation"
        aria-label="Mobile sidebar"
        [class]="
          'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-slate-900 text-white shadow-xl transition-transform duration-200 md:hidden ' +
          (isMobileNavOpen() ? 'translate-x-0' : '-translate-x-full')
        "
      >
        <div
          class="flex items-center justify-between border-b border-slate-800 p-5"
        >
          <div class="flex items-center gap-3">
            <div class="rounded-xl bg-blue-600 p-2">
              <app-icon name="activity" [size]="24"></app-icon>
            </div>
            <div>
              <h2 class="text-base font-bold">CareFlow HMS</h2>
              <p
                class="mt-1 text-[10px] font-semibold uppercase tracking-wider text-blue-400"
              >
                Hospital System
              </p>
            </div>
          </div>
          <button
            type="button"
            (click)="closeMobileNav()"
            aria-label="Close navigation menu"
            class="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer"
          >
            <app-icon name="x" [size]="20"></app-icon>
          </button>
        </div>

        <nav
          aria-label="Mobile navigation"
          class="cf-sidebar-scroll flex flex-1 flex-col justify-between overflow-y-auto px-3 py-2.5"
        >
          <div class="space-y-0.5">
            <ng-container *ngFor="let item of primaryNavItems()">
              <ng-container
                *ngTemplateOutlet="
                  navItemTemplate;
                  context: { item: item, isMobile: true }
                "
              ></ng-container>
            </ng-container>
          </div>

          <div
            *ngIf="bottomNavItems().length > 0"
            class="mt-2 pt-2 border-t border-slate-800/80 space-y-0.5"
          >
            <ng-container *ngFor="let item of bottomNavItems()">
              <ng-container
                *ngTemplateOutlet="
                  navItemTemplate;
                  context: { item: item, isMobile: true }
                "
              ></ng-container>
            </ng-container>
          </div>
        </nav>

        <div
          class="flex items-center gap-3 border-t border-slate-800 bg-slate-950/50 px-4 py-3"
        >
          <div
            aria-hidden="true"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/20 text-xs font-bold text-blue-300"
          >
            {{ userInitials() }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-xs font-semibold text-slate-100">
              {{ currentUser()?.fullName || "Authenticated User" }}
            </p>
            <p
              class="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400"
            >
              <app-icon
                name="shield-check"
                [size]="12"
                className="text-emerald-400"
              ></app-icon>
              <span class="truncate">
                {{ formatRole(currentUser()?.roleName, currentUser()?.role) }}
              </span>
            </p>
          </div>
          <button
            type="button"
            (click)="handleLogout()"
            aria-label="Sign out"
            title="Sign out"
            class="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer"
          >
            <app-icon name="log-out" [size]="16"></app-icon>
          </button>
        </div>
      </aside>

      <!-- Main App Content -->
      <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
        <!-- Header -->
        <header
          class="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6"
        >
          <div class="flex min-w-0 items-center gap-3">
            <button
              type="button"
              (click)="isMobileNavOpen.set(true)"
              aria-label="Open navigation menu"
              class="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden cursor-pointer"
            >
              <app-icon name="menu" [size]="20"></app-icon>
            </button>

            <div class="min-w-0">
              <div
                class="flex items-center gap-2 text-xs text-slate-500 sm:text-sm"
              >
                <span
                  class="hidden font-semibold text-slate-700 dark:text-slate-200 sm:inline"
                >
                  CareFlow HMS
                </span>
                <span aria-hidden="true" class="hidden sm:inline">/</span>
                <span class="truncate">{{ pageTitle() }}</span>
              </div>
              <h2
                class="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-white sm:text-base"
              >
                {{ pageTitle() }}
              </h2>
            </div>
          </div>

          <div class="flex shrink-0 items-center gap-2.5 sm:gap-3">
            <!-- Notifications Bell -->
            <app-notification-bell></app-notification-bell>

            <!-- Theme Toggle Button -->
            <button
              type="button"
              (click)="toggleTheme()"
              [title]="
                isDark() ? 'Switch to light mode' : 'Switch to dark mode'
              "
              class="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-white cursor-pointer"
            >
              <ng-container *ngIf="isDark()">
                <app-icon
                  name="sun"
                  [size]="16"
                  className="text-amber-400"
                ></app-icon>
                <span class="hidden sm:inline">Light</span>
              </ng-container>
              <ng-container *ngIf="!isDark()">
                <app-icon
                  name="moon"
                  [size]="16"
                  className="text-indigo-600 dark:text-indigo-400"
                ></app-icon>
                <span class="hidden sm:inline">Dark</span>
              </ng-container>
            </button>
          </div>
        </header>

        <!-- Main View Outlet -->
        <main
          id="main-content"
          class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6"
        >
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>

    <!-- Nav Item Template -->
    <ng-template #navItemTemplate let-item="item" let-isMobile="isMobile">
      <!-- Item with sub-items (Administration) -->
      <div
        *ngIf="item.children && item.children.length > 0"
        class="space-y-0.5"
      >
        <button
          type="button"
          (click)="isAdminDropdownOpen.set(!isAdminDropdownOpen())"
          [attr.aria-expanded]="isAdminDropdownOpen()"
          class="w-full h-10 flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left cursor-pointer"
          [ngClass]="
            isAdminActive()
              ? 'bg-slate-800/90 text-white font-semibold'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          "
        >
          <span class="flex min-w-0 items-center gap-3">
            <app-icon
              [name]="item.icon"
              [size]="18"
              [className]="isAdminActive() ? 'text-blue-400' : 'text-slate-400'"
            ></app-icon>
            <span class="truncate">{{ item.label }}</span>
          </span>

          <span class="flex items-center gap-1.5 shrink-0 text-slate-400">
            <span
              *ngIf="item.badge"
              class="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-400"
            >
              {{ item.badge }}
            </span>
            <app-icon
              [name]="isAdminDropdownOpen() ? 'chevron-down' : 'chevron-right'"
              [size]="16"
            ></app-icon>
          </span>
        </button>

        <div
          *ngIf="isAdminDropdownOpen()"
          class="ml-5 pl-3 border-l border-slate-700/80 space-y-0.5 py-0.5 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <a
            *ngFor="let sub of item.children"
            [routerLink]="sub.path"
            (click)="closeMobileNav()"
            class="h-9 flex items-center justify-between gap-2.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
            [ngClass]="
              isSubActive(sub.path)
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            "
          >
            <span class="flex min-w-0 items-center gap-2.5">
              <app-icon
                [name]="sub.icon"
                [size]="16"
                [className]="
                  isSubActive(sub.path) ? 'text-white' : 'text-slate-400'
                "
              ></app-icon>
              <span class="truncate">{{ sub.label }}</span>
            </span>
            <span
              *ngIf="sub.badge"
              class="shrink-0 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-400"
            >
              {{ sub.badge }}
            </span>
          </a>
        </div>
      </div>

      <!-- Item Disabled / Coming soon -->
      <div
        *ngIf="!item.children && (item.disabled || item.badge === 'Soon')"
        role="link"
        aria-disabled="true"
        title="Coming soon"
        class="h-10 flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 opacity-60 cursor-not-allowed select-none"
      >
        <span class="flex min-w-0 items-center gap-3">
          <app-icon
            [name]="item.icon"
            [size]="18"
            className="text-slate-500"
          ></app-icon>
          <span class="truncate">{{ item.label }}</span>
        </span>
        <span
          *ngIf="item.badge"
          class="shrink-0 rounded-md border border-slate-700/80 bg-slate-800/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400"
        >
          {{ item.badge }}
        </span>
      </div>

      <!-- Normal Route Item -->
      <a
        *ngIf="!item.children && !item.disabled && item.badge !== 'Soon'"
        [routerLink]="item.path"
        (click)="closeMobileNav()"
        class="h-10 flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer"
        [ngClass]="
          isRouteActive(item.path)
            ? 'bg-blue-600 text-white shadow-sm font-semibold'
            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
        "
      >
        <span class="flex min-w-0 items-center gap-3">
          <app-icon
            [name]="item.icon"
            [size]="18"
            [className]="
              isRouteActive(item.path) ? 'text-white' : 'text-slate-400'
            "
          ></app-icon>
          <span class="truncate">{{ item.label }}</span>
        </span>
        <span
          *ngIf="item.badge"
          class="shrink-0 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-400"
        >
          {{ item.badge }}
        </span>
      </a>
    </ng-template>
  `,
})
export class AppLayoutComponent {
  private authService = inject(AuthService);
  private settingsService = inject(SettingsService);
  private router = inject(Router);

  readonly currentUser = this.authService.currentUser;
  readonly currentUrl = signal(this.router.url);
  readonly isMobileNavOpen = signal(false);
  readonly isAdminDropdownOpen = signal(this.router.url.startsWith("/admin"));
  readonly isDark = signal(false);

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.currentUrl.set(e.urlAfterRedirects || e.url);
        if (this.currentUrl().startsWith("/admin")) {
          this.isAdminDropdownOpen.set(true);
        }
      });

    effect(() => {
      this.settingsService.settings();
      if (typeof document !== "undefined") {
        this.isDark.set(document.documentElement.classList.contains("dark"));
      }
    });
  }

  readonly userRole = computed(() => {
    const user = this.currentUser();
    return normalizeRole(user?.roleName, user?.role);
  });

  readonly visibleNavItems = computed(() => {
    const role = this.userRole();
    return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
  });

  readonly primaryNavItems = computed(() =>
    this.visibleNavItems().filter((item) => item.path !== "/settings"),
  );

  readonly bottomNavItems = computed(() =>
    this.visibleNavItems().filter((item) => item.path === "/settings"),
  );

  readonly pageTitle = computed(() => {
    const url = this.currentUrl().split("?")[0];
    if (ROUTE_LABELS[url]) return ROUTE_LABELS[url];
    const matching = NAV_ITEMS.filter((i) => i.path !== "/")
      .sort((a, b) => b.path.length - a.path.length)
      .find((i) => url === i.path || url.startsWith(`${i.path}/`));
    if (matching) return matching.label;
    const segment = url.split("/").filter(Boolean).pop();
    if (!segment) return "Dashboard";
    return segment
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  });

  readonly userInitials = computed(() => {
    const name = this.currentUser()?.fullName;
    if (!name?.trim()) return "US";
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  });

  formatRole(roleName?: string, role?: string | number): string {
    return formatRoleDisplay(roleName, role);
  }

  isRouteActive(path: string): boolean {
    const current = this.currentUrl().split("?")[0];
    if (path === "/") return current === "/";
    return current === path || current.startsWith(`${path}/`);
  }

  isAdminActive(): boolean {
    return this.currentUrl().startsWith("/admin");
  }

  isSubActive(subPath: string): boolean {
    const current = this.currentUrl().split("?")[0];
    if (subPath === "/admin") return current === "/admin";
    return current === subPath || current.startsWith(`${subPath}/`);
  }

  closeMobileNav(): void {
    this.isMobileNavOpen.set(false);
  }

  handleLogout(): void {
    this.closeMobileNav();
    this.authService.logout();
  }

  toggleTheme(): void {
    const newTheme = this.isDark() ? "light" : "dark";
    this.settingsService.updateSetting("themeMode", newTheme);
    this.isDark.set(newTheme === "dark");
  }
}
