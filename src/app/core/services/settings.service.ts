import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';

export interface SiteSettings {
  eventsEnabled: boolean;
}

export interface SiteSettingsUpdate {
  eventsEnabled: boolean;
}

/**
 * Runtime public feature toggles from the api-service.
 * The admin dashboard toggles eventsEnabled, which controls public visibility
 * of the Events navigation and routes.
 */
@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/settings`;

  private eventsEnabled = signal<boolean>(true);
  private loading = signal<boolean>(false);

  readonly eventsEnabled$ = this.eventsEnabled.asReadonly();
  readonly loading$ = this.loading.asReadonly();

  /**
   * Load public site settings on app startup. Defaults to events enabled
   * (current behavior) so the menu never flashes hidden on first paint.
   */
  load(): Promise<void> {
    this.loading.set(true);
    return new Promise((resolve) => {
      this.http.get<SiteSettings>(this.baseUrl).pipe(
        tap({
          next: (settings) => {
            this.eventsEnabled.set(settings.eventsEnabled);
            this.loading.set(false);
            resolve();
          },
          error: () => {
            // Fail safe: keep events enabled if the API is unreachable
            this.loading.set(false);
            resolve();
          }
        })
      ).subscribe();
    });
  }

  /**
   * Admin-only: update the public Events visibility toggle.
   */
  updateEventsEnabled(enabled: boolean): Observable<SiteSettings> {
    this.loading.set(true);
    return this.http.put<SiteSettings>(this.baseUrl, { eventsEnabled: enabled }).pipe(
      tap({
        next: (settings) => {
          this.eventsEnabled.set(settings.eventsEnabled);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      })
    );
  }
}
