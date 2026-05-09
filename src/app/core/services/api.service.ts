import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, catchError, map, retry } from 'rxjs';

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string[]>;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_BASE_URL = 'https://api.pmstusnepal.com/v1';
  private isLoading = signal(false);

  constructor(private http: HttpClient) {}

  get loading() {
    return this.isLoading.asReadonly();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let apiError: ApiError;

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      apiError = {
        message: error.error.message,
        code: 'CLIENT_ERROR'
      };
    } else {
      // Server-side error
      apiError = {
        message: error.error?.message || 'An unexpected error occurred',
        code: error.error?.code || `HTTP_${error.status}`,
        details: error.error?.details
      };
    }

    return throwError(() => apiError);
  }

  get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Observable<T> {
    this.isLoading.set(true);

    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        httpParams = httpParams.set(key, String(value));
      });
    }

    return this.http.get<T>(`${this.API_BASE_URL}${endpoint}`, {
      headers: this.getHeaders(),
      params: httpParams
    }).pipe(
      retry(1),
      catchError(this.handleError),
      map(response => {
        this.isLoading.set(false);
        return response;
      })
    );
  }

  post<T>(endpoint: string, body: unknown): Observable<T> {
    this.isLoading.set(true);

    return this.http.post<T>(`${this.API_BASE_URL}${endpoint}`, body, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError),
      map(response => {
        this.isLoading.set(false);
        return response;
      })
    );
  }

  put<T>(endpoint: string, body: unknown): Observable<T> {
    this.isLoading.set(true);

    return this.http.put<T>(`${this.API_BASE_URL}${endpoint}`, body, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError),
      map(response => {
        this.isLoading.set(false);
        return response;
      })
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    this.isLoading.set(true);

    return this.http.delete<T>(`${this.API_BASE_URL}${endpoint}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError),
      map(response => {
        this.isLoading.set(false);
        return response;
      })
    );
  }
}
