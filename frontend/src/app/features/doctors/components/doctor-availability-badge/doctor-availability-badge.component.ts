import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IconComponent } from "@shared/components/icon/icon.component";

@Component({
  selector: "app-doctor-availability-badge",
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="inline-flex flex-col items-start gap-1">
      <span
        [class]="
          'inline-flex items-center rounded-full border shadow-xs transition-colors ' +
          badgeColor +
          ' ' +
          sizeClasses
        "
      >
        <span class="relative flex h-2 w-2">
          <span
            *ngIf="pulse"
            [class]="
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ' +
              dotColor
            "
          ></span>
          <span
            [class]="'relative inline-flex rounded-full h-2 w-2 ' + dotColor"
          ></span>
        </span>
        <app-icon [name]="iconName" [size]="14"></app-icon>
        <span>{{ label }}</span>
      </span>
      <span
        *ngIf="nextSlotText"
        class="text-[11px] text-slate-500 dark:text-slate-400 font-medium ml-1"
      >
        {{ nextSlotText }}
      </span>
    </div>
  `,
})
export class DoctorAvailabilityBadgeComponent {
  @Input() status = "";
  @Input() nextSlotText?: string;
  @Input() size: "sm" | "md" | "lg" = "md";

  get normalized(): string {
    return (this.status || "").toLowerCase();
  }

  get badgeColor(): string {
    if (this.normalized.includes("available now")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
    }
    if (this.normalized.includes("available today")) {
      return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800";
    }
    if (
      this.normalized.includes("available later") ||
      this.normalized.includes("tomorrow")
    ) {
      return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800";
    }
    if (this.normalized.includes("fully booked")) {
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
    }
    if (
      this.normalized.includes("on leave") ||
      this.normalized.includes("leave")
    ) {
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
    }
    return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }

  get dotColor(): string {
    if (this.normalized.includes("available now")) return "bg-emerald-500";
    if (this.normalized.includes("available today")) return "bg-sky-500";
    if (
      this.normalized.includes("available later") ||
      this.normalized.includes("tomorrow")
    )
      return "bg-indigo-500";
    if (this.normalized.includes("fully booked")) return "bg-amber-500";
    if (
      this.normalized.includes("on leave") ||
      this.normalized.includes("leave")
    )
      return "bg-rose-500";
    return "bg-slate-400";
  }

  get pulse(): boolean {
    return this.normalized.includes("available now");
  }

  get label(): string {
    if (this.normalized.includes("available now")) return "Available now";
    if (this.normalized.includes("available today")) return "Available today";
    if (
      this.normalized.includes("available later") ||
      this.normalized.includes("tomorrow")
    )
      return "Available later";
    if (this.normalized.includes("fully booked")) return "Fully booked";
    if (
      this.normalized.includes("on leave") ||
      this.normalized.includes("leave")
    )
      return "On leave";
    if (this.normalized.includes("inactive")) return "Inactive";
    return this.status || "Unavailable";
  }

  get iconName(): string {
    if (this.normalized.includes("available now")) return "check-circle";
    if (
      this.normalized.includes("available today") ||
      this.normalized.includes("available later")
    )
      return "clock";
    if (this.normalized.includes("fully booked")) return "alert-triangle";
    if (this.normalized.includes("on leave")) return "calendar";
    if (this.normalized.includes("inactive")) return "x-circle";
    return "clock";
  }

  get sizeClasses(): string {
    switch (this.size) {
      case "sm":
        return "px-2 py-0.5 text-xs gap-1.5";
      case "lg":
        return "px-3 py-1.5 text-sm gap-2 font-medium";
      default:
        return "px-2.5 py-1 text-xs gap-1.5 font-medium";
    }
  }
}
