import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormsModule,
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from "@angular/forms";

interface CountryOption {
  code: string;
  dialCode: string;
  name: string;
  flag: string;
}

@Component({
  selector: "app-phone-number-input",
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneNumberInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="w-full">
      <label
        *ngIf="label"
        [attr.for]="id"
        class="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
      >
        {{ label }}
        <span
          *ngIf="required"
          class="text-rose-500 font-bold ml-0.5"
          aria-hidden="true"
          >*</span
        >
      </label>

      <!-- Unified Composite Input Container -->
      <div
        [class]="
          'relative flex items-center h-10 w-full rounded-xl border bg-white dark:bg-slate-800 transition-all shadow-2xs ' +
          (disabled
            ? 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50 '
            : '') +
          (error
            ? 'border-rose-400 dark:border-rose-600 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/20'
            : 'border-slate-300 dark:border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20')
        "
      >
        <!-- Country Dial Code Selector -->
        <div class="relative shrink-0 flex items-center h-full">
          <select
            [(ngModel)]="selectedDialCode"
            (ngModelChange)="onDialCodeChange()"
            [disabled]="disabled"
            class="h-full pl-3 pr-2 text-xs sm:text-sm font-semibold bg-transparent border-0 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-0 cursor-pointer"
          >
            <option
              *ngFor="let country of countries"
              [value]="country.dialCode"
              class="bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {{ country.flag }} {{ country.dialCode }} ({{ country.code }})
            </option>
          </select>
        </div>

        <!-- Vertical Divider -->
        <div class="h-5 w-px bg-slate-200 dark:bg-slate-700 shrink-0"></div>

        <!-- Phone input field -->
        <input
          type="tel"
          [id]="id"
          [name]="id"
          [(ngModel)]="phoneNumber"
          (ngModelChange)="onPhoneChange()"
          [disabled]="disabled"
          [required]="required"
          [placeholder]="placeholder"
          autocomplete="tel"
          class="flex-1 h-full px-3 py-2 text-xs sm:text-sm font-medium bg-transparent border-0 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-0"
        />

        <!-- Clear Number Button -->
        <button
          *ngIf="phoneNumber && !disabled"
          type="button"
          (click)="clearPhone()"
          title="Clear phone number"
          class="mr-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer transition"
        >
          <span class="text-xs font-bold leading-none">&times;</span>
        </button>
      </div>

      <p
        *ngIf="error"
        class="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400"
      >
        {{ error }}
      </p>
      <p
        *ngIf="!error && helperText"
        class="mt-1 text-xs text-slate-500 dark:text-slate-400"
      >
        {{ helperText }}
      </p>
    </div>
  `,
})
export class PhoneNumberInputComponent implements ControlValueAccessor {
  @Input() label = "Phone Number";
  @Input() error?: string;
  @Input() helperText?: string;
  @Input() id = "phone-input";
  @Input() disabled = false;
  @Input() required = false;
  @Input() placeholder = "Enter phone number";

  @Output() phoneChange = new EventEmitter<string>();

  countries: CountryOption[] = [
    { code: "IN", dialCode: "+91", name: "India", flag: "🇮🇳" },
    { code: "US", dialCode: "+1", name: "United States", flag: "🇺🇸" },
    { code: "GB", dialCode: "+44", name: "United Kingdom", flag: "🇬🇧" },
    { code: "CA", dialCode: "+1", name: "Canada", flag: "🇨🇦" },
    { code: "AU", dialCode: "+61", name: "Australia", flag: "🇦🇺" },
    { code: "DE", dialCode: "+49", name: "Germany", flag: "🇩🇪" },
    { code: "FR", dialCode: "+33", name: "France", flag: "🇫🇷" },
    { code: "AE", dialCode: "+971", name: "UAE", flag: "🇦🇪" },
    { code: "SG", dialCode: "+65", name: "Singapore", flag: "🇸🇬" },
    { code: "SA", dialCode: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
    { code: "QA", dialCode: "+974", name: "Qatar", flag: "🇶🇦" },
    { code: "KW", dialCode: "+965", name: "Kuwait", flag: "🇰🇼" },
    { code: "OM", dialCode: "+968", name: "Oman", flag: "🇴🇲" },
    { code: "JP", dialCode: "+81", name: "Japan", flag: "🇯🇵" },
    { code: "MY", dialCode: "+60", name: "Malaysia", flag: "🇲🇾" },
    { code: "NZ", dialCode: "+64", name: "New Zealand", flag: "🇳🇿" },
    { code: "ZA", dialCode: "+27", name: "South Africa", flag: "🇿🇦" },
    { code: "BR", dialCode: "+55", name: "Brazil", flag: "🇧🇷" },
    { code: "IT", dialCode: "+39", name: "Italy", flag: "🇮🇹" },
    { code: "ES", dialCode: "+34", name: "Spain", flag: "🇪🇸" },
    { code: "NL", dialCode: "+31", name: "Netherlands", flag: "🇳🇱" },
    { code: "CH", dialCode: "+41", name: "Switzerland", flag: "🇨🇭" },
    { code: "SE", dialCode: "+46", name: "Sweden", flag: "🇸🇪" },
    { code: "IE", dialCode: "+353", name: "Ireland", flag: "🇮🇪" },
  ];

  selectedDialCode = "+91";
  phoneNumber = "";

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: string): void {
    if (!val) {
      this.phoneNumber = "";
      return;
    }

    const trimmed = String(val).trim();
    // Try finding matching dial code
    const matched = this.countries.find((c) => trimmed.startsWith(c.dialCode));
    if (matched) {
      this.selectedDialCode = matched.dialCode;
      this.phoneNumber = trimmed.substring(matched.dialCode.length).trim();
    } else {
      this.phoneNumber = trimmed;
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onDialCodeChange(): void {
    this.emitFullPhone();
  }

  onPhoneChange(): void {
    this.emitFullPhone();
  }

  clearPhone(): void {
    this.phoneNumber = "";
    this.emitFullPhone();
  }

  private emitFullPhone(): void {
    const cleanedNumber = this.phoneNumber.replace(/[^\d]/g, "");
    const full = cleanedNumber
      ? `${this.selectedDialCode}${cleanedNumber}`
      : "";
    this.onChange(full);
    this.phoneChange.emit(full);
    this.onTouched();
  }
}
