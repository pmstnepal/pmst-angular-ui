import { Component, OnInit, computed, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { UserService, UserDto, PageResponse } from '../../services/user.service';
import { AuthService } from '../../core/services/auth.service';

type Role = 'admin' | 'moderator' | 'user';

@Component({
  selector: 'pmst-user-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="user-management py-8">
      <div class="container mx-auto px-4 max-w-4xl">
        <div class="flex items-center justify-between mb-8">
          <div>
            <a routerLink="/dashboard" class="text-sm text-indigo-600 hover:underline">&larr; Dashboard</a>
            <h1 class="text-3xl font-bold text-gray-900 mt-1">User Management</h1>
          </div>
        </div>

        <div class="mb-6">
          <input
            type="text"
            placeholder="Search users by email or username..."
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            class="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
        </div>

        @if (loadError()) {
          <div class="mb-4 px-4 py-3 rounded-lg text-sm font-medium bg-red-100 text-red-800">
            {{ loadError() }}
          </div>
        }

        @if (actionMessage()) {
          <div class="mb-4 px-4 py-3 rounded-lg text-sm font-medium"
               [class.bg-green-100]="!actionIsError()" [class.text-green-800]="!actionIsError()"
               [class.bg-red-100]="actionIsError()" [class.text-red-800]="actionIsError()">
            {{ actionMessage() }}
          </div>
        }

        <div class="bg-white rounded-lg shadow overflow-hidden">
          @if (loading()) {
            <div class="p-12 text-center text-gray-400">Loading users...</div>
          } @else if (filteredUsers().length === 0) {
            <div class="p-12 text-center text-gray-400">No users found</div>
          } @else {
            <table class="w-full text-sm">
              <thead class="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th class="px-4 py-3">Email</th>
                  <th class="px-4 py-3">Username</th>
                  <th class="px-4 py-3">Display Name</th>
                  <th class="px-4 py-3">Role</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (user of filteredUsers(); track user.id) {
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3">{{ user.email }}</td>
                    <td class="px-4 py-3">{{ user.username }}</td>
                    <td class="px-4 py-3">{{ user.displayName || '-' }}</td>
                    <td class="px-4 py-3 capitalize">{{ user.role }}</td>
                    <td class="px-4 py-3">
                      @if (isActive(user)) {
                        <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                      } @else {
                        <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">Deactivated</span>
                      }
                    </td>
                    <td class="px-4 py-3">
                      @if (user.id === currentUserId()) {
                        <span class="text-xs text-gray-400">(You)</span>
                      } @else {
                        <div class="flex items-center gap-2 flex-wrap">
                          <select
                            [ngModel]="user.role"
                            (ngModelChange)="changeRole(user, $event)"
                            [disabled]="savingId() === user.id"
                            class="border border-gray-300 rounded px-2 py-1 text-sm">
                            <option value="admin">Admin</option>
                            <option value="moderator">Moderator</option>
                            <option value="user">User</option>
                          </select>

                          <button type="button"
                                  (click)="toggleStatus(user)"
                                  [disabled]="savingId() === user.id"
                                  class="px-2 py-1 rounded text-xs font-medium border transition-colors disabled:opacity-50"
                                  [class.border-amber-300]="isActive(user)"
                                  [class.text-amber-700]="isActive(user)"
                                  [class.hover:bg-amber-50]="isActive(user)"
                                  [class.border-green-300]="!isActive(user)"
                                  [class.text-green-700]="!isActive(user)"
                                  [class.hover:bg-green-50]="!isActive(user)">
                            {{ isActive(user) ? 'Deactivate' : 'Reactivate' }}
                          </button>

                          <button type="button"
                                  (click)="deleteUser(user)"
                                  [disabled]="savingId() === user.id"
                                  class="px-2 py-1 rounded text-xs font-medium border border-red-300 text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50">
                            Delete
                          </button>
                        </div>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </div>
    </div>
  `,
  styles: [``]
})
export class UserManagementComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);

  users = signal<UserDto[]>([]);
  searchTerm = signal('');
  loading = signal(false);
  loadError = signal('');
  savingId = signal<string | null>(null);
  actionMessage = signal('');
  actionIsError = signal(false);

  readonly currentUserId = computed(() => this.authService.user()?.id ?? '');

  readonly filteredUsers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const all = this.users();
    if (!term) return all;
    return all.filter(u =>
      u.email?.toLowerCase().includes(term) ||
      u.username?.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.userService.listUsers().pipe(
      catchError(err => {
        const message = err?.error?.message || 'Failed to load users.';
        this.loadError.set(message);
        return of<PageResponse<UserDto>>({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 0 });
      })
    ).subscribe(response => {
      this.users.set(response.content);
      this.loading.set(false);
    });
  }

  changeRole(user: UserDto, newRole: Role): void {
    if (newRole === user.role) return;
    this.savingId.set(user.id);
    this.actionMessage.set('');
    this.userService.updateRole(user.id, newRole).pipe(
      catchError(err => {
        this.actionMessage.set(err?.error?.message || 'Failed to change role.');
        this.actionIsError.set(true);
        this.savingId.set(null);
        return of(null);
      })
    ).subscribe(result => {
      if (!result) return;
      this.users.update(list =>
        list.map(u => u.id === user.id ? { ...u, role: newRole } : u)
      );
      this.actionMessage.set(`Role updated to ${newRole}.`);
      this.actionIsError.set(false);
      this.savingId.set(null);
      setTimeout(() => this.actionMessage.set(''), 3000);
    });
  }

  /** Anything other than an explicit 'active' counts as deactivated. */
  isActive(user: UserDto): boolean {
    return (user.status || 'active').toLowerCase() === 'active';
  }

  /**
   * Deactivate / reactivate. Reversible and preferred over deletion — the row
   * stays, so the user's articles keep showing an author name. The backend
   * blocks the account at login.
   */
  toggleStatus(user: UserDto): void {
    const next: 'active' | 'deactivated' = this.isActive(user) ? 'deactivated' : 'active';
    if (next === 'deactivated' &&
        !confirm(`Deactivate ${user.email}?\n\nThey will not be able to log in. Their articles and galleries stay published, and you can reactivate them at any time.`)) {
      return;
    }
    this.savingId.set(user.id);
    this.actionMessage.set('');
    this.userService.updateStatus(user.id, next).pipe(
      catchError(err => {
        this.actionMessage.set(err?.error?.message || 'Failed to change account status.');
        this.actionIsError.set(true);
        this.savingId.set(null);
        return of(null);
      })
    ).subscribe(result => {
      if (!result) return;
      this.users.update(list => list.map(u => u.id === user.id ? { ...u, status: next } : u));
      this.actionMessage.set(next === 'active' ? `${user.email} reactivated.` : `${user.email} deactivated.`);
      this.actionIsError.set(false);
      this.savingId.set(null);
      setTimeout(() => this.actionMessage.set(''), 3000);
    });
  }

  /**
   * Permanent deletion. Deliberately spells out the consequence, because the
   * content survives but loses its author: articles/galleries/comments are
   * ON DELETE SET NULL, while the profile and follow records cascade away.
   */
  deleteUser(user: UserDto): void {
    const warning =
      `Permanently delete ${user.email}?\n\n` +
      `This cannot be undone.\n\n` +
      `• Their articles and galleries stay published, but lose the author name\n` +
      `• Their profile and follower connections are removed\n` +
      `• Their Cognito login is not removed here\n\n` +
      `To block access reversibly, use Deactivate instead.`;
    if (!confirm(warning)) return;

    this.savingId.set(user.id);
    this.actionMessage.set('');
    this.userService.deleteUser(user.id).pipe(
      catchError(err => {
        this.actionMessage.set(err?.error?.message || 'Failed to delete user.');
        this.actionIsError.set(true);
        this.savingId.set(null);
        return of(null);
      })
    ).subscribe(result => {
      if (!result) return;
      this.users.update(list => list.filter(u => u.id !== user.id));
      this.actionMessage.set(`${user.email} deleted.`);
      this.actionIsError.set(false);
      this.savingId.set(null);
      setTimeout(() => this.actionMessage.set(''), 4000);
    });
  }
}
