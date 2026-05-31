import { Injectable, signal, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
  displayName?: string;
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
  private platformId = inject(PLATFORM_ID);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private get isBrowser(): boolean { return isPlatformBrowser(this.platformId); }

  private currentUser = signal<User | null>(null);
  private isAuthenticated = signal(false);

  readonly user = computed(() => this.currentUser());
  readonly authenticated = computed(() => this.isAuthenticated());

  constructor() {
    this.checkAuthStatus();

    effect(() => {
      if (!this.isBrowser) return;
      const user = this.currentUser();
      if (user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      } else {
        Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
      }
    });
  }

  private checkAuthStatus(): void {
    if (!this.isBrowser) return;
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
    return this.isBrowser ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null;
  }

  getRefreshToken(): string | null {
    return this.isBrowser ? localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) : null;
  }

  login(credentials: LoginCredentials): Observable<User> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap(resp => this.storeTokens(resp)),
      map(resp => resp.user!),
      catchError(err => throwError(() => err))
    );
  }

  register(data: RegisterData): Observable<User> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, data).pipe(
      tap(resp => this.storeTokens(resp)),
      map(resp => resp.user!),
      catchError(err => throwError(() => err))
    );
  }

  /**
   * Called by HTTP interceptor when an API call returns 401.
   * Exchanges refresh token for a new access token.
   */
  refreshAccessToken(): Observable<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }
    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, { refreshToken }).pipe(
      tap(resp => {
        if (this.isBrowser) {
          localStorage.setItem(STORAGE_KEYS.ID_TOKEN, resp.idToken);
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, resp.accessToken);
        }
        // refreshToken stays the same
      }),
      map(resp => resp.accessToken)
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
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEYS.ID_TOKEN, resp.idToken);
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, resp.accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, resp.refreshToken);
    }
    if (resp.user) {
      this.currentUser.set(resp.user);
      this.isAuthenticated.set(true);
    }
  }
}
