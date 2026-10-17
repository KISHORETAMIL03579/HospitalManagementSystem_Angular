import { Injectable, signal, computed, effect } from "@angular/core";
import {
  formatLiveTime,
  formatDateByPattern,
  formatTimeSlot,
  applyThemeMode,
  applyFontSize,
  applyDensityMode,
  updateStoredSettings,
  StoredPreferences,
} from "../utils/date-utils";

export interface AppSettings {
  timeFormat: "12" | "24";
  timeZone: string;
  theme: "light" | "dark" | "system";
  themeMode?: "light" | "dark" | "system";
  dateFormat: string;
  language: string;
  fontSize: "small" | "medium" | "large";
  density: "compact" | "comfortable";
  densityMode?: "compact" | "comfortable";
}

const DEFAULT_SETTINGS: AppSettings = {
  timeFormat: "12",
  timeZone: "Asia/Kolkata",
  theme: "light",
  themeMode: "light",
  dateFormat: "DD/MM/YYYY",
  language: "en-US",
  fontSize: "medium",
  density: "comfortable",
  densityMode: "comfortable",
};

@Injectable({
  providedIn: "root",
})
export class SettingsService {
  private isBrowser = typeof window !== "undefined";

  // Reactive state signals
  readonly timeFormat = signal<"12" | "24">("12");
  readonly timeZone = signal<string>("Asia/Kolkata");
  readonly theme = signal<"light" | "dark" | "system">("light");
  readonly dateFormat = signal<string>("DD/MM/YYYY");
  readonly language = signal<string>("en-US");
  readonly fontSize = signal<"small" | "medium" | "large">("medium");
  readonly density = signal<"compact" | "comfortable">("comfortable");

  readonly settings = computed<AppSettings>(() => ({
    timeFormat: this.timeFormat(),
    timeZone: this.timeZone(),
    theme: this.theme(),
    themeMode: this.theme(),
    dateFormat: this.dateFormat(),
    language: this.language(),
    fontSize: this.fontSize(),
    density: this.density(),
    densityMode: this.density(),
  }));

  // Real-time clock signal that updates every second
  readonly currentTime = signal<Date>(new Date());
  readonly liveClock = this.currentTime;

  readonly formattedCurrentTime = computed(() => {
    return formatLiveTime(
      this.currentTime(),
      this.timeFormat(),
      this.timeZone(),
    );
  });

  readonly formattedCurrentDate = computed(() => {
    return formatDateByPattern(
      this.currentTime(),
      this.dateFormat(),
      this.timeZone(),
    );
  });

  readonly isDark = computed(() => {
    if (this.theme() === "dark") return true;
    if (this.theme() === "system" && this.isBrowser && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  constructor() {
    this.loadFromStorage();

    if (this.isBrowser) {
      // Clock timer
      setInterval(() => {
        this.currentTime.set(new Date());
      }, 1000);

      // Listen to cross-tab storage changes
      window.addEventListener("storage", () => this.loadFromStorage());
      window.addEventListener("careflow_settings_updated", () =>
        this.loadFromStorage(),
      );
    }

    // Effect to apply classes to <html>
    effect(() => {
      const th = this.theme();
      const fs = this.fontSize();
      const dn = this.density();

      applyThemeMode(th);
      applyFontSize(fs);
      applyDensityMode(dn);
    });
  }

  loadFromStorage(): void {
    if (!this.isBrowser) return;

    try {
      const th =
        (localStorage.getItem("careflow_theme") as
          "light" | "dark" | "system") || DEFAULT_SETTINGS.theme;
      const fs =
        (localStorage.getItem("careflow_fontSize") as
          "small" | "medium" | "large") || DEFAULT_SETTINGS.fontSize;
      const dn =
        (localStorage.getItem("careflow_density") as
          "compact" | "comfortable") || DEFAULT_SETTINGS.density;
      const tf =
        (localStorage.getItem("careflow_timeFormat") as "12" | "24") ||
        DEFAULT_SETTINGS.timeFormat;
      const tz =
        localStorage.getItem("careflow_timeZone") || DEFAULT_SETTINGS.timeZone;
      const df =
        localStorage.getItem("careflow_dateFormat") ||
        DEFAULT_SETTINGS.dateFormat;
      const ln =
        localStorage.getItem("careflow_language") || DEFAULT_SETTINGS.language;

      this.theme.set(th);
      this.fontSize.set(fs);
      this.density.set(dn);
      this.timeFormat.set(tf);
      this.timeZone.set(tz);
      this.dateFormat.set(df);
      this.language.set(ln);
    } catch (e) {
      console.error("Failed to load settings from localStorage:", e);
    }
  }

  updateSetting(key: keyof AppSettings | string, value: any): void {
    const mappedKey =
      key === "themeMode" ? "theme" : key === "densityMode" ? "density" : key;
    updateStoredSettings({ [mappedKey]: value });
    this.loadFromStorage();
  }

  updateSettings(newSettings: Partial<AppSettings>): void {
    updateStoredSettings(newSettings as StoredPreferences);
    this.loadFromStorage();
  }

  toggleTheme(): void {
    const next = this.isDark() ? "light" : "dark";
    this.updateSetting("theme", next);
  }

  formatTime(timeStr?: string): string {
    return formatTimeSlot(timeStr, this.timeFormat(), this.timeZone());
  }

  formatDate(dateVal: string | Date): string {
    return formatDateByPattern(dateVal, this.dateFormat(), this.timeZone());
  }
}
