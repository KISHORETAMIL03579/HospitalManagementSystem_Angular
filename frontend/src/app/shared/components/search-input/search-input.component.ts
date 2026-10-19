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
import { IconComponent } from "@shared/components/icon/icon.component";

@Component({
  selector: "app-search-input",
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="relative w-full">
      <app-icon
        name="search"
        [size]="iconSize"
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      ></app-icon>

      <input
        type="text"
        [placeholder]="placeholder"
        [value]="value"
        (input)="onInput($event)"
        (blur)="onBlur()"
        [attr.aria-label]="placeholder"
        class="w-full pl-10 pr-9 py-2 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
      />

      <button
        *ngIf="value"
        type="button"
        (click)="clear()"
        aria-label="Clear search"
        title="Clear search"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5 rounded transition-colors"
      >
        <app-icon name="x" [size]="14"></app-icon>
      </button>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
    `,
  ],
})
export class SearchInputComponent implements ControlValueAccessor {
  @Input() placeholder = "Search...";
  @Input() iconSize = 15;
  @Input() value = "";

  @Output() valueChange = new EventEmitter<string>();
  @Output() search = new EventEmitter<string>();

  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: string): void {
    this.value = val || "";
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
    this.search.emit(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }

  clear(): void {
    this.value = "";
    this.onChange("");
    this.valueChange.emit("");
    this.search.emit("");
  }
}
