import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IconComponent } from "../icon/icon.component";
import { AppointmentStatus } from "../../../core/models/appointment.models";

export type BadgeVariant =
  "appointment" | "staffApproval" | "email" | "active" | "custom";

@Component({
  selector: "app-status-badge",
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- 1. Appointment Status Badge -->
    <ng-container
      *ngIf="type === 'appointment' && status !== undefined && status !== null"
    >
      <span
        [title]="title || ''"
        [ngClass]="[
          'inline-flex items-center rounded-full font-semibold border',
          sizeClasses,
          className,
          appointmentClasses,
        ]"
      >
        <app-icon [name]="appointmentIcon" [size]="14"></app-icon>
        <span>{{ appointmentLabel }}</span>
      </span>
    </ng-container>

    <!-- 2. Staff Registration Request Status Badge -->
    <ng-container
      *ngIf="
        type === 'staffApproval' && status !== undefined && status !== null
      "
    >
      <span
        [title]="title || ''"
        [ngClass]="[
          'inline-flex items-center rounded-full font-semibold border',
          sizeClasses,
          className,
          staffApprovalClasses,
        ]"
      >
        <app-icon [name]="staffApprovalIcon" [size]="14"></app-icon>
        <span>{{ staffApprovalLabel }}</span>
      </span>
    </ng-container>

    <!-- 3. Email Delivery Status Badge -->
    <ng-container
      *ngIf="type === 'email' && status !== undefined && status !== null"
    >
      <span
        [title]="title || ''"
        [ngClass]="[
          'inline-flex items-center rounded-full font-semibold border',
          sizeClasses,
          className,
          emailClasses,
        ]"
      >
        <app-icon
          [name]="emailIcon"
          [size]="14"
          [className]="emailIconSpin ? 'animate-spin' : ''"
        ></app-icon>
        <span>{{ emailLabel }}</span>
      </span>
    </ng-container>

    <!-- 4. Active / Inactive Status Badge -->
    <ng-container *ngIf="type === 'active'">
      <span
        [title]="title || ''"
        [ngClass]="[
          'inline-flex items-center rounded-full font-semibold border',
          sizeClasses,
          className,
          isActive
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
        ]"
      >
        <span
          class="w-1.5 h-1.5 rounded-full"
          [ngClass]="isActive ? 'bg-emerald-500' : 'bg-slate-400'"
        ></span>
        <span>{{ label || (isActive ? "Active" : "Inactive") }}</span>
      </span>
    </ng-container>

    <!-- 5. Generic Custom Badge -->
    <ng-container *ngIf="type === 'custom'">
      <span
        [title]="title || ''"
        [ngClass]="[
          'inline-flex items-center rounded-full font-semibold border',
          sizeClasses,
          className,
          customColorClass,
        ]"
      >
        <span>{{ label || statusString }}</span>
      </span>
    </ng-container>
  `,
})
export class StatusBadgeComponent {
  @Input() type: BadgeVariant = "custom";
  @Input() status?: AppointmentStatus | string | number | boolean;
  @Input() label?: string;
  @Input() variantColor?:
    "success" | "warning" | "danger" | "info" | "neutral" | "purple";
  @Input() title?: string;
  @Input() size: "sm" | "md" = "md";
  @Input() className = "";

  get sizeClasses(): string {
    return this.size === "sm"
      ? "px-2 py-0.5 text-[11px] gap-1"
      : "px-2.5 py-1 text-xs gap-1.5";
  }

  get statusString(): string {
    return this.status !== undefined && this.status !== null
      ? String(this.status)
      : "";
  }

  get isActive(): boolean {
    return (
      this.status === true ||
      this.status === 1 ||
      String(this.status).toLowerCase() === "true" ||
      String(this.status).toLowerCase() === "active"
    );
  }

  get appointmentNumericValue(): number {
    if (typeof this.status === "number") return this.status;
    const s = String(this.status);
    if (s === "0" || s === "Pending") return 0;
    if (s === "10" || s === "1" || s === "Confirmed" || s === "Scheduled")
      return 10;
    if (s === "20" || s === "2" || s === "CheckedIn") return 20;
    if (s === "30" || s === "3" || s === "InConsultation") return 30;
    if (s === "40" || s === "4" || s === "Completed") return 40;
    if (s === "50" || s === "5" || s === "Cancelled") return 50;
    if (s === "60" || s === "6" || s === "NoShow") return 60;
    return 10;
  }

  get appointmentClasses(): string {
    switch (this.appointmentNumericValue) {
      case AppointmentStatus.Pending:
      case 0:
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800";
      case AppointmentStatus.Confirmed:
      case 10:
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800";
      case AppointmentStatus.CheckedIn:
      case 20:
        return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800";
      case AppointmentStatus.InConsultation:
      case 30:
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800";
      case AppointmentStatus.Completed:
      case 40:
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800";
      case AppointmentStatus.Cancelled:
      case 50:
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800";
      case AppointmentStatus.NoShow:
      case 60:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
    }
  }

  get appointmentIcon(): string {
    switch (this.appointmentNumericValue) {
      case AppointmentStatus.Pending:
      case 0:
      case AppointmentStatus.Confirmed:
      case 10:
        return "clock-3";
      case AppointmentStatus.CheckedIn:
      case 20:
        return "user-check";
      case AppointmentStatus.InConsultation:
      case 30:
        return "stethoscope";
      case AppointmentStatus.Completed:
      case 40:
        return "check-circle";
      case AppointmentStatus.Cancelled:
      case 50:
        return "x-circle";
      case AppointmentStatus.NoShow:
      case 60:
        return "alert-circle";
      default:
        return "clock";
    }
  }

  get appointmentLabel(): string {
    switch (this.appointmentNumericValue) {
      case AppointmentStatus.Pending:
      case 0:
        return "Pending";
      case AppointmentStatus.Confirmed:
      case 10:
        return "Confirmed";
      case AppointmentStatus.CheckedIn:
      case 20:
        return "Checked In";
      case AppointmentStatus.InConsultation:
      case 30:
        return "In Consultation";
      case AppointmentStatus.Completed:
      case 40:
        return "Completed";
      case AppointmentStatus.Cancelled:
      case 50:
        return "Cancelled";
      case AppointmentStatus.NoShow:
      case 60:
        return "No Show";
      default:
        return String(this.status);
    }
  }

  // Staff approval getters
  get staffApprovalClasses(): string {
    const s = String(this.status).toLowerCase();
    if (s === "pending" || s === "0") {
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800";
    }
    if (s === "approved" || s === "1") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800";
    }
    return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800";
  }

  get staffApprovalIcon(): string {
    const s = String(this.status).toLowerCase();
    if (s === "pending" || s === "0") return "clock";
    if (s === "approved" || s === "1") return "check-circle";
    return "x-circle";
  }

  get staffApprovalLabel(): string {
    const s = String(this.status).toLowerCase();
    if (s === "pending" || s === "0") return "Pending";
    if (s === "approved" || s === "1") return "Approved";
    return "Rejected";
  }

  // Email status getters
  get emailClasses(): string {
    const s = String(this.status).toLowerCase();
    if (this.status === 1 || s === "sent" || s === "delivered") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800";
    }
    if (this.status === 0 || s === "queued") {
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800";
    }
    if (this.status === 3 || s === "failed" || s === "bounced") {
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 cursor-help";
    }
    return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800";
  }

  get emailIcon(): string {
    const s = String(this.status).toLowerCase();
    if (this.status === 1 || s === "sent" || s === "delivered")
      return "mail-check";
    if (this.status === 0 || s === "queued") return "send";
    if (this.status === 3 || s === "failed" || s === "bounced")
      return "alert-triangle";
    return "refresh-cw";
  }

  get emailIconSpin(): boolean {
    const s = String(this.status).toLowerCase();
    return this.status === 5 || s === "retrying";
  }

  get emailLabel(): string {
    const s = String(this.status).toLowerCase();
    if (this.status === 1 || s === "sent" || s === "delivered") return "SENT";
    if (this.status === 0 || s === "queued") return "QUEUED";
    if (this.status === 3 || s === "failed" || s === "bounced") return "FAILED";
    if (this.status === 5 || s === "retrying") return "RETRYING";
    return String(this.status);
  }

  get customColorClass(): string {
    const colorMap: Record<string, string> = {
      success:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
      warning:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
      danger:
        "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
      info: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
      purple:
        "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
      neutral:
        "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    };
    return colorMap[this.variantColor || "neutral"] || colorMap["neutral"];
  }
}
