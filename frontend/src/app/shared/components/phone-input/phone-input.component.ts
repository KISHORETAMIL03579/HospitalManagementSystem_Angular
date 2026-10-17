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
        class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
      >
        {{ label }} <span *ngIf="required" class="text-red-500">*</span>
      </label>

      <div class="relative flex items-center">
        <!-- Country Dial Code Selector -->
        <div class="relative shrink-0">
          <select
            [(ngModel)]="selectedDialCode"
            (ngModelChange)="onDialCodeChange()"
            [disabled]="disabled"
            class="h-10 px-2 sm:px-3 border border-r-0 border-slate-300 dark:border-slate-600 rounded-l-lg bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option
              *ngFor="let country of countries"
              [value]="country.dialCode"
            >
              {{ country.flag }} {{ country.dialCode }} ({{ country.code }})
            </option>
          </select>
        </div>

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
          class="w-full h-10 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-r-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
        />
      </div>

      <p *ngIf="error" class="mt-1 text-xs text-rose-600 dark:text-rose-400">
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
  @Input() placeholder = "Phone number";

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

    // Try finding matching dial code
    const matched = this.countries.find((c) => val.startsWith(c.dialCode));
    if (matched) {
      this.selectedDialCode = matched.dialCode;
      this.phoneNumber = val.substring(matched.dialCode.length).trim();
    } else {
      this.phoneNumber = val;
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
