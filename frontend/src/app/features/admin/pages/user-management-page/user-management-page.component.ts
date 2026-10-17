import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AuthService } from "@core/services/auth.service";
import {
  AdminUserDto,
  RoleDto,
  UserRole,
  formatRoleDisplay,
} from "@core/models/auth.models";
import { PageHeaderComponent } from "@shared/components/page-header/page-header.component";
import { EmptyStateComponent } from "@shared/components/empty-state/empty-state.component";
import { IconComponent } from "@shared/components/icon/icon.component";
import { formatDateByPattern } from "@core/utils/date-utils";

@Component({
  selector: "app-user-management-page",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    EmptyStateComponent,
    IconComponent,
  ],
  template: `
    <div class="space-y-6">
      <app-page-header
        title="User & Access Directory"
        subtitle="Manage hospital accounts, role permissions, active status, and credential resets."
        iconName="user-cog"
      >
        <div actions>
          <button
            type="button"
            (click)="isCreateUserModalOpen.set(true)"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <app-icon name="user-plus" [size]="16"></app-icon>
            <span>Create Hospital User</span>
          </button>
        </div>
      </app-page-header>

      <!-- Feedback Toast -->
      <div
        *ngIf="feedback()"
        [class]="
          'p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ' +
          (feedback()?.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
            : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800')
        "
      >
        <span>{{ feedback()?.message }}</span>
        <button
          type="button"
          (click)="feedback.set(null)"
          class="cursor-pointer"
        >
          &times;
        </button>
      </div>

      <!-- Filter Controls Strip -->
      <div
        class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between"
      >
        <!-- Search bar -->
        <div class="relative flex-1 max-w-md">
          <app-icon
            name="search"
            [size]="16"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          ></app-icon>
          <input
            type="text"
            placeholder="Search users by name, username, email, or role..."
            [(ngModel)]="searchQuery"
            class="w-full pl-10 pr-9 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div class="flex items-center gap-2.5">
          <select
            [(ngModel)]="selectedRoleFilter"
            class="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option [ngValue]="undefined">All Roles</option>
            <option *ngFor="let r of roles()" [ngValue]="r.roleId">
              {{ r.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Users Table -->
      <div
        class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm table-fixed">
            <thead
              class="bg-slate-100/80 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700"
            >
              <tr>
                <th class="w-[28%] py-3 pl-4 pr-3">User & Contact</th>
                <th class="w-[20%] py-3 px-3">Role</th>
                <th class="w-[18%] py-3 px-3">Status</th>
                <th class="w-[18%] py-3 px-3">Created At</th>
                <th class="w-[16%] py-3 pr-4 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr *ngIf="loading()">
                <td
                  colspan="5"
                  class="py-12 text-center text-xs text-slate-400"
                >
                  Loading user directory...
                </td>
              </tr>
              <tr *ngIf="!loading() && filteredUsers().length === 0">
                <td colspan="5" class="py-12 text-center">
                  <app-empty-state
                    iconName="users"
                    title="No Users Found"
                    description="No accounts match your query or role filter."
                  ></app-empty-state>
                </td>
              </tr>
              <tr
                *ngFor="let u of filteredUsers()"
                class="hover:bg-indigo-50/50 dark:hover:bg-slate-800/80 transition-colors"
              >
                <td class="py-3.5 pl-4 pr-3 truncate">
                  <div class="font-bold text-slate-900 dark:text-white">
                    {{ u.fullName }}
                  </div>
                  <div
                    class="text-xs text-slate-500 dark:text-slate-400 truncate"
                  >
                    {{ u.email }} • @{{ u.username }}
                  </div>
                </td>
                <td class="py-3.5 px-3">
                  <span
                    class="inline-flex items-center gap-1 font-semibold text-xs text-indigo-600 dark:text-indigo-400"
                  >
                    <app-icon name="shield-check" [size]="12"></app-icon>
                    <span>{{ formatRole(u.roleName, u.roleId) }}</span>
                  </span>
                </td>
                <td class="py-3.5 px-3 whitespace-nowrap">
                  <span
                    [class]="
                      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ' +
                      (u.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400')
                    "
                  >
                    <span
                      [class]="
                        'w-1.5 h-1.5 rounded-full ' +
                        (u.isActive ? 'bg-emerald-500' : 'bg-slate-400')
                      "
                    ></span>
                    <span>{{ u.isActive ? "Active" : "Inactive" }}</span>
                  </span>
                </td>
                <td
                  class="py-3.5 px-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap"
                >
                  {{ formatDate(u.createdAt) }}
                </td>
                <td class="py-3.5 pr-4 pl-3 text-right whitespace-nowrap">
                  <div class="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      (click)="toggleActive(u)"
                      [title]="u.isActive ? 'Deactivate User' : 'Activate User'"
                      class="px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      {{ u.isActive ? "Deactivate" : "Activate" }}
                    </button>
                    <button
                      type="button"
                      (click)="openRoleModal(u)"
                      title="Change Role"
                      class="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <app-icon name="user-cog" [size]="16"></app-icon>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- CREATE USER MODAL -->
      <div
        *ngIf="isCreateUserModalOpen()"
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
      >
        <div
          class="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
        >
          <div
            class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3"
          >
            <h3 class="font-bold text-slate-900 dark:text-white text-base">
              Create Hospital User Account
            </h3>
            <button
              type="button"
              (click)="isCreateUserModalOpen.set(false)"
              class="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <app-icon name="x" [size]="18"></app-icon>
            </button>
          </div>

          <form (ngSubmit)="handleCreateUser()" class="space-y-3 text-xs">
            <div>
              <label
                class="block text-slate-700 dark:text-slate-300 font-semibold mb-1"
                >Full Name *</label
              >
              <input
                type="text"
                required
                [(ngModel)]="newUser.fullName"
                name="fullName"
                placeholder="Dr. Michael Scott"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label
                  class="block text-slate-700 dark:text-slate-300 font-semibold mb-1"
                  >Username *</label
                >
                <input
                  type="text"
                  required
                  [(ngModel)]="newUser.username"
                  name="username"
                  placeholder="mscott"
                  class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label
                  class="block text-slate-700 dark:text-slate-300 font-semibold mb-1"
                  >Email *</label
                >
                <input
                  type="email"
                  required
                  [(ngModel)]="newUser.email"
                  name="email"
                  placeholder="mscott@careflow.com"
                  class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label
                  class="block text-slate-700 dark:text-slate-300 font-semibold mb-1"
                  >Password *</label
                >
                <input
                  type="password"
                  required
                  [(ngModel)]="newUser.password"
                  name="password"
                  placeholder="••••••••"
                  class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label
                  class="block text-slate-700 dark:text-slate-300 font-semibold mb-1"
                  >Assign Role *</label
                >
                <select
                  [(ngModel)]="newUser.role"
                  name="role"
                  class="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option [ngValue]="UserRole.Receptionist">
                    Receptionist
                  </option>
                  <option [ngValue]="UserRole.Doctor">Doctor</option>
                  <option [ngValue]="UserRole.Nurse">Nurse</option>
                  <option [ngValue]="UserRole.HospitalManager">
                    Hospital Manager
                  </option>
                  <option [ngValue]="UserRole.Admin">Admin</option>
                </select>
              </div>
            </div>

            <div
              class="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800"
            >
              <button
                type="button"
                (click)="isCreateUserModalOpen.set(false)"
                class="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- CHANGE ROLE MODAL -->
      <div
        *ngIf="roleModalUser()"
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
      >
        <div
          class="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
        >
          <div
            class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3"
          >
            <h3 class="font-bold text-slate-900 dark:text-white text-base">
              Change System Role
            </h3>
            <button
              type="button"
              (click)="roleModalUser.set(null)"
              class="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <app-icon name="x" [size]="18"></app-icon>
            </button>
          </div>

          <p class="text-xs text-slate-500 dark:text-slate-400">
            Select a new authorization role for
            <strong>{{ roleModalUser()?.fullName }}</strong
            >.
          </p>

          <div>
            <label
              class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >Role</label
            >
            <select
              [(ngModel)]="newSelectedRoleId"
              class="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
            >
              <option *ngFor="let r of roles()" [ngValue]="r.roleId">
                {{ r.name }}
              </option>
            </select>
          </div>

          <div
            class="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800"
          >
            <button
              type="button"
              (click)="roleModalUser.set(null)"
              class="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="confirmRoleChange()"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
            >
              Save Role
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class UserManagementPageComponent implements OnInit {
  private authService = inject(AuthService);

  readonly users = signal<AdminUserDto[]>([]);
  readonly roles = signal<RoleDto[]>([]);
  readonly loading = signal(false);
  searchQuery = "";
  selectedRoleFilter?: number;

  readonly isCreateUserModalOpen = signal(false);
  readonly roleModalUser = signal<AdminUserDto | null>(null);
  newSelectedRoleId = 0;

  readonly feedback = signal<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  readonly UserRole = UserRole;

  newUser = {
    fullName: "",
    username: "",
    email: "",
    password: "",
    role: UserRole.Receptionist,
  };

  ngOnInit(): void {
    this.fetchUsers();
    this.authService.getRoles().subscribe((r) => this.roles.set(r));
  }

  fetchUsers(): void {
    this.loading.set(true);
    this.authService.getAdminUsers().subscribe({
      next: (data: AdminUserDto[]) => {
        this.users.set(data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  readonly filteredUsers = computed(() => {
    let list = this.users();
    const q = this.searchQuery.toLowerCase().trim();
    const roleId = this.selectedRoleFilter;

    if (roleId !== undefined) {
      list = list.filter(
        (u) => u.roleId === roleId || (u.role && u.role === roleId),
      );
    }

    if (q) {
      list = list.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.roleName || "").toLowerCase().includes(q),
      );
    }

    return list;
  });

  formatRole(roleName?: string, role?: string | number): string {
    return formatRoleDisplay(roleName, role);
  }

  formatDate(iso?: string): string {
    if (!iso) return "";
    return formatDateByPattern(iso, "MMM dd, yyyy");
  }

  toggleActive(u: AdminUserDto): void {
    this.authService.toggleUserStatus(u.userId, !u.isActive).subscribe({
      next: () => {
        this.feedback.set({
          type: "success",
          message: `User ${u.fullName} is now ${!u.isActive ? "Active" : "Inactive"}.`,
        });
        this.fetchUsers();
      },
      error: () => {
        this.feedback.set({
          type: "error",
          message: "Failed to update user active status.",
        });
      },
    });
  }

  openRoleModal(u: AdminUserDto): void {
    this.roleModalUser.set(u);
    this.newSelectedRoleId = typeof u.role === "number" ? u.role : u.roleId;
  }

  confirmRoleChange(): void {
    const user = this.roleModalUser();
    if (!user) return;

    this.authService
      .changeUserRole(user.userId, this.newSelectedRoleId)
      .subscribe({
        next: () => {
          this.roleModalUser.set(null);
          this.feedback.set({
            type: "success",
            message: "User role updated successfully!",
          });
          this.fetchUsers();
        },
        error: () => {
          this.feedback.set({
            type: "error",
            message: "Failed to update user role.",
          });
        },
      });
  }

  handleCreateUser(): void {
    this.authService
      .register({
        fullName: this.newUser.fullName.trim(),
        username: this.newUser.username.trim(),
        email: this.newUser.email.trim(),
        password: this.newUser.password,
        role: this.newUser.role,
      })
      .subscribe({
        next: () => {
          this.isCreateUserModalOpen.set(false);
          this.feedback.set({
            type: "success",
            message: `Account for ${this.newUser.fullName} created successfully!`,
          });
          this.newUser = {
            fullName: "",
            username: "",
            email: "",
            password: "",
            role: UserRole.Receptionist,
          };
          this.fetchUsers();
        },
        error: (err) => {
          this.feedback.set({
            type: "error",
            message: err?.error?.message || "Failed to create user account.",
          });
        },
      });
  }
}
