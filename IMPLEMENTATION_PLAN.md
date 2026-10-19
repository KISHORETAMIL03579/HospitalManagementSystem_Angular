# Hospital Management System (HMS) — Implementation Plan & Production Architecture

## 1. Overall System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 Angular 21 Standalone + TypeScript                          │
│                                                                             │
│   Angular Router │ Angular Signals │ Typed Reactive Forms │ Tailwind CSS v4 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / JSON (/api/v1)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ASP.NET Core Web API                              │
│                Authentication / Authorization / Middleware                   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HospitalManagement.Application                       │
│             Use Cases / Handlers / DTOs / Validators / Interfaces            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HospitalManagement.Domain                         │
│               Entities / Business Rules / Value Objects / Enums              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       ▲
                                       │
┌──────────────────────────────────────┴──────────────────────────────────────┐
│                       HospitalManagement.Infrastructure                     │
│            EF Core DbContext / Repositories / SQL Server Persistence        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
                            ┌───────────────────┐
                            │    SQL Server     │
                            └───────────────────┘
```

---

## 2. Refined Feature-Based Folder Structure

### Frontend (`frontend/src/`)
```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                  # Singleton services, interceptors, auth guards
│   │   ├── shared/                # Reusable UI components, pipes, directives
│   │   ├── layout/                # App shell, sidebar, topbar
│   │   ├── features/              # Feature modules (Domain, Application, Presentation)
│   │   │   ├── auth/              # Login, token storage, auth guards
│   │   │   ├── patients/          # Patient registration, directory table, search
│   │   │   ├── doctors/           # Doctor directory & schedules
│   │   │   ├── appointments/      # Calendar grid & booking modal
│   │   │   └── dashboard/         # Hospital statistics & quick actions
│   │   ├── app.routes.ts          # Lazy-loaded route definitions
│   │   └── app.config.ts          # Application providers (HttpClient, Interceptors)
│   ├── environments/
│   └── main.ts
```

### Backend (`HospitalManagement.slnx`)
```
HospitalManagement.sln
│
├── HospitalManagement.Api/            # Controllers, Program.cs, Middleware, Filters
│
├── HospitalManagement.Application/    # Business Modules (Patients, Doctors, Appointments, etc.)
│   ├── Patients/                      # Commands, Queries, Handlers, DTOs, Validators
│   ├── Doctors/
│   ├── Appointments/
│   ├── Common/                        # Interfaces (IRepository, IUnitOfWork), Exceptions
│   └── DependencyInjection.cs
│
├── HospitalManagement.Domain/         # Domain Entities, Enums, Rules
│   ├── Entities/                      # Patient, Doctor, Appointment
│   ├── ValueObjects/                  # MedicalRecordNumber, Address, Money
│   └── Common/                        # BaseEntity, AggregateRoot
│
├── HospitalManagement.Infrastructure/  # EF Core, Repositories, SQL Server DbContext
│   ├── Persistence/                   # HospitalDbContext, Configurations, Migrations
│   ├── Repositories/                  # PatientRepository, DoctorRepository
│   └── DependencyInjection.cs
│
└── HospitalManagement.Tests/          # Unit & Integration Tests (xUnit, Moq)
```

---

## 3. Milestone 1: Patient Registration End-to-End Vertical Slice

### Detailed Patient Registration Execution Flow

```
                RECEPTIONIST
                     │
                     ↓
          Angular Form (patient-create-page.component.ts)
                     │
                     ↓
         Typed Reactive Form Validation
                     │
                     ↓
        POST /api/v1/patients (HttpClient)
                     │
                     ↓
            ASP.NET Core API
       (Auth & Serilog Middleware)
                     │
                     ↓
        PatientController.Create()
                     │
                     ↓
       CreatePatientCommandHandler
                     │
                     ↓
         FluentValidation Check
                     │
                     ↓
       Patient Entity & Domain Rules
                     │
                     ↓
            IPatientRepository
                     │
                     ↓
      PatientRepository (EF Core)
                     │
                     ↓
               SQL Server
                     │
                     ↓
             Save Changes
                     │
                     ↓
        Return 201 Created (DTO)
                     │
                     ↓
        Signals / Observable Invalidation
                     │
                     ↓
     Angular UI Updates Patient List Table
```

---

## 4. 12-Phase Master Roadmap

```
PHASE 1  ──> Foundation (Clean Architecture + Angular 21 Standalone) [COMPLETED]
PHASE 2  ──> Authentication & Authorization (JWT + Role Guards)
PHASE 3  ──> Patient Vertical Slice [COMPLETED]
PHASE 4  ──> Doctor & Department Management
PHASE 5  ──> Appointment Scheduling Module
PHASE 6  ──> Clinical Encounters & EHR
PHASE 7  ──> Prescriptions & Laboratory Management
PHASE 8  ──> Billing & Invoicing Module
PHASE 9  ──> Production Hardening (Security, Observability, Audit) [COMPLETED]
PHASE 10 ──> Docker & CI/CD Pipeline
PHASE 11 ──> Staging Deployment & E2E Testing
PHASE 12 ──> Production Release & Monitoring
```

