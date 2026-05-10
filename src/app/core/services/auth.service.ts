import { Injectable, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { Observable, tap, catchError, throwError, of, map } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<User | null>(null);
  private isAuthenticated = signal(false);

  readonly user = computed(() => this.currentUser());
  readonly authenticated = computed(() => this.isAuthenticated());

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    // Check for stored token on init
    this.checkAuthStatus();

    // Persist auth state changes
    effect(() => {
      const user = this.currentUser();
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
      }
    });
  }

  private checkAuthStatus(): void {
    const token = localStorage.getItem('access_token');
    const userJson = localStorage.getItem('user');

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      } catch {
        this.logout();
      }
    }
  }

  login(credentials: LoginCredentials): Observable<User> {
    return this.apiService.post<{ user: User; token: string }>('/auth/login', credentials).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.token);
        this.currentUser.set(response.user);
        this.isAuthenticated.set(true);
      }),
      map(response => response.user),
      catchError(error => throwError(() => error))
    );
  }

  register(data: RegisterData): Observable<User> {
    return this.apiService.post<{ user: User; token: string }>('/auth/register', data).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.token);
        this.currentUser.set(response.user);
        this.isAuthenticated.set(true);
      }),
      map(response => response.user),
      catchError(error => throwError(() => error))
    );
  }

  logout(): void {
    this.apiService.post('/auth/logout', {}).pipe(
      catchError(() => of(null))
    ).subscribe(() => {
      this.currentUser.set(null);
      this.isAuthenticated.set(false);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      this.router.navigate(['/']);
    });
  }

  refreshUser(): Observable<User> {
    return this.apiService.get<User>('/auth/me').pipe(
      tap(user => {
        this.currentUser.set(user);
      }),
      catchError(error => {
        if (error.code === 'UNAUTHORIZED') {
          this.logout();
        }
        return throwError(() => error);
      })
    );
  }

  hasRole(role: User['role']): boolean {
    return this.currentUser()?.role === role;
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  isModerator(): boolean {
    return this.hasRole('moderator') || this.hasRole('admin');
  }
}
