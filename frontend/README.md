# 🏥 CareFlow HMS Frontend (Angular 21)

> Modern, standalone, signal-driven frontend application for the CareFlow Hospital Management System.

[![Angular 21](https://img.shields.io/badge/Angular-21.2-red?logo=angular)](https://angular.dev/)
[![TypeScript 5.9](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

---

## ⚡ Quick Start

```powershell
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start development server with proxy (Runs at http://localhost:5173)
npm run dev
```

The frontend uses `proxy.conf.json` to proxy API calls (`/api/v1`) to the backend at `http://localhost:5000`.

---

## 🛠️ Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `ng serve --port 5173` | Starts the Angular development server |
| `npm run build` | `ng build` | Compiles production bundle to `dist/frontend` |
| `npm run watch` | `ng build --watch --configuration development` | Incremental dev compilation |
| `npm run lint` | `oxlint` | Runs fast Oxlint diagnostics (0 warnings target) |
| `npm run format` | `prettier --write "src/**/*.{ts,html,css,json}"` | Auto-formats code with Prettier |
| `npm run format:check`| `prettier --check "src/**/*.{ts,html,css,json}"` | Checks formatting compliance |

---

## 🏛️ Frontend Architecture

CareFlow Frontend follows **Clean Architecture** with a **Feature-Driven** layout:

```
src/app/
├── core/                       # Singleton application infrastructure
│   ├── guards/                 # Functional route guards (authGuard, roleGuard)
│   ├── interceptors/           # auth.interceptor (Bearer JWT injection, error handling)
│   ├── models/                 # TypeScript DTOs & API contracts
│   ├── services/               # Signal-based domain services (cached with shareReplay)
│   ├── tokens/                 # API_BASE_URL InjectionToken
│   └── utils/                  # Date, format, and phone utilities
│
├── layout/                     # Application shell
│   ├── app-layout.component.ts # Responsive sidebar, header, dark mode toggle
│   └── notification-bell/      # Global notification popover
│
├── features/                   # Standalone feature modules
│   ├── admin/                  # User management & staff onboarding approvals
│   ├── appointments/           # Appointment list, calendar grid, booking modal
│   ├── auth/                   # Login, reset password, contact helpdesk
│   ├── dashboard/              # Role-adaptive analytics & live clock
│   ├── doctors/                # Doctor directory, calendar, schedules
│   ├── notifications/          # Full notification center
│   ├── patients/               # Patient directory & registration form
│   └── settings/               # System preferences & profile settings
│
└── shared/                     # Reusable UI components & dynamic services
    ├── components/
    │   ├── confirm-dialog/     # Action confirmation dialog
    │   ├── empty-state/        # Empty visual placeholder
    │   ├── icon/               # Lucide SVG icon registry (OnPush)
    │   ├── modal/              # Modal container with content projection slots
    │   ├── page-header/        # Standard page banner header
    │   ├── pagination/         # Accessible table pagination controls
    │   ├── phone-input/        # International phone input
    │   ├── search-input/       # Search input with clear button
    │   ├── segmented-control/  # ARIA tablist pill switcher
    │   ├── stat-card/          # Metric KPI cards (OnPush)
    │   └── status-badge/       # Status badges (OnPush)
    └── services/
        └── confirm-dialog.service.ts # Dynamic dialog service (via createComponent)
```

---

## 💡 Junior Developer Quick Rules

1. **State with Signals**: Use `signal()` and `computed()` for UI state. Avoid unnecessary RxJS BehaviorSubjects for synchronous values.
2. **Never Use `new Component()`**: Use `<app-modal>` in templates or inject `ConfirmDialogService` for dynamic dialogs.
3. **Prevent Memory Leaks**: When subscribing to `router.events` or `route.queryParams`, always pipe `takeUntilDestroyed()`.
4. **Performance**:
   - Use `ChangeDetectionStrategy.OnPush` on all shared/presentational components.
   - Use `trackBy` in table loops (`*ngFor="let item of list(); trackBy: trackById"`).
   - Inject `API_BASE_URL` instead of hardcoding backend URLs.
5. **Quality Gates**: Always run `npm run lint` and `npm run format:check` before pushing.
