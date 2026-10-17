import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-icon",
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      [class]="className"
      [ngSwitch]="name"
    >
      <!-- Activity -->
      <ng-container *ngSwitchCase="'activity'">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </ng-container>

      <!-- Calendar -->
      <ng-container *ngSwitchCase="'calendar'">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </ng-container>

      <!-- Users -->
      <ng-container *ngSwitchCase="'users'">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </ng-container>

      <!-- User -->
      <ng-container *ngSwitchCase="'user'">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </ng-container>

      <!-- UserCheck -->
      <ng-container *ngSwitchCase="'user-check'">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <polyline points="16 11 18 13 22 9" />
      </ng-container>

      <!-- UserPlus -->
      <ng-container *ngSwitchCase="'user-plus'">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </ng-container>

      <!-- UserX -->
      <ng-container *ngSwitchCase="'user-x'">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="17" y1="8" x2="22" y2="13" />
        <line x1="22" y1="8" x2="17" y2="13" />
      </ng-container>

      <!-- UserCog -->
      <ng-container *ngSwitchCase="'user-cog'">
        <circle cx="18" cy="15" r="3" />
        <circle cx="9" cy="7" r="4" />
        <path d="M10 15H6a4 4 0 0 0-4 4v2" />
        <path d="m21.7 16.4-.9-.3" />
        <path d="m15.2 13.9-.9-.3" />
        <path d="m16.6 18.7.3-.9" />
        <path d="m19.1 12.2.3-.9" />
        <path d="m19.6 18.7-.4-.9" />
        <path d="m16.8 12.2-.4-.9" />
        <path d="m14.3 16.6.9-.4" />
        <path d="m20.8 13.8.9-.4" />
      </ng-container>

      <!-- ShieldCheck -->
      <ng-container *ngSwitchCase="'shield-check'">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="m9 12 2 2 4-4" />
      </ng-container>

      <!-- ShieldAlert -->
      <ng-container *ngSwitchCase="'shield-alert'">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </ng-container>

      <!-- Shield -->
      <ng-container *ngSwitchCase="'shield'">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      </ng-container>

      <!-- Stethoscope -->
      <ng-container *ngSwitchCase="'stethoscope'">
        <path
          d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"
        />
        <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
        <circle cx="20" cy="10" r="2" />
      </ng-container>

      <!-- Clock / Clock3 -->
      <ng-container *ngSwitchCase="'clock'">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </ng-container>
      <ng-container *ngSwitchCase="'clock-3'">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16.5 12" />
      </ng-container>

      <!-- Check -->
      <ng-container *ngSwitchCase="'check'">
        <polyline points="20 6 9 17 4 12" />
      </ng-container>

      <!-- CheckCircle / CheckCircle2 -->
      <ng-container *ngSwitchCase="'check-circle'">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </ng-container>

      <!-- X -->
      <ng-container *ngSwitchCase="'x'">
        <line
          x1="18"
          y1="6"
          x2="6"
          y2="18"
          stroke-width="2.5"
          stroke-linecap="round"
        />
        <line
          x1="6"
          y1="6"
          x2="18"
          y2="18"
          stroke-width="2.5"
          stroke-linecap="round"
        />
      </ng-container>

      <!-- XCircle -->
      <ng-container *ngSwitchCase="'x-circle'">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </ng-container>

      <!-- AlertCircle -->
      <ng-container *ngSwitchCase="'alert-circle'">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </ng-container>

      <!-- AlertTriangle -->
      <ng-container *ngSwitchCase="'alert-triangle'">
        <path
          d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
        />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </ng-container>

      <!-- Bell -->
      <ng-container *ngSwitchCase="'bell'">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </ng-container>

      <!-- Search -->
      <ng-container *ngSwitchCase="'search'">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </ng-container>

      <!-- Plus -->
      <ng-container *ngSwitchCase="'plus'">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </ng-container>

      <!-- Minus -->
      <ng-container *ngSwitchCase="'minus'">
        <line x1="5" y1="12" x2="19" y2="12" />
      </ng-container>

      <!-- Filter -->
      <ng-container *ngSwitchCase="'filter'">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </ng-container>

      <!-- ChevronDown -->
      <ng-container *ngSwitchCase="'chevron-down'">
        <polyline points="6 9 12 15 18 9" />
      </ng-container>

      <!-- ChevronUp -->
      <ng-container *ngSwitchCase="'chevron-up'">
        <polyline points="18 15 12 9 6 15" />
      </ng-container>

      <!-- ChevronLeft -->
      <ng-container *ngSwitchCase="'chevron-left'">
        <polyline points="15 18 9 12 15 6" />
      </ng-container>

      <!-- ChevronRight -->
      <ng-container *ngSwitchCase="'chevron-right'">
        <polyline points="9 18 15 12 9 6" />
      </ng-container>

      <!-- ChevronsLeft -->
      <ng-container *ngSwitchCase="'chevrons-left'">
        <polyline points="11 17 6 12 11 7" />
        <polyline points="18 17 13 12 18 7" />
      </ng-container>

      <!-- ChevronsRight -->
      <ng-container *ngSwitchCase="'chevrons-right'">
        <polyline points="13 17 18 12 13 7" />
        <polyline points="6 17 11 12 6 7" />
      </ng-container>

      <!-- Sun -->
      <ng-container *ngSwitchCase="'sun'">
        <circle cx="12" cy="12" r="4" />
        <path
          d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
        />
      </ng-container>

      <!-- Moon -->
      <ng-container *ngSwitchCase="'moon'">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </ng-container>

      <!-- Monitor -->
      <ng-container *ngSwitchCase="'monitor'">
        <rect width="20" height="14" x="2" y="3" rx="2" />
        <line x1="8" x2="16" y1="21" y2="21" />
        <line x1="12" x2="12" y1="17" y2="21" />
      </ng-container>

      <!-- LogOut -->
      <ng-container *ngSwitchCase="'log-out'">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </ng-container>

      <!-- Settings -->
      <ng-container *ngSwitchCase="'settings'">
        <circle cx="12" cy="12" r="3" />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        />
      </ng-container>

      <!-- Key -->
      <ng-container *ngSwitchCase="'key'">
        <circle cx="7.5" cy="15.5" r="5.5" />
        <path d="m21 2-9.6 9.6" />
        <path d="m15.5 7.5 3 3L22 7l-3-3" />
      </ng-container>

      <!-- Lock -->
      <ng-container *ngSwitchCase="'lock'">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </ng-container>

      <!-- Eye -->
      <ng-container *ngSwitchCase="'eye'">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </ng-container>

      <!-- EyeOff -->
      <ng-container *ngSwitchCase="'eye-off'">
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path
          d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
        />
        <path
          d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"
        />
        <line x1="2" y1="2" x2="22" y2="22" />
      </ng-container>

      <!-- Mail / MailCheck / MailOpen -->
      <ng-container *ngSwitchCase="'mail'">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </ng-container>
      <ng-container *ngSwitchCase="'mail-check'">
        <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h9" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        <path d="m16 19 2 2 4-4" />
      </ng-container>
      <ng-container *ngSwitchCase="'mail-open'">
        <path
          d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z"
        />
        <path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10" />
      </ng-container>
      <ng-container *ngSwitchCase="'check-check'">
        <path d="M18 6 7 17l-5-5" />
        <path d="m22 10-7.5 7.5L13 16" />
      </ng-container>

      <!-- Send -->
      <ng-container *ngSwitchCase="'send'">
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </ng-container>

      <!-- RefreshCw -->
      <ng-container *ngSwitchCase="'refresh-cw'">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M8 16H3v5" />
      </ng-container>

      <!-- FolderOpen -->
      <ng-container *ngSwitchCase="'folder-open'">
        <path
          d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"
        />
      </ng-container>

      <!-- Phone -->
      <ng-container *ngSwitchCase="'phone'">
        <path
          d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        />
      </ng-container>

      <!-- Building2 / Hospital -->
      <ng-container *ngSwitchCase="'building-2'">
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
        <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
        <path d="M10 6h4" />
        <path d="M10 10h4" />
        <path d="M10 14h4" />
        <path d="M10 18h4" />
      </ng-container>

      <!-- Menu -->
      <ng-container *ngSwitchCase="'menu'">
        <line x1="4" x2="20" y1="12" y2="12" />
        <line x1="4" x2="20" y1="6" y2="6" />
        <line x1="4" x2="20" y1="18" y2="18" />
      </ng-container>

      <!-- ArrowLeft -->
      <ng-container *ngSwitchCase="'arrow-left'">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </ng-container>

      <!-- ArrowRight -->
      <ng-container *ngSwitchCase="'arrow-right'">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </ng-container>

      <!-- Trash2 -->
      <ng-container *ngSwitchCase="'trash-2'">
        <path d="3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        <line x1="10" x2="10" y1="11" y2="17" />
        <line x1="14" x2="14" y1="11" y2="17" />
      </ng-container>

      <!-- Edit -->
      <ng-container *ngSwitchCase="'edit'">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </ng-container>

      <!-- Download -->
      <ng-container *ngSwitchCase="'download'">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" x2="12" y1="15" y2="3" />
      </ng-container>

      <!-- Upload -->
      <ng-container *ngSwitchCase="'upload'">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" x2="12" y1="3" y2="15" />
      </ng-container>

      <!-- HelpCircle / Info -->
      <ng-container *ngSwitchCase="'info'">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </ng-container>

      <!-- MapPin -->
      <ng-container *ngSwitchCase="'map-pin'">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </ng-container>

      <!-- ClipboardList -->
      <ng-container *ngSwitchCase="'clipboard-list'">
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
        <path
          d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
        />
        <path d="M12 11h4" />
        <path d="M12 16h4" />
        <path d="M8 11h.01" />
        <path d="M8 16h.01" />
      </ng-container>

      <!-- Default circle -->
      <ng-container *ngSwitchDefault>
        <circle cx="12" cy="12" r="9" />
      </ng-container>
    </svg>
  `,
})
export class IconComponent {
  @Input() name: string | undefined = "activity";
  @Input() size = 16;
  @Input() className = "";
}
