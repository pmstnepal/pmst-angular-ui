import { Component, signal, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

/**
 * Step 2 of password reset: supply the emailed code and a new password.
 *
 * Password rules are enforced by the Cognito pool (min 8, upper, lower, number,
 * symbol). They are restated here as guidance only — the authoritative error
 * comes back from Cognito via the backend, so this screen does not duplicate
 * the policy as client-side validation that could drift from it.
 */
@Component({
  selector: 'pmst-reset-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div class="max-w-md w-full space-y-8">
        <div class="text-center">
          <h2 class="text-3xl font-bold text-gray-900">Choose a new password</h2>
          <p class="mt-2 text-gray-600">
            Enter the code we emailed to
            <span class="font-medium text-gray-900">{{ email || 'your address' }}</span>
            and pick a new password.
          </p>
        </div>

        @if (success()) {
          <div class="rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-800">
            {{ success() }}
          </div>
          <a routerLink="/login" class="pmst-btn-primary w-full flex justify-center">Continue to sign in</a>
        } @else {
          @if (error()) {
            <div class="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">{{ error() }}</div>
          }

          <form class="mt-6 space-y-5" (ngSubmit)="onSubmit()">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input id="email" name="email" type="email" required [(ngModel)]="email"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                     placeholder="you@example.com">
            </div>

            <div>
              <label for="code" class="block text-sm font-medium text-gray-700 mb-1">Reset code</label>
              <input id="code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code"
                     required maxlength="6" [(ngModel)]="code"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg tracking-[0.4em] text-center text-lg
                            focus:ring-2 focus:ring-indigo-500"
                     placeholder="000000">
            </div>

            <div>
              <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input id="newPassword" name="newPassword" type="password" required [(ngModel)]="newPassword"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                     placeholder="••••••••">
              <p class="mt-1 text-xs text-gray-500">
                At least 8 characters, with an uppercase letter, a lowercase letter, a number and a symbol.
              </p>
            </div>

            <button type="submit" [disabled]="loading()"
                    class="pmst-btn-primary w-full flex justify-center disabled:opacity-50">
              {{ loading() ? 'Updating…' : 'Update password' }}
            </button>
          </form>

          <p class="text-center text-sm text-gray-600">
            Need a new code?
            <a routerLink="/forgot-password" class="text-indigo-600 hover:text-indigo-500 font-medium">Request another</a>
          </p>
        }
      </div>
    </div>
  `,
  styles: [``]
})
export class ResetPasswordComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  code = '';
  newPassword = '';

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  ngOnInit(): void {
    const e = this.route.snapshot.queryParamMap.get('email');
    if (e) this.email = e;
  }

  onSubmit(): void {
    if (!this.email.trim() || !this.code.trim() || !this.newPassword) {
      this.error.set('Enter your email, the code, and a new password.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    this.auth.resetPassword(this.email.trim(), this.code.trim(), this.newPassword).subscribe({
      next: res => {
        this.loading.set(false);
        this.success.set(res?.message || 'Password updated. You can now log in.');
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Could not reset the password.');
      }
    });
  }
}
