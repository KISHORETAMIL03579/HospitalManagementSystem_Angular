import { DateTime } from "luxon";

const isBrowser =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export type ThemeMode = "light" | "dark" | "system";
export type FontSize = "small" | "medium" | "large";
export type DensityMode = "compact" | "comfortable";
export type TimeFormat = "12" | "24";

export interface TimezoneOption {
  id: string; // e.g. "Asia/Kolkata"
  label: string; // e.g. "(UTC+05:30) Asia/Kolkata"
  offset: string; // "+05:30"
  offsetMinutes: number;
  region: string; // "Asia"
}

export interface DateFormatOption {
  pattern: string;
  label: string;
  preview: string;
  category: string;
}

export interface StoredPreferences {
  theme?: ThemeMode;
  fontSize?: FontSize;
  density?: DensityMode;
  timeFormat?: TimeFormat;
  timeZone?: string;
  dateFormat?: string;
  language?: string;
  firstDay?: "monday" | "sunday";
}

// ----------------------------------------------------
// Validation & Preference Helpers
// ----------------------------------------------------

export function getStoredPreference(key: string, fallback: string): string {
  if (!isBrowser) return fallback;
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

export function getThemePreference(): ThemeMode {
  const val = getStoredPreference("careflow_theme", "light");
  return val === "light" || val === "dark" || val === "system" ? val : "light";
}

export function getTimeFormatPreference(): TimeFormat {
  const val = getStoredPreference("careflow_timeFormat", "12");
  return val === "12" || val === "24" ? val : "12";
}

export function getFontSizePreference(): FontSize {
  const val = getStoredPreference("careflow_fontSize", "medium");
  return val === "small" || val === "medium" || val === "large"
    ? val
    : "medium";
}

export function getDensityPreference(): DensityMode {
  const val = getStoredPreference("careflow_density", "comfortable");
  return val === "compact" || val === "comfortable" ? val : "comfortable";
}

export function getTimeZonePreference(): string {
  const val = getStoredPreference("careflow_timeZone", "Asia/Kolkata");
  try {
    if (DateTime.now().setZone(val).isValid) {
      return val;
    }
  } catch {
    // fallback
  }
  return "Asia/Kolkata";
}

export function getDateFormatPreference(): string {
  const val = getStoredPreference("careflow_dateFormat", "dd/MM/yyyy");
  return normalizeFormatPattern(val);
}

export function normalizeFormatPattern(pattern?: string): string {
  if (!pattern) return "dd/MM/yyyy";
  const mapped = pattern
    .replace(/YYYY/g, "yyyy")
    .replace(/YY/g, "yy")
    .replace(/DD/g, "dd")
    .replace(/\bD\b/g, "d");

  // Verify pattern is valid for Luxon
  try {
    const test = DateTime.now().toFormat(mapped);
    if (test && !test.includes("Invalid")) {
      return mapped;
    }
  } catch {
    // fallback
  }
  return "dd/MM/yyyy";
}

// ----------------------------------------------------
// Dedicated Time Parsing & Formatting
// ----------------------------------------------------

export function parseTimeString(
  value: string,
): { hours: number; minutes: number } | null {
  if (!value) return null;
  const trimmed = value.trim();
  // Accepts HH:mm or HH:mm:ss (00:00 to 23:59)
  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(trimmed);
  if (!match) return null;

  return {
    hours: Number(match[1]),
    minutes: Number(match[2]),
  };
}

export function formatTimeSlot(
  timeStr?: string,
  formatPref?: string,
  timeZonePref?: string,
): string {
  if (!timeStr) return "";

  const timeFormat = formatPref || getTimeFormatPreference();
  const timeZone = timeZonePref || getTimeZonePreference();
  const is24 = timeFormat === "24";
  const targetPattern = is24 ? "HH:mm" : "hh:mm a";

  // Case A: Full ISO DateTime string e.g. "2026-10-17T14:30:00Z"
  if (timeStr.includes("T")) {
    try {
      let dt = DateTime.fromISO(timeStr, { zone: timeZone });
      if (!dt.isValid) {
        const jsDate = new Date(timeStr);
        if (!isNaN(jsDate.getTime())) {
          dt = DateTime.fromJSDate(jsDate, { zone: timeZone });
        }
      }
      if (dt.isValid) {
        return dt.toFormat(targetPattern);
      }
    } catch {
      // fallback
    }
    return "";
  }

  // Case B: Time-only string e.g. "09:30", "14:45"
  const parsed = parseTimeString(timeStr);
  if (!parsed) {
    // Reject invalid inputs like "abc:30" or "25:90"
    return "";
  }

  try {
    const dt = DateTime.now().setZone(timeZone).set({
      hour: parsed.hours,
      minute: parsed.minutes,
      second: 0,
      millisecond: 0,
    });

    return dt.isValid ? dt.toFormat(targetPattern) : "";
  } catch {
    return "";
  }
}

// ----------------------------------------------------
// Date Parsing & Formatting
// ----------------------------------------------------

export function formatDateByPattern(
  dateVal: string | Date | null | undefined,
  formatPref?: string,
  timeZonePref?: string,
): string {
  if (!dateVal) return "";

  const pattern = normalizeFormatPattern(
    formatPref || getDateFormatPreference(),
  );
  const timeZone = timeZonePref || getTimeZonePreference();

  try {
    let dt: DateTime;

    if (typeof dateVal === "string") {
      const trimmed = dateVal.trim();

      // Date-only string e.g. "2026-10-17": parse directly to prevent timezone day-shift
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        dt = DateTime.fromISO(trimmed);
      } else {
        // Full ISO timestamp with time/zone
        dt = DateTime.fromISO(trimmed, { zone: timeZone });
        if (!dt.isValid) {
          const jsDate = new Date(trimmed);
          if (!isNaN(jsDate.getTime())) {
            dt = DateTime.fromJSDate(jsDate, { zone: timeZone });
          }
        }
      }
    } else if (dateVal instanceof Date) {
      if (isNaN(dateVal.getTime())) return "";
      dt = DateTime.fromJSDate(dateVal, { zone: timeZone });
    } else {
      return "";
    }

    if (dt && dt.isValid) {
      return dt.toFormat(pattern);
    }
  } catch {
    // fallback
  }

  try {
    const d =
      typeof dateVal === "string" ? new Date(dateVal) : (dateVal as Date);
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
  } catch {
    return "";
  }
}

export function formatLiveTime(
  dateVal: Date,
  timeFormatPref?: string,
  timeZonePref?: string,
): string {
  if (!dateVal || isNaN(dateVal.getTime())) return "";

  const timeFormat = timeFormatPref || getTimeFormatPreference();
  const timeZone = timeZonePref || getTimeZonePreference();
  const is24 = timeFormat === "24";
  const targetPattern = is24 ? "HH:mm:ss" : "hh:mm:ss a";

  try {
    const dt = DateTime.fromJSDate(dateVal, { zone: timeZone });
    if (dt.isValid) {
      return dt.toFormat(targetPattern);
    }
  } catch {
    // fallback
  }

  try {
    return dateVal.toLocaleTimeString([], {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: !is24,
    });
  } catch {
    return "";
  }
}

// ----------------------------------------------------
// Timezone and Regional List
// ----------------------------------------------------

interface IntlWithSupportedValues {
  supportedValuesOf?: (key: string) => string[];
}

export function getAllAvailableTimezones(): TimezoneOption[] {
  let tzList: string[] = [];
  try {
    const intlTyped = Intl as unknown as IntlWithSupportedValues;
    if (typeof intlTyped.supportedValuesOf === "function") {
      tzList = intlTyped.supportedValuesOf("timeZone") || [];
    }
  } catch (e) {
    console.warn("Intl.supportedValuesOf('timeZone') not supported:", e);
  }

  if (!tzList || tzList.length === 0) {
    tzList = [
      "UTC",
      "Africa/Cairo",
      "Africa/Johannesburg",
      "Africa/Lagos",
      "Africa/Nairobi",
      "America/Anchorage",
      "America/Argentina/Buenos_Aires",
      "America/Bogota",
      "America/Chicago",
      "America/Denver",
      "America/Halifax",
      "America/Los_Angeles",
      "America/Mexico_City",
      "America/New_York",
      "America/Phoenix",
      "America/Santiago",
      "America/Sao_Paulo",
      "America/Toronto",
      "America/Vancouver",
      "Asia/Bangkok",
      "Asia/Colombo",
      "Asia/Dhaka",
      "Asia/Dubai",
      "Asia/Hong_Kong",
      "Asia/Jakarta",
      "Asia/Jerusalem",
      "Asia/Karachi",
      "Asia/Kolkata",
      "Asia/Kuala_Lumpur",
      "Asia/Manila",
      "Asia/Qatar",
      "Asia/Riyadh",
      "Asia/Seoul",
      "Asia/Shanghai",
      "Asia/Singapore",
      "Asia/Taipei",
      "Asia/Tokyo",
      "Atlantic/Reykjavik",
      "Australia/Adelaide",
      "Australia/Brisbane",
      "Australia/Melbourne",
      "Australia/Perth",
      "Australia/Sydney",
      "Europe/Amsterdam",
      "Europe/Athens",
      "Europe/Berlin",
      "Europe/Brussels",
      "Europe/Dublin",
      "Europe/Helsinki",
      "Europe/Istanbul",
      "Europe/Lisbon",
      "Europe/London",
      "Europe/Madrid",
      "Europe/Moscow",
      "Europe/Paris",
      "Europe/Rome",
      "Europe/Stockholm",
      "Europe/Vienna",
      "Europe/Warsaw",
      "Europe/Zurich",
      "Pacific/Auckland",
      "Pacific/Fiji",
      "Pacific/Honolulu",
      "Pacific/Guam",
    ];
  }

  if (!tzList.includes("UTC")) {
    tzList.unshift("UTC");
  }

  const now = DateTime.now();

  const options: TimezoneOption[] = tzList.map((tz) => {
    let offsetStr = "+00:00";
    let offsetMinutes = 0;
    try {
      const dt = now.setZone(tz);
      if (dt.isValid) {
        offsetStr = dt.toFormat("ZZ");
        offsetMinutes = dt.offset;
      }
    } catch {
      // fallback
    }

    const region = tz.includes("/") ? tz.split("/")[0] : "Global";

    return {
      id: tz,
      label: `(UTC${offsetStr}) ${tz.replace(/_/g, " ")}`,
      offset: offsetStr,
      offsetMinutes,
      region,
    };
  });

  return options.sort((a, b) => {
    if (a.offsetMinutes !== b.offsetMinutes) {
      return a.offsetMinutes - b.offsetMinutes;
    }
    return a.id.localeCompare(b.id);
  });
}

export function getStandardDateFormats(
  timeZonePref?: string,
): DateFormatOption[] {
  const timeZone = timeZonePref || getTimeZonePreference();
  let now = DateTime.now().setZone(timeZone);
  if (!now.isValid) now = DateTime.now();

  const formats = [
    {
      pattern: "dd/MM/yyyy",
      label: "dd/MM/yyyy (UK, India, Australia, Europe)",
      category: "Standard",
    },
    {
      pattern: "MM/dd/yyyy",
      label: "MM/dd/yyyy (US Standard)",
      category: "Standard",
    },
    {
      pattern: "yyyy-MM-dd",
      label: "yyyy-MM-dd (ISO 8601 International)",
      category: "ISO Standard",
    },
    {
      pattern: "dd-MM-yyyy",
      label: "dd-MM-yyyy (Hyphenated Standard)",
      category: "Standard",
    },
    {
      pattern: "dd.MM.yyyy",
      label: "dd.MM.yyyy (Continental Europe - Germany, CH)",
      category: "European",
    },
    {
      pattern: "yyyy/MM/dd",
      label: "yyyy/MM/dd (East Asia - Japan, China, Canada)",
      category: "Regional",
    },
    {
      pattern: "dd MMM yyyy",
      label: "dd MMM yyyy (Clinical & Healthcare Standard)",
      category: "Clinical",
    },
    {
      pattern: "dd MMMM yyyy",
      label: "dd MMMM yyyy (Long Medical Record)",
      category: "Clinical",
    },
    {
      pattern: "MMMM dd, yyyy",
      label: "MMMM dd, yyyy (US Long Form)",
      category: "Descriptive",
    },
    {
      pattern: "EEE, dd MMM yyyy",
      label: "EEE, dd MMM yyyy (Clinical Appointment Schedule)",
      category: "Clinical",
    },
    {
      pattern: "EEEE, MMMM dd, yyyy",
      label: "EEEE, MMMM dd, yyyy (Full Hospital Calendar)",
      category: "Descriptive",
    },
  ];

  return formats.map((f) => ({
    pattern: f.pattern,
    label: f.label,
    preview: now.toFormat(f.pattern),
    category: f.category,
  }));
}

// ----------------------------------------------------
// Theme & Display Settings
// ----------------------------------------------------

export function watchSystemTheme(): () => void {
  if (!isBrowser) return () => {};

  try {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const update = () => {
      const savedTheme = getThemePreference();
      if (savedTheme === "system") {
        document.documentElement.classList.toggle("dark", media.matches);
      }
    };

    if (media.addEventListener) {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    } else if (
      (media as unknown as { addListener?: (fn: () => void) => void })
        .addListener
    ) {
      (
        media as unknown as { addListener: (fn: () => void) => void }
      ).addListener(update);
      return () =>
        (
          media as unknown as { removeListener: (fn: () => void) => void }
        ).removeListener(update);
    }
  } catch (err) {
    console.warn("Failed to attach system theme listener:", err);
  }
  return () => {};
}

export function applyThemeMode(theme: ThemeMode): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    if (
      isBrowser &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
}

export function applyFontSize(size: FontSize): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (size === "small") {
    root.style.fontSize = "13px";
  } else if (size === "large") {
    root.style.fontSize = "16px";
  } else {
    root.style.fontSize = "14px";
  }
}

export function applyDensityMode(density: DensityMode): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (density === "compact") {
    root.classList.add("compact-mode");
  } else {
    root.classList.remove("compact-mode");
  }
}

export function notifySettingsChanged(): void {
  if (isBrowser) {
    window.dispatchEvent(new Event("careflow_settings_updated"));
  }
}

export function updateStoredSettings(settings: StoredPreferences): void {
  if (isBrowser) {
    Object.entries(settings).forEach(([key, val]) => {
      if (val !== undefined) {
        try {
          localStorage.setItem(`careflow_${key}`, String(val));
        } catch (e) {
          console.error(`Failed to persist careflow_${key}:`, e);
        }
      }
    });
  }

  if (settings.theme) applyThemeMode(settings.theme);
  if (settings.fontSize) applyFontSize(settings.fontSize);
  if (settings.density) applyDensityMode(settings.density);

  notifySettingsChanged();
}

export function initializeAppSettings(): void {
  if (!isBrowser || typeof document === "undefined") return;

  try {
    const savedTheme = getThemePreference();
    const savedFontSize = getFontSizePreference();
    const savedDensity = getDensityPreference();

    applyThemeMode(savedTheme);
    applyFontSize(savedFontSize);
    applyDensityMode(savedDensity);

    // Watch OS dark/light mode changes when system theme is selected
    watchSystemTheme();
  } catch (err) {
    console.error(
      "Failed to initialize CareFlow app settings on startup:",
      err,
    );
  }
}
