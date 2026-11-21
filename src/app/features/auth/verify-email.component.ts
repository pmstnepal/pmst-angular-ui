import { Component, signal, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

/**
 * Confirms a sign-up with the 6-digit code Cognito emails.
 *
 * Reached from /register (which no longer logs the user in) and from /login
 * when the backend returns USER_NOT_CONFIRMED. The email arrives as a query
 * param so the user does not have to retype it.
 */
@Component({
  selector: 'pmst-verify-email',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div class="max-w-md w-full space-y-8">
        <div class="text-center">
          <h2 class="text-3xl font-bold text-gray-900">Verify your email</h2>
          <p class="mt-2 text-gray-600">
            We sent a 6-digit code to
            <span class="font-medium text-gray-900">{{ email() || 'your email address' }}</span>.
            Enter it below to activate your account.
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
          @if (notice()) {
            <div class="rounded-md bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">{{ notice() }}</div>
          }

          <form class="mt-6 space-y-5" (ngSubmit)="onSubmit()">
            @if (!emailFromLink()) {
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input id="email" name="email" type="email" required [(ngModel)]="emailInput"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                       placeholder="you@example.com">
              </div>
            }

            <div>
              <label for="code" class="block text-sm font-medium text-gray-700 mb-1">Verification code</label>
              <input id="code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code"
                     required maxlength="6" [(ngModel)]="code"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg tracking-[0.4em] text-center text-lg
                            focus:ring-2 focus:ring-indigo-500"
                     placeholder="000000">
            </div>

            <button type="submit" [disabled]="loading()"
                    class="pmst-btn-primary w-full flex justify-center disabled:opacity-50">
              {{ loading() ? 'Verifying…' : 'Verify email' }}
            </button>
          </form>

          <div class="text-center text-sm text-gray-600 space-y-2">
            <p>
              Didn't get it? Check spam, then
              <button type="button" (click)="onResend()" [disabled]="resending()"
                      class="text-indigo-600 hover:text-indigo-500 font-medium disabled:opacity-50">
                {{ resending() ? 'sending…' : 'resend the code' }}
              </button>
            </p>
            <p><a routerLink="/login" class="text-gray-500 hover:text-gray-700">Back to sign in</a></p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [``]
})
export class VerifyEmailComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = signal<string>('');
  emailFromLink = signal<boolean>(false);
  emailInput = '';
  code = '';

  loading = signal(false);
  resending = signal(false);
  error = signal<string | null>(null);
  notice = signal<string | null>(null);
  success = signal<string | null>(null);

  ngOnInit(): void {
    const e = this.route.snapshot.queryParamMap.get('email');
    if (e) {
      this.email.set(e);
      this.emailInput = e;
      this.emailFromLink.set(true);
    }
  }

  private currentEmail(): string {
    return (this.emailFromLink() ? this.email() : this.emailInput).trim();
  }

  onSubmit(): void {
    const email = this.currentEmail();
    if (!email || !this.code.trim()) {
      this.error.set('Enter your email and the 6-digit code.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.notice.set(null);

    this.auth.confirmSignUp(email, this.code.trim()).subscribe({
      next: res => {
        this.loading.set(false);
        this.success.set(res?.message || 'Email verified. You can now log in.');
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Could not verify that code.');
      }
    });
  }

  onResend(): void {
    const email = this.currentEmail();
    if (!email) {
      this.error.set('Enter your email first.');
      return;
    }
    this.resending.set(true);
    this.error.set(null);
    this.auth.resendCode(email).subscribe({
      // The backend answers identically whether or not a pending sign-up
      // exists, so this message must not imply the address was found.
      next: res => {
        this.resending.set(false);
        this.notice.set(res?.message || 'If that email has a pending sign-up, a new code is on its way.');
      },
      error: () => {
        this.resending.set(false);
        this.notice.set('If that email has a pending sign-up, a new code is on its way.');
      }
    });
  }
}
