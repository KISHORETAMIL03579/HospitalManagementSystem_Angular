# CareFlow HMS — React 19 to Angular 21 Migration Checklist

This checklist tracks the complete migration of the CareFlow Hospital Management System from **React 19** to **Angular 21** (Standalone Architecture, Angular Signals, Typed Reactive Forms, Modern Control Flow, HttpClient Interceptors, Tailwind CSS v4, and Lucide Icons).

---

## 📋 Architectural & Tooling Migration
- [x] Angular 21 CLI & Core setup (`@angular/core@^21.2.0`, `@angular/router`, `@angular/forms`, `@angular/common`, `@angular/build`)
- [x] Standalone Component architecture (no legacy NgModules)
- [x] Signal-based state management (`signal`, `computed`, `effect`)
- [x] Modern Control Flow syntax (`@if`, `@else`, `@for`, `@switch`, `@case`)
- [x] Modern `provideHttpClient(withInterceptors([authInterceptor]))`
- [x] Functional Route Guards (`authGuard`, `roleGuard`)
- [x] Tailwind CSS v4 styling configuration with custom CSS theme variables, dark mode (`.dark`), compact mode, and responsive layout
- [x] Lucide icons system for Angular 21
- [x] International Phone formatting & E.164 normalization
- [x] Root package scripts synchronization (`npm start`, `npm run dev`, `npm run build`, `npm run format:frontend`)

---

## 🗂️ Data Contracts, Enums & DTOs
- [x] **Auth DTOs & Enums**:
  - `UserRole` (Admin=100, HospitalManager=90, Doctor=80, Pharmacist=75, LabTechnician=70, Nurse=60, Receptionist=40, Patient=20)
  - `UserDto`, `RoleDto`, `AuthResponse`, `LoginRequest`, `RegisterUserRequest`, `UpdateProfileRequest`, `ChangePasswordRequest`
  - `AdminUserDto`, `StaffRegistrationRequest`, status helper functions (`isPendingStatus`, `isApprovedStatus`, `isRejectedStatus`)
  - `formatRoleDisplay` utility mapping
- [x] **Patient DTOs & Enums**:
  - `Gender` (Male=1, Female=2, Other=3, Unspecified=4)
  - `BloodGroup` (Unknown=0, APositive=1, ANegative=2, BPositive=3, BNegative=4, ABPositive=5, ABNegative=6, OPositive=7, ONegative=8)
  - `PatientDto`, `CreatePatientRequest`, `PatientListResponse`
- [x] **Doctor DTOs & Enums**:
  - `DoctorDto`, `DepartmentDto`, `CreateDoctorRequest`, `TimeSlotDto`, `DoctorAvailabilityDto`, `DoctorDirectoryItemDto`
  - `DoctorScheduleDto`, `SaveDoctorScheduleDto`, `ScheduleExceptionType`, `DoctorScheduleExceptionDto`, `CreateDoctorScheduleExceptionDto`
  - `ConflictCheckResultDto`, `ConflictingAppointmentDto`
- [x] **Appointment DTOs & Enums**:
  - `AppointmentStatus` (Pending=0, Confirmed=10, CheckedIn=20, InConsultation=30, Completed=40, Cancelled=50, NoShow=60)
  - `AppointmentDto`, `CreateAppointmentRequest`, `UpdateAppointmentStatusRequest`
- [x] **Notification DTOs**:
  - `NotificationCategory`, `NotificationPriority`, `NotificationItem`, `NotificationPreferences`

---

## 🌐 Services & HTTP Interceptors
- [x] **AuthInterceptor**: Automatic Bearer token attachment (`hms_token`), 401 Unauthorized handling & storage cleanup
- [x] **AuthService**:
  - User authentication (`login`, `logout`, `getCurrentUser`, `refreshToken`)
  - Role verification & hierarchy checks (`hasRole`, `isStaff`, `isPatient`, `isAdmin`)
  - Profile updates (`updateProfile`, `changePassword`, `forgotPassword`, `resetPassword`)
  - Staff onboarding submissions & status verification (`submitStaffRegistration`, `getRegistrationStatus`)
  - Admin user management (`getAllAdminUsers`, `createAdminUser`, `updateAdminUser`, `updateAdminUserRole`, `toggleAdminUserStatus`, `deleteAdminUser`)
  - Staff approval operations (`getStaffRequests`, `getStaffRequestById`, `approveStaffRequest`, `rejectStaffRequest`, `updateStaffRequest`, `retryStaffEmail`)
- [x] **PatientService**:
  - `getPatients(search, page, pageSize)`
  - `getPatientById(id)`
  - `createPatient(data)`
  - `getMyProfile()`
- [x] **DoctorService**:
  - `getDoctors(departmentId)`
  - `getDoctorDirectory(departmentId, search, date)`
  - `getDoctorById(id)`
  - `getDoctorAvailability(id, date)`
  - `getDoctorSchedules(id)`, `saveDoctorSchedules(id, schedules)`
  - `getDoctorExceptions(id, fromDate, toDate)`, `checkConflicts(id, dto)`, `createDoctorException(id, dto)`, `deleteDoctorException(id, exceptionId)`
  - `getDepartments()`, `createDoctor(data)`
- [x] **AppointmentService**:
  - `getAppointments(patientId, doctorId, date)`
  - `getAppointmentById(id)`
  - `createAppointment(data)`
  - `updateStatus(id, data)`
- [x] **NotificationService**:
  - Live signal-based reactive notifications list (`activeList`, `archivedList`, `unreadCount`, `urgentCount`)
  - LocalStorage persistence per user
  - Actions: `markAsRead`, `markAsUnread`, `markAllAsRead`, `archiveNotification`, `unarchiveNotification`, `deleteNotification`, `clearAllRead`, `updatePreferences`
- [x] **SettingsService**:
  - Signal-based preferences (`timeFormat`, `timeZone`, `theme`, `dateFormat`, `language`, `fontSize`, `density`)
  - DOM class manipulation (`dark`, `compact-mode`, dynamic font sizing)
  - Real-time time & date formatting utilities matching hospital timezones

---

## 🧩 Shared & Common Components
- [x] **PageHeaderComponent**:
  - Title, subtitle, icon with customizable container background
  - Action buttons slot, badge slot, default vs banner layouts
- [x] **StatusBadgeComponent**:
  - Appointment statuses (Pending, Confirmed, Checked In, In Consultation, Completed, Cancelled, No Show)
  - Staff approval statuses (Pending, Approved, Rejected)
  - Email dispatch statuses (Sent, Queued, Failed, Retrying)
  - Active/Inactive account badges
  - Generic color variants (success, warning, danger, info, purple, neutral)
- [x] **EmptyStateComponent**:
  - Customizable icon, heading, descriptive message, action button slot
- [x] **PhoneNumberInputComponent**:
  - Country selection with standard dial codes
  - E.164 normalization and validation
  - Responsive dark/light styling
- [x] **NotificationBellComponent**:
  - Header bell icon with pulsating unread counter badge
  - Dropdown popover list with time-ago formatting, priority badges, category icons
  - Quick "Mark all read" and navigate to full notification or target action URL

---

## 🏛️ Application Layout & Navigation
- [x] **AppLayoutComponent**:
  - Collapsible desktop sidebar + mobile sliding drawer with overlay
  - Dynamic navigation items filtered by RBAC user role
  - Expandable Administration submenu with auto-expansion for `/admin/*` routes
  - Coming Soon indicators for disabled modules (Prescriptions, Laboratory, Billing)
  - User footer with avatar initials, full name, role badge, and sign-out button
  - Header with mobile hamburger toggle, live route breadcrumbs, notification bell, and dark mode toggle button
  - Main router outlet `<router-outlet>`

---

## 📱 Feature Pages & Modals
- [x] **Authentication**:
  - `LoginPageComponent`: Split-screen healthcare branding, Sign In / Create Account tabs, Remember Me, Forgot Password modal, Registration Status modal, inactive/pending/rejected/invalid credential alerts
  - `ResetPasswordPageComponent`: Token & email validation, interactive password strength meter, confirm password check, success banner
  - `ContactPageComponent`: Hospital administration & IT helpdesk cards, emergency lines, office hours
  - `RegistrationStatusModalComponent`: Search by email, application timeline, review status alerts
- [x] **Dashboard**:
  - `DashboardPageComponent`:
    - Role-adaptive welcome banner (Patient Portal vs Hospital Operating System)
    - Live real-time digital clock widget syncing with settings timezone
    - Metric cards (Total Patients/My Appointments, Today's Visits, Doctors on Duty, Clinical Departments)
    - Data tables (Recent Patient Registrations for Staff, My Scheduled Consultations for Patients)
    - Recent appointments sidebar and Quick Operations grid
- [x] **Patients**:
  - `PatientListPageComponent`: Role-adaptive (Patient Directory for Staff with full search & table vs My Health Profile EMR card for Patients)
  - `PatientTableComponent`: Search by MRN/name/phone, column sorting (MRN, Name, DOB, Gender, Created Date), pagination, row 3-dot action menu (book appointment, view history), patient details modal
  - `PatientCreatePageComponent` & `PatientFormComponent`: Demographics, DOB past validation, blood group, international phone, emergency contact
- [x] **Doctors**:
  - `DoctorListPageComponent`: Search by doctor/specialty/license, department filter tabs, column sorting, pagination, doctor cards with availability badge, fee, ratings, experience, 3-dot action menu
  - `DoctorDetailsModalComponent`: Complete doctor profile, credentials, languages, embedded interactive calendar view
  - `DoctorCalendarViewComponent`: 7-day quick picker, day navigation, session-grouped slot status badges
  - `DoctorScheduleModalComponent`: Weekly recurring schedule editor, standard weekdays template autofill, leaves/exceptions manager with live appointment conflict check
  - `DoctorAvailabilityBadgeComponent`: Real-time status badges (Available, Limited Slots, Booked, On Leave, Offline)
- [x] **Appointments**:
  - `AppointmentListPageComponent`: Search by patient/doctor/MRN/reason, filters for Doctor, Status, and Date; column sorting; pagination; status change actions (Confirm, Check In, Start Consultation, Complete, Cancel, No-Show); details modal
  - `BookingModalComponent`: Patient selection (with auto-detect for Patient role), doctor selection, appointment date, live bookable slot selector from doctor availability, reason, notes
- [x] **Administration**:
  - `AdminDashboardPageComponent`: Health monitoring for API, Database, JWT Auth, Email Dispatcher; pending approvals alert banner; security governance card; management module quick links
  - `StaffApprovalPageComponent`: Tabs (Pending, Approved, Rejected, All); summary metrics cards; full table with invitation code, submission date, status; application details modal; authorization modal; rejection modal; edit modal; email retry action
  - `UserManagementPageComponent`: System users table with active/inactive/pending tabs, search & role filter, add new user modal, edit user modal, change role modal, toggle active/inactive status, delete user confirmation
- [x] **Settings**:
  - `SettingsPageComponent`: Profile tab (save to backend & local storage), Appearance tab (light/dark/system theme, font size, density), Regional tab (time format 12/24, timezone, date format, language), Notifications tab (email/in-app toggles, categories), Security tab (change password, 2FA toggle, auto-logout), Preferences tab (default dashboard, table rows), About tab (hospital system info)
- [x] **Notifications**:
  - `NotificationPageComponent`: Tabs (All, Unread, Read, Urgent, Archived), category & priority filters, date range filters, search, mark read/unread, archive/unarchive, delete, clear read, notification preferences modal

---

## 🧪 Verification & Build
- [x] All TypeScript compiler checks pass (`ng build`)
- [x] Code formatting & linting checks pass
- [x] Root npm scripts execute seamlessly (`npm start`, `npm run dev`, `npm run build`)
- [x] Visual verification of theme switching, responsiveness, routing, and backend API integration
