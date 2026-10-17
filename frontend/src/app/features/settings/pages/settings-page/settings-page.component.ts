import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AuthService } from "@core/services/auth.service";
import { SettingsService } from "@core/services/settings.service";
import { formatRoleDisplay } from "@core/models/auth.models";
import {
  getAllAvailableTimezones,
  getStandardDateFormats,
  TimezoneOption,
  DateFormatOption,
} from "@core/utils/date-utils";
import { PageHeaderComponent } from "@shared/components/page-header/page-header.component";
import { PhoneNumberInputComponent } from "@shared/components/phone-input/phone-input.component";
import { IconComponent } from "@shared/components/icon/icon.component";

type SettingsTab =
  | "profile"
  | "appearance"
  | "regional"
  | "notifications"
  | "security"
  | "preferences"
  | "about";

@Component({
  selector: "app-settings-page",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    PhoneNumberInputComponent,
    IconComponent,
  ],
  template: `
    <div class="space-y-6">
      <app-page-header
        title="Settings & System Preferences"
        subtitle="Configure your user profile, visual theme, regional formats, and account security."
        iconName="settings"
      ></app-page-header>

      <!-- Feedback Banner -->
      <div
        *ngIf="successMessage()"
        class="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300"
      >
        <span>{{ successMessage() }}</span>
        <button
          type="button"
          (click)="successMessage.set(null)"
          class="cursor-pointer"
        >
          &times;
        </button>
      </div>

      <div
        *ngIf="errorMessage()"
        class="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center justify-between text-xs font-semibold text-rose-800 dark:text-rose-300"
      >
        <span>{{ errorMessage() }}</span>
        <button
          type="button"
          (click)="errorMessage.set(null)"
          class="cursor-pointer"
        >
          &times;
        </button>
      </div>

      <!-- Settings Layout -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <!-- Sidebar Navigation -->
        <div
          class="md:col-span-4 lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-3 space-y-1"
        >
          <button
            type="button"
            (click)="activeTab.set('profile')"
            [class]="
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ' +
              (activeTab() === 'profile'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800')
            "
          >
            <app-icon name="user" [size]="16"></app-icon>
            <span>My Profile</span>
          </button>

          <button
            type="button"
            (click)="activeTab.set('appearance')"
            [class]="
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ' +
              (activeTab() === 'appearance'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800')
            "
          >
            <app-icon name="sun" [size]="16"></app-icon>
            <span>Appearance & Theme</span>
          </button>

          <button
            type="button"
            (click)="activeTab.set('regional')"
            [class]="
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ' +
              (activeTab() === 'regional'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800')
            "
          >
            <app-icon name="clock" [size]="16"></app-icon>
            <span>Regional & Time Formats</span>
          </button>

          <button
            type="button"
            (click)="activeTab.set('notifications')"
            [class]="
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ' +
              (activeTab() === 'notifications'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800')
            "
          >
            <app-icon name="bell" [size]="16"></app-icon>
            <span>Alert Preferences</span>
          </button>

          <button
            type="button"
            (click)="activeTab.set('security')"
            [class]="
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ' +
              (activeTab() === 'security'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800')
            "
          >
            <app-icon name="lock" [size]="16"></app-icon>
            <span>Security & Password</span>
          </button>

          <button
            type="button"
            (click)="activeTab.set('about')"
            [class]="
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ' +
              (activeTab() === 'about'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800')
            "
          >
            <app-icon name="info" [size]="16"></app-icon>
            <span>About CareFlow HMS</span>
          </button>
        </div>

        <!-- Content Area -->
        <div
          class="md:col-span-8 lg:col-span-9 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8"
        >
          <!-- TAB 1: Profile -->
          <div *ngIf="activeTab() === 'profile'" class="space-y-6">
            <div class="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 class="text-base font-bold text-slate-800 dark:text-white">
                Hospital Profile
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                View and update your personal staff credentials.
              </p>
            </div>

            <form (ngSubmit)="saveProfile()" class="space-y-4 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    class="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >Full Name</label
                  >
                  <input
                    type="text"
                    [(ngModel)]="profileName"
                    name="profileName"
                    class="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    class="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >Work Email</label
                  >
                  <input
                    type="email"
                    [(ngModel)]="profileEmail"
                    name="profileEmail"
                    class="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <app-phone-number-input
                  label="Contact Phone"
                  [(ngModel)]="profilePhone"
                  name="profilePhone"
                ></app-phone-number-input>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label
                    class="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >System Role</label
                  >
                  <input
                    type="text"
                    disabled
                    [value]="userRoleDisplay"
                    class="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold"
                  />
                </div>
                <div>
                  <label
                    class="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >Employee ID</label
                  >
                  <input
                    type="text"
                    disabled
                    [value]="currentUser()?.employeeId || 'EMP-2026-001'"
                    class="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 font-mono font-semibold"
                  />
                </div>
              </div>

              <div
                class="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800"
              >
                <button
                  type="submit"
                  class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>

          <!-- TAB 2: Appearance -->
          <div *ngIf="activeTab() === 'appearance'" class="space-y-6">
            <div class="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 class="text-base font-bold text-slate-800 dark:text-white">
                Theme & Display Density
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Customize the application interface to your preference.
              </p>
            </div>

            <!-- Mode Selector -->
            <div class="space-y-3">
              <label
                class="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >Theme Mode</label
              >
              <div class="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  (click)="updateTheme('light')"
                  [class]="
                    'p-4 rounded-2xl border text-center flex flex-col items-center gap-2 cursor-pointer transition ' +
                    (settings().themeMode === 'light'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/60 text-indigo-600 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800')
                  "
                >
                  <app-icon name="sun" [size]="20"></app-icon>
                  <span class="text-xs">Light</span>
                </button>
                <button
                  type="button"
                  (click)="updateTheme('dark')"
                  [class]="
                    'p-4 rounded-2xl border text-center flex flex-col items-center gap-2 cursor-pointer transition ' +
                    (settings().themeMode === 'dark'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/60 text-indigo-600 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800')
                  "
                >
                  <app-icon name="moon" [size]="20"></app-icon>
                  <span class="text-xs">Dark</span>
                </button>
                <button
                  type="button"
                  (click)="updateTheme('system')"
                  [class]="
                    'p-4 rounded-2xl border text-center flex flex-col items-center gap-2 cursor-pointer transition ' +
                    (settings().themeMode === 'system'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/60 text-indigo-600 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800')
                  "
                >
                  <app-icon name="monitor" [size]="20"></app-icon>
                  <span class="text-xs">System</span>
                </button>
              </div>
            </div>

            <!-- Density Selector -->
            <div
              class="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800"
            >
              <label
                class="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >Display Density</label
              >
              <div class="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  (click)="updateDensity('comfortable')"
                  [class]="
                    'p-4 rounded-2xl border text-center flex flex-col items-center gap-1 cursor-pointer transition ' +
                    (settings().densityMode === 'comfortable'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/60 text-indigo-600 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800')
                  "
                >
                  <span class="text-xs font-bold">Comfortable</span>
                  <span class="text-[11px] text-slate-400"
                    >Standard padding for clinical workflows</span
                  >
                </button>
                <button
                  type="button"
                  (click)="updateDensity('compact')"
                  [class]="
                    'p-4 rounded-2xl border text-center flex flex-col items-center gap-1 cursor-pointer transition ' +
                    (settings().densityMode === 'compact'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/60 text-indigo-600 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800')
                  "
                >
                  <span class="text-xs font-bold">Compact</span>
                  <span class="text-[11px] text-slate-400"
                    >High-density data tables & dense lists</span
                  >
                </button>
              </div>
            </div>
          </div>

          <!-- TAB 3: Regional -->
          <div *ngIf="activeTab() === 'regional'" class="space-y-6">
            <div class="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 class="text-base font-bold text-slate-800 dark:text-white">
                Date & Time Regional Settings
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Configure international timezone, calendar formatting, and
                clinical clock standards.
              </p>
            </div>

            <!-- Live Regional Preview Card -->
            <div
              class="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 border border-blue-200/60 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div class="flex items-center gap-3">
                <div
                  class="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm shrink-0"
                >
                  <app-icon name="clock" [size]="20"></app-icon>
                </div>
                <div>
                  <div
                    class="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider"
                  >
                    Hospital Clock Preview
                  </div>
                  <div
                    class="text-lg font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2"
                  >
                    <span>{{ formattedCurrentTime() }}</span>
                    <span
                      class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                      title="Live clock sync"
                    ></span>
                  </div>
                </div>
              </div>
              <div class="text-left sm:text-right">
                <div
                  class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                >
                  Active Clinical Date
                </div>
                <div
                  class="text-sm font-semibold text-slate-800 dark:text-slate-200"
                >
                  {{ formattedCurrentDate() }}
                </div>
                <div
                  class="text-[11px] font-mono text-slate-500 dark:text-slate-400"
                >
                  {{ settings().timeZone }}
                </div>
              </div>
            </div>

            <div class="space-y-5 text-xs">
              <!-- Time Format Standard -->
              <div>
                <label
                  class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >Time Format Standard</label
                >
                <div class="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    (click)="updateSetting('timeFormat', '12')"
                    [class]="
                      'p-3.5 rounded-xl border text-left cursor-pointer transition ' +
                      (settings().timeFormat === '12'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/60 font-semibold text-blue-700 dark:text-blue-300 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800')
                    "
                  >
                    <div class="font-bold flex items-center justify-between">
                      <span>12-Hour Format</span>
                      <app-icon
                        *ngIf="settings().timeFormat === '12'"
                        name="check"
                        [size]="14"
                        className="text-blue-600"
                      ></app-icon>
                    </div>
                    <div
                      class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5"
                    >
                      e.g. 04:30:15 PM (Standard AM/PM)
                    </div>
                  </button>
                  <button
                    type="button"
                    (click)="updateSetting('timeFormat', '24')"
                    [class]="
                      'p-3.5 rounded-xl border text-left cursor-pointer transition ' +
                      (settings().timeFormat === '24'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/60 font-semibold text-blue-700 dark:text-blue-300 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800')
                    "
                  >
                    <div class="font-bold flex items-center justify-between">
                      <span>24-Hour Clinical Format</span>
                      <app-icon
                        *ngIf="settings().timeFormat === '24'"
                        name="check"
                        [size]="14"
                        className="text-blue-600"
                      ></app-icon>
                    </div>
                    <div
                      class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5"
                    >
                      e.g. 16:30:15 (Military / ICU Standard)
                    </div>
                  </button>
                </div>
              </div>

              <!-- Date Format -->
              <div>
                <label
                  class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >Clinical Date Format Standard</label
                >
                <select
                  [ngModel]="settings().dateFormat"
                  (ngModelChange)="updateSetting('dateFormat', $event)"
                  class="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option
                    *ngFor="let df of availableDateFormats()"
                    [value]="df.pattern"
                  >
                    {{ df.label }} &nbsp;—&nbsp; (Sample: {{ df.preview }})
                  </option>
                </select>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Controls how dates appear across patient dossiers, appointment
                  cards, and schedules.
                </p>
              </div>

              <!-- Timezone with Modern Searchable Dropdown Box -->
              <div class="relative">
                <div class="flex items-center justify-between mb-1.5">
                  <label
                    class="font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Hospital Timezone
                  </label>
                  <span
                    class="text-[11px] text-blue-600 dark:text-blue-400 font-mono font-semibold"
                  >
                    {{ allTimezones.length }} IANA Regions Available
                  </span>
                </div>

                <!-- Dropdown Trigger Button (Single-line Dropdown Box) -->
                <button
                  type="button"
                  (click)="isTzDropdownOpen.set(!isTzDropdownOpen())"
                  class="w-full flex items-center justify-between px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs shadow-2xs"
                >
                  <div class="flex items-center gap-2.5 truncate">
                    <app-icon
                      name="clock"
                      [size]="15"
                      className="text-blue-600 shrink-0"
                    ></app-icon>
                    <span class="font-medium truncate">{{
                      selectedTimezoneLabel()
                    }}</span>
                  </div>
                  <app-icon
                    name="chevron-down"
                    [size]="16"
                    [className]="
                      'text-slate-400 transition-transform duration-200 shrink-0 ' +
                      (isTzDropdownOpen() ? 'rotate-180' : '')
                    "
                  ></app-icon>
                </button>

                <!-- Floating Dropdown Popover with Search & List -->
                <div
                  *ngIf="isTzDropdownOpen()"
                  class="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-fade-in"
                >
                  <!-- Search input inside dropdown -->
                  <div
                    class="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50"
                  >
                    <div class="relative">
                      <app-icon
                        name="search"
                        [size]="14"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      ></app-icon>
                      <input
                        type="text"
                        [ngModel]="tzFilter()"
                        (ngModelChange)="tzFilter.set($event)"
                        placeholder="Type to filter country or city (e.g. Kolkata, London, New York, Tokyo)..."
                        class="w-full pl-8.5 pr-7 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        *ngIf="tzFilter()"
                        type="button"
                        (click)="tzFilter.set('')"
                        class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                      >
                        &times;
                      </button>
                    </div>
                  </div>

                  <!-- Scrollable Option List -->
                  <div
                    class="max-h-60 overflow-y-auto p-1.5 space-y-0.5 text-xs"
                  >
                    <div
                      *ngIf="filteredTimezones().length === 0"
                      class="py-6 text-center text-slate-400 text-xs"
                    >
                      No timezones matching "{{ tzFilter() }}"
                    </div>
                    <button
                      *ngFor="let tz of filteredTimezones()"
                      type="button"
                      (click)="selectTimezone(tz.id)"
                      [class]="
                        'w-full flex items-center justify-between px-3 py-2 rounded-xl text-left cursor-pointer transition ' +
                        (tz.id === settings().timeZone
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800')
                      "
                    >
                      <div class="truncate">
                        <span>{{ tz.label }}</span>
                      </div>
                      <app-icon
                        *ngIf="tz.id === settings().timeZone"
                        name="check"
                        [size]="14"
                        className="text-blue-600 shrink-0 ml-2"
                      ></app-icon>
                    </button>
                  </div>

                  <!-- Dropdown Footer -->
                  <div
                    class="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-[11px] text-slate-400 flex items-center justify-between"
                  >
                    <span>{{ filteredTimezones().length }} matches</span>
                    <button
                      type="button"
                      (click)="isTzDropdownOpen.set(false)"
                      class="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 4: Notifications -->
          <div *ngIf="activeTab() === 'notifications'" class="space-y-6">
            <div class="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 class="text-base font-bold text-slate-800 dark:text-white">
                Alert Preferences
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Choose which categories trigger in-app bell notifications.
              </p>
            </div>

            <div class="space-y-4 text-xs">
              <label
                class="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <div>
                  <div class="font-bold text-slate-800 dark:text-slate-200">
                    Patient Registrations
                  </div>
                  <div class="text-slate-400">
                    Alerts when new medical record numbers (MRNs) are created
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked
                  class="rounded border-slate-300 text-indigo-600"
                />
              </label>

              <label
                class="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <div>
                  <div class="font-bold text-slate-800 dark:text-slate-200">
                    Appointments & Check-Ins
                  </div>
                  <div class="text-slate-400">
                    Notifications on booking, check-in, and completed visits
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked
                  class="rounded border-slate-300 text-indigo-600"
                />
              </label>

              <label
                class="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <div>
                  <div class="font-bold text-slate-800 dark:text-slate-200">
                    Staff Onboarding Requests
                  </div>
                  <div class="text-slate-400">
                    Alert administrators when new staff apply for review
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked
                  class="rounded border-slate-300 text-indigo-600"
                />
              </label>
            </div>
          </div>

          <!-- TAB 5: Security -->
          <div *ngIf="activeTab() === 'security'" class="space-y-6">
            <div class="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 class="text-base font-bold text-slate-800 dark:text-white">
                Password & Authentication
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Update your hospital account password.
              </p>
            </div>

            <form
              (ngSubmit)="changePassword()"
              autocomplete="off"
              class="space-y-4 text-xs"
            >
              <div>
                <label
                  class="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Current Password
                  <span
                    class="text-rose-500 font-bold ml-0.5"
                    aria-hidden="true"
                    >*</span
                  >
                </label>
                <div class="relative flex items-center">
                  <input
                    [type]="showCurrentPass() ? 'text' : 'password'"
                    required
                    autocomplete="new-password"
                    placeholder="Enter your current password"
                    [(ngModel)]="currentPass"
                    name="currentPass"
                    class="w-full pl-3.5 pr-10 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    (click)="showCurrentPass.set(!showCurrentPass())"
                    [title]="
                      showCurrentPass() ? 'Hide password' : 'Show password'
                    "
                    class="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer transition"
                  >
                    <app-icon
                      [name]="showCurrentPass() ? 'eye-off' : 'eye'"
                      [size]="16"
                    ></app-icon>
                  </button>
                </div>
              </div>

              <div>
                <label
                  class="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  New Password
                  <span
                    class="text-rose-500 font-bold ml-0.5"
                    aria-hidden="true"
                    >*</span
                  >
                </label>
                <div class="relative flex items-center">
                  <input
                    [type]="showNewPass() ? 'text' : 'password'"
                    required
                    autocomplete="new-password"
                    placeholder="Enter new strong password"
                    [(ngModel)]="newPass"
                    name="newPass"
                    class="w-full pl-3.5 pr-10 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    (click)="showNewPass.set(!showNewPass())"
                    [title]="showNewPass() ? 'Hide password' : 'Show password'"
                    class="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer transition"
                  >
                    <app-icon
                      [name]="showNewPass() ? 'eye-off' : 'eye'"
                      [size]="16"
                    ></app-icon>
                  </button>
                </div>
              </div>

              <div>
                <label
                  class="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Confirm New Password
                  <span
                    class="text-rose-500 font-bold ml-0.5"
                    aria-hidden="true"
                    >*</span
                  >
                </label>
                <div class="relative flex items-center">
                  <input
                    [type]="showConfirmPass() ? 'text' : 'password'"
                    required
                    autocomplete="new-password"
                    placeholder="Re-enter new password to confirm"
                    [(ngModel)]="confirmPass"
                    name="confirmPass"
                    class="w-full pl-3.5 pr-10 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    (click)="showConfirmPass.set(!showConfirmPass())"
                    [title]="
                      showConfirmPass() ? 'Hide password' : 'Show password'
                    "
                    class="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer transition"
                  >
                    <app-icon
                      [name]="showConfirmPass() ? 'eye-off' : 'eye'"
                      [size]="16"
                    ></app-icon>
                  </button>
                </div>
              </div>

              <div
                class="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800"
              >
                <button
                  type="submit"
                  class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-sm cursor-pointer transition"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>

          <!-- TAB 6: About -->
          <div *ngIf="activeTab() === 'about'" class="space-y-6">
            <div class="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 class="text-base font-bold text-slate-800 dark:text-white">
                CareFlow HMS Enterprise
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                System specifications & regulatory compliance information.
              </p>
            </div>

            <div
              class="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs"
            >
              <div class="flex items-center gap-3">
                <div class="p-2.5 rounded-2xl bg-blue-600 text-white">
                  <app-icon name="activity" [size]="24"></app-icon>
                </div>
                <div>
                  <h4
                    class="font-bold text-slate-900 dark:text-white text-base"
                  >
                    CareFlow HMS v2.5
                  </h4>
                  <p class="text-slate-400 text-xs">
                    Angular 21 Client • ASP.NET Core API • PostgreSQL
                  </p>
                </div>
              </div>

              <div
                class="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-700"
              >
                <div>
                  <span class="text-slate-400 block mb-0.5">Framework</span>
                  <span class="font-semibold text-slate-800 dark:text-slate-200"
                    >Angular 21.2.25</span
                  >
                </div>
                <div>
                  <span class="text-slate-400 block mb-0.5">Styling</span>
                  <span class="font-semibold text-slate-800 dark:text-slate-200"
                    >Tailwind CSS v4</span
                  >
                </div>
                <div>
                  <span class="text-slate-400 block mb-0.5">Compliance</span>
                  <span class="font-semibold text-emerald-600"
                    >DPDP Act 2023 & ABDM</span
                  >
                </div>
                <div>
                  <span class="text-slate-400 block mb-0.5">Encryption</span>
                  <span class="font-semibold text-slate-800 dark:text-slate-200"
                    >AES-256 at Rest</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SettingsPageComponent implements OnInit {
  private authService = inject(AuthService);
  private settingsService = inject(SettingsService);

  readonly currentUser = this.authService.currentUser;
  readonly settings = this.settingsService.settings;

  readonly activeTab = signal<SettingsTab>("profile");
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly allTimezones = getAllAvailableTimezones();
  readonly tzFilter = signal("");

  readonly filteredTimezones = computed(() => {
    const q = this.tzFilter().trim().toLowerCase();
    if (!q) return this.allTimezones;
    return this.allTimezones.filter(
      (tz) =>
        tz.id.toLowerCase().includes(q) ||
        tz.label.toLowerCase().includes(q) ||
        tz.region.toLowerCase().includes(q),
    );
  });

  readonly availableDateFormats = computed(() => {
    return getStandardDateFormats(this.settings().timeZone);
  });

  readonly formattedCurrentTime = this.settingsService.formattedCurrentTime;
  readonly formattedCurrentDate = this.settingsService.formattedCurrentDate;

  readonly isTzDropdownOpen = signal(false);

  readonly selectedTimezoneLabel = computed(() => {
    const current = this.settings().timeZone;
    const match = this.allTimezones.find((t) => t.id === current);
    return match ? match.label : current;
  });

  selectTimezone(id: string): void {
    this.updateSetting("timeZone", id);
    this.isTzDropdownOpen.set(false);
  }

  profileName = "";
  profileEmail = "";
  profilePhone = "";

  currentPass = "";
  newPass = "";
  confirmPass = "";
  readonly showCurrentPass = signal(false);
  readonly showNewPass = signal(false);
  readonly showConfirmPass = signal(false);

  get userRoleDisplay(): string {
    const user = this.currentUser();
    return formatRoleDisplay(user?.roleName, user?.role);
  }

  ngOnInit(): void {
    this.currentPass = "";
    this.newPass = "";
    this.confirmPass = "";
    const user = this.currentUser();
    if (user) {
      this.profileName = user.fullName || "";
      this.profileEmail = user.email || "";
      this.profilePhone = user.phone || "";
    }
  }

  updateTheme(mode: "light" | "dark" | "system"): void {
    this.settingsService.updateSetting("themeMode", mode);
  }

  updateDensity(mode: "comfortable" | "compact"): void {
    this.settingsService.updateSetting("densityMode", mode);
  }

  updateSetting(key: any, val: any): void {
    this.settingsService.updateSetting(key, val);
  }

  saveProfile(): void {
    this.authService
      .updateProfile({
        fullName: this.profileName.trim(),
        email: this.profileEmail.trim(),
        phone: this.profilePhone,
      })
      .subscribe({
        next: () => {
          this.successMessage.set("Profile details updated successfully!");
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => {
          this.errorMessage.set(
            err?.error?.message || "Failed to update profile.",
          );
          setTimeout(() => this.errorMessage.set(null), 4000);
        },
      });
  }

  changePassword(): void {
    if (this.newPass !== this.confirmPass) {
      this.errorMessage.set("Passwords do not match.");
      return;
    }

    this.authService
      .changePassword({
        currentPassword: this.currentPass,
        newPassword: this.newPass,
        confirmPassword: this.confirmPass,
      })
      .subscribe({
        next: () => {
          this.successMessage.set("Password updated successfully!");
          this.currentPass = "";
          this.newPass = "";
          this.confirmPass = "";
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => {
          this.errorMessage.set(
            err?.error?.message || "Failed to update password.",
          );
          setTimeout(() => this.errorMessage.set(null), 4000);
        },
      });
  }
}
