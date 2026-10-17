import { Injectable, inject, signal, computed, effect } from "@angular/core";
import { AuthService } from "./auth.service";
import {
  NotificationItem,
  NotificationPreferences,
} from "../models/notification.models";

const DEFAULT_PREFERENCES: NotificationPreferences = {
  emailAlerts: true,
  inAppAlerts: true,
  soundEnabled: false,
  categories: {
    Staff: true,
    Appointments: true,
    Patients: true,
    System: true,
    Laboratory: true,
    Pharmacy: true,
    Billing: true,
    Clinical: true,
  },
};

const getInitialNotificationsForRole = (
  roleName: string,
  _userName?: string,
): NotificationItem[] => {
  const role = roleName.toLowerCase().replace(/[\s_-]/g, "");

  const allMockNotifications: NotificationItem[] = [
    {
      id: "notif-1",
      recipientRoles: ["admin", "hospitalmanager"],
      title: "New staff approval request",
      message:
        "Priya Sharma submitted an onboarding request for Receptionist role. Action required.",
      category: "Staff",
      priority: "High",
      relatedEntityType: "StaffRequest",
      relatedEntityId: 3,
      actionUrl: "/admin/staff-approvals",
      actionLabel: "Review Application",
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      isRead: false,
      isArchived: false,
    },
    {
      id: "notif-2",
      recipientRoles: [
        "doctor",
        "nurse",
        "receptionist",
        "admin",
        "hospitalmanager",
      ],
      title: "Appointment rescheduled",
      message:
        "Patient Emma Watson rescheduled consultation with Dr. Eleanor Vance to tomorrow at 10:30 AM.",
      category: "Appointments",
      priority: "Normal",
      relatedEntityType: "Appointment",
      relatedEntityId: 102,
      actionUrl: "/appointments",
      actionLabel: "View Schedule",
      createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      isRead: false,
      isArchived: false,
    },
    {
      id: "notif-3",
      recipientRoles: ["admin", "hospitalmanager"],
      title: "Email delivery notice",
      message:
        "Registration dispatch to priya@example.com was re-sent and recorded successfully via Mailpit.",
      category: "System",
      priority: "Urgent",
      relatedEntityType: "EmailLog",
      relatedEntityId: "mailpit",
      actionUrl: "/admin/staff-approvals",
      actionLabel: "Inspect Delivery",
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      isRead: false,
      isArchived: false,
    },
    {
      id: "notif-4",
      recipientRoles: ["receptionist", "nurse", "admin", "hospitalmanager"],
      title: "Patient registration completed",
      message:
        "New patient Sarah Connor (MRN-2026-004) intake form completed and admitted for triage.",
      category: "Patients",
      priority: "Normal",
      relatedEntityType: "Patient",
      relatedEntityId: 4,
      actionUrl: "/patients",
      actionLabel: "Open EMR Record",
      createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      isRead: false,
      isArchived: false,
    },
    {
      id: "notif-5",
      recipientRoles: ["doctor", "clinical", "hospitalmanager"],
      title: "Urgent Lab Result Available",
      message:
        "Stat cardiac enzyme panel completed for patient Robert Downey (MRN-2026-003). Elevated troponin flagged.",
      category: "Laboratory",
      priority: "Urgent",
      relatedEntityType: "LabOrder",
      relatedEntityId: 88,
      actionUrl: "/patients",
      actionLabel: "Review Lab Panel",
      createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
      isRead: true,
      isArchived: false,
    },
    {
      id: "notif-6",
      recipientRoles: ["admin", "hospitalmanager"],
      title: "Staff Account Approved",
      message:
        "Dr. Sarah Jenkins account credentials activated with role Doctor under Cardiology.",
      category: "Staff",
      priority: "Normal",
      relatedEntityType: "StaffRequest",
      relatedEntityId: 6,
      actionUrl: "/admin/users",
      actionLabel: "Manage User",
      createdAt: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
      isRead: true,
      isArchived: false,
    },
    {
      id: "notif-7",
      recipientRoles: ["pharmacist", "nurse", "admin", "hospitalmanager"],
      title: "Pharmacy low-stock alert",
      message:
        "Inventory threshold reached: Amoxicillin 500mg capsules below minimum 50 unit reserve.",
      category: "Pharmacy",
      priority: "High",
      actionUrl: "/",
      actionLabel: "Inspect Stock",
      createdAt: new Date(Date.now() - 480 * 60 * 1000).toISOString(),
      isRead: true,
      isArchived: false,
    },
    {
      id: "notif-8",
      recipientRoles: ["receptionist", "hospitalmanager", "admin"],
      title: "Billing invoice finalized",
      message:
        "Outpatient consultation invoice #INV-8902 generated for patient John Smith.",
      category: "Billing",
      priority: "Low",
      actionUrl: "/appointments",
      actionLabel: "View Receipt",
      createdAt: new Date(Date.now() - 720 * 60 * 1000).toISOString(),
      isRead: true,
      isArchived: false,
    },
    {
      id: "notif-9",
      recipientRoles: ["admin", "hospitalmanager"],
      title: "Daily Audit & Backup Completed",
      message:
        "Clinical EMR database encrypted snapshot persisted successfully. ABDM compliance verified.",
      category: "System",
      priority: "Low",
      actionUrl: "/settings",
      actionLabel: "View Security Logs",
      createdAt: new Date(Date.now() - 1440 * 60 * 1000).toISOString(),
      isRead: true,
      isArchived: false,
    },
    {
      id: "notif-10",
      recipientRoles: ["patient"],
      title: "Appointment Confirmed",
      message:
        "Your appointment with Dr. Eleanor Vance on Cardiology is confirmed for tomorrow at 10:00 AM.",
      category: "Appointments",
      priority: "High",
      relatedEntityType: "Appointment",
      actionUrl: "/appointments",
      actionLabel: "My Appointments",
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      isRead: false,
      isArchived: false,
    },
  ];

  return allMockNotifications.filter((n) => {
    if (!n.recipientRoles || n.recipientRoles.length === 0) return true;
    return (
      n.recipientRoles.includes(role) ||
      (role === "admin" && !n.recipientRoles.includes("patient"))
    );
  });
};

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private authService = inject(AuthService);

  readonly notifications = signal<NotificationItem[]>([]);
  readonly preferences = signal<NotificationPreferences>(DEFAULT_PREFERENCES);

  readonly activeList = computed(() => {
    return this.notifications().filter((n) => !n.isArchived);
  });

  readonly archivedList = computed(() => {
    return this.notifications().filter((n) => n.isArchived);
  });

  readonly unreadCount = computed(() => {
    return this.activeList().filter((n) => !n.isRead).length;
  });

  readonly urgentCount = computed(() => {
    return this.activeList().filter((n) => !n.isRead && n.priority === "Urgent")
      .length;
  });

  private get storageKey(): string {
    const user = this.authService.currentUser();
    return `careflow_notifications_${user?.userId || user?.username || "default"}`;
  }

  private get prefsKey(): string {
    const user = this.authService.currentUser();
    return `careflow_notif_prefs_${user?.userId || user?.username || "default"}`;
  }

  constructor() {
    this.initNotifications();

    effect(() => {
      // Whenever user changes, re-initialize
      this.authService.currentUser();
      this.initNotifications();
    });
  }

  private initNotifications(): void {
    if (typeof localStorage === "undefined") return;

    try {
      const cached = localStorage.getItem(this.storageKey);
      if (cached) {
        this.notifications.set(JSON.parse(cached));
      } else {
        const user = this.authService.currentUser();
        const role = user?.roleName || user?.role || "Admin";
        this.notifications.set(
          getInitialNotificationsForRole(
            String(role),
            user?.fullName || "Staff",
          ),
        );
      }

      const cachedPrefs = localStorage.getItem(this.prefsKey);
      if (cachedPrefs) {
        this.preferences.set(JSON.parse(cachedPrefs));
      } else {
        this.preferences.set(DEFAULT_PREFERENCES);
      }
    } catch (e) {
      console.error("Failed to init notifications:", e);
    }
  }

  private persist(): void {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(this.notifications()),
      );
      localStorage.setItem(this.prefsKey, JSON.stringify(this.preferences()));
    } catch (e) {
      console.error("Failed to persist notifications:", e);
    }
  }

  markAsRead(id: string): void {
    this.notifications.update((list) =>
      list.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    this.persist();
  }

  markAsUnread(id: string): void {
    this.notifications.update((list) =>
      list.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
    );
    this.persist();
  }

  markAllAsRead(): void {
    this.notifications.update((list) =>
      list.map((n) => ({ ...n, isRead: true })),
    );
    this.persist();
  }

  archiveNotification(id: string): void {
    this.notifications.update((list) =>
      list.map((n) => (n.id === id ? { ...n, isArchived: true } : n)),
    );
    this.persist();
  }

  unarchiveNotification(id: string): void {
    this.notifications.update((list) =>
      list.map((n) => (n.id === id ? { ...n, isArchived: false } : n)),
    );
    this.persist();
  }

  deleteNotification(id: string): void {
    this.notifications.update((list) => list.filter((n) => n.id !== id));
    this.persist();
  }

  clearAllRead(): void {
    this.notifications.update((list) => list.filter((n) => !n.isRead));
    this.persist();
  }

  updatePreferences(newPrefs: Partial<NotificationPreferences>): void {
    this.preferences.update((prev) => ({ ...prev, ...newPrefs }));
    this.persist();
  }
}
