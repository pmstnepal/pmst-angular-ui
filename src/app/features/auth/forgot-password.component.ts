import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

/**
 * Step 1 of password reset: ask Cognito to email a code.
 *
 * The backend answers with the same message whether or not the address has an
 * account, so this screen must never state that an email "was found" — doing so
 * would turn it into an account-enumeration oracle.
 */
@Component({
  selector: 'pmst-forgot-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div class="max-w-md w-full space-y-8">
        <div class="text-center">
          <h2 class="text-3xl font-bold text-gray-900">Reset your password</h2>
          <p class="mt-2 text-gray-600">
            Enter your email and we'll send a code to reset your password.
          </p>
        </div>

        @if (sent()) {
          <div class="rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-800">
            {{ sent() }}
          </div>
          <a [routerLink]="['/reset-password']" [queryParams]="{ email: email }"
             class="pmst-btn-primary w-full flex justify-center">
            I have a code
          </a>

          <!-- Most PMST accounts were migrated from WordPress and have no login
               identity yet. A reset for those addresses genuinely sends nothing,
               and the message above cannot say so without revealing which
               addresses are registered. Tell everyone the remedy instead. -->
          <div class="rounded-md bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
            <p class="font-medium mb-1">No code after a few minutes?</p>
            <p>
              Check your spam folder first — messages come from
              <span class="font-mono">no-reply&#64;verificationemail.com</span>.
            </p>
            <p class="mt-2">
              If you had an account on the old site but have never signed in here, you still need to
              <a routerLink="/register" class="font-medium underline">create your login</a>
              using that same email address. Your articles and role carry over.
            </p>
          </div>
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

            <button type="submit" [disabled]="loading()"
                    class="pmst-btn-primary w-full flex justify-center disabled:opacity-50">
              {{ loading() ? 'Sending…' : 'Send reset code' }}
            </button>
          </form>
        }

        <p class="text-center text-sm text-gray-600">
          <a routerLink="/login" class="text-indigo-600 hover:text-indigo-500 font-medium">Back to sign in</a>
        </p>
      </div>
    </div>
  `,
  styles: [``]
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  loading = signal(false);
  error = signal<string | null>(null);
  sent = signal<string | null>(null);

  onSubmit(): void {
    const email = this.email.trim();
    if (!email) {
      this.error.set('Enter your email address.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    this.auth.forgotPassword(email).subscribe({
      next: res => {
        this.loading.set(false);
        this.sent.set(res?.message || 'If that email has an account, a reset code is on its way.');
      },
      error: err => {
        this.loading.set(false);
        if (err?.status === 429) {
          this.error.set(err?.error?.message || 'Too many attempts. Please wait and try again.');
          return;
        }
        // Any other failure still gets the neutral message — the endpoint must
        // not reveal whether the address exists.
        this.sent.set('If that email has an account, a reset code is on its way.');
      }
    });
  }
}
