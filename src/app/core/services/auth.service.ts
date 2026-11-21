import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  /**
   * Required by the Cognito pool, which declares given_name/family_name as
   * required attributes. Sign-up is rejected without them, and the constraint
   * cannot be relaxed without replacing the pool.
   */
  firstName: string;
  lastName: string;
  displayName?: string;
}

/** Sign-up no longer returns tokens — the account must be verified first. */
export interface SignUpResult {
  email: string;
  confirmed: boolean;
}

/**
 * Backend AuthResponse (matches AuthResponse.java).
 * Cognito returns 3 tokens; we store all three.
 */
interface AuthResponse {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: User | null;
}

const STORAGE_KEYS = {
  ID_TOKEN: 'id_token',
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user'
} as const;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private currentUser = signal<User | null>(null);
  private isAuthenticated = signal(false);

  readonly user = computed(() => this.currentUser());
  readonly authenticated = computed(() => this.isAuthenticated());

  constructor() {
    this.checkAuthStatus();

    effect(() => {
      const user = this.currentUser();
      if (user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      } else {
        Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
      }
    });
  }

  private checkAuthStatus(): void {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const userJson = localStorage.getItem(STORAGE_KEYS.USER);
    if (token && userJson) {
      try {
        this.currentUser.set(JSON.parse(userJson) as User);
        this.isAuthenticated.set(true);
      } catch {
        this.logoutLocal();
      }
    }
  }

  /** Used by the HTTP interceptor on each request. */
  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  /** Used by the HTTP interceptor for API Gateway's COGNITO_USER_POOLS authorizer, which expects the ID token. */
  getIdToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ID_TOKEN);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  login(credentials: LoginCredentials): Observable<User> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap(resp => this.storeTokens(resp)),
      map(resp => resp.user!),
      catchError(err => throwError(() => err))
    );
  }

  /**
   * Sign up. Deliberately does NOT store tokens or set the current user —
   * the backend now creates an UNCONFIRMED Cognito account and emails a code,
   * so there is nothing to log in with until /verify succeeds.
   */
  register(data: RegisterData): Observable<SignUpResult> {
    return this.http.post<SignUpResult>(`${this.baseUrl}/register`, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  /** Confirm sign-up with the 6-digit code from the email. */
  confirmSignUp(email: string, code: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/confirm`, { email, code });
  }

  /** Re-send the sign-up code. */
  resendCode(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/resend`, { email });
  }

  /**
   * Request a password-reset code. The backend always returns the same message
   * whether or not the address has an account, so callers must not treat the
   * response as proof the email exists.
   */
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/forgot-password`, { email });
  }

  /** Complete the reset with the emailed code and a new password. */
  resetPassword(email: string, code: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/reset-password`, { email, code, newPassword });
  }

  /**
   * Called by HTTP interceptor when an API call returns 401.
   * Exchanges refresh token for a new ID token (used to re-authorize the retried request)
   * and access token (stored for completeness, not sent to the API Gateway authorizer).
   */
  refreshAccessToken(): Observable<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }
    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, { refreshToken }).pipe(
      tap(resp => {
        localStorage.setItem(STORAGE_KEYS.ID_TOKEN, resp.idToken);
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, resp.accessToken);
        // refreshToken stays the same
      }),
      map(resp => resp.idToken)
    );
  }

  logout(): void {
    // Optional: call backend /auth/logout to revoke refresh token
    this.logoutLocal();
    this.router.navigate(['/']);
  }

  /** Clears local state without server call. Used by interceptor on refresh failure. */
  logoutLocal(): void {
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  refreshUser(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/me`).pipe(
      tap(user => this.currentUser.set(user)),
      catchError(err => {
        if (err.status === 401) this.logoutLocal();
        return throwError(() => err);
      })
    );
  }

  hasRole(role: User['role']): boolean {
    return this.currentUser()?.role === role;
  }

  isAdmin(): boolean { return this.hasRole('admin'); }
  isModerator(): boolean { return this.hasRole('moderator') || this.hasRole('admin'); }

  private storeTokens(resp: AuthResponse): void {
    localStorage.setItem(STORAGE_KEYS.ID_TOKEN, resp.idToken);
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, resp.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, resp.refreshToken);
    if (resp.user) {
      this.currentUser.set(resp.user);
      this.isAuthenticated.set(true);
    }
  }
}
