import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageResponse } from '../models';
import {
  TicketingEvent,
  EventRequest,
  TicketCategory,
  CategoryRequest,
  ApprovalLogEntry,
  EventStatus,
  ReservationRequest,
  ReservationResponse,
  TicketResponse
} from '../models/ticketing.model';

/**
 * Talks to the standalone pmst-ticketing-service (separate Lambda / host).
 * Uses environment.ticketingUrl — NOT apiUrl. The authInterceptor attaches the
 * Cognito bearer token automatically (shared pool with pmst-api-service).
 */
@Injectable({ providedIn: 'root' })
export class TicketingService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.ticketingUrl}/events`;

  // ---- Events: queries ----------------------------------------------------

  /** Public catalog — PUBLISHED events only. */
  listPublished(page = 0, size = 20): Observable<PageResponse<TicketingEvent>> {
    return this.http.get<PageResponse<TicketingEvent>>(this.baseUrl, { params: this.paged(page, size) });
  }

  /** Current creator's own events (any status). */
  listMine(page = 0, size = 50): Observable<PageResponse<TicketingEvent>> {
    return this.http.get<PageResponse<TicketingEvent>>(`${this.baseUrl}/mine`, { params: this.paged(page, size) });
  }

  /** ADMIN — all events, optionally filtered by status. */
  listAll(status?: EventStatus, page = 0, size = 50): Observable<PageResponse<TicketingEvent>> {
    let params = this.paged(page, size);
    if (status) params = params.set('status', status);
    return this.http.get<PageResponse<TicketingEvent>>(`${this.baseUrl}/admin/all`, { params });
  }

  getEvent(id: number): Observable<TicketingEvent> {
    return this.http.get<TicketingEvent>(`${this.baseUrl}/${id}`);
  }

  getEventBySlug(slug: string): Observable<TicketingEvent> {
    return this.http.get<TicketingEvent>(`${this.baseUrl}/slug/${slug}`);
  }

  approvals(id: number): Observable<ApprovalLogEntry[]> {
    return this.http.get<ApprovalLogEntry[]>(`${this.baseUrl}/${id}/approvals`);
  }

  // ---- Events: mutations --------------------------------------------------

  createEvent(payload: EventRequest): Observable<TicketingEvent> {
    return this.http.post<TicketingEvent>(this.baseUrl, payload);
  }

  updateEvent(id: number, payload: EventRequest): Observable<TicketingEvent> {
    return this.http.put<TicketingEvent>(`${this.baseUrl}/${id}`, payload);
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // ---- Events: workflow ---------------------------------------------------

  submit(id: number): Observable<TicketingEvent> {
    return this.http.post<TicketingEvent>(`${this.baseUrl}/${id}/submit`, {});
  }

  approve(id: number): Observable<TicketingEvent> {
    return this.http.post<TicketingEvent>(`${this.baseUrl}/${id}/approve`, {});
  }

  publish(id: number): Observable<TicketingEvent> {
    return this.http.post<TicketingEvent>(`${this.baseUrl}/${id}/publish`, {});
  }

  reject(id: number, reason: string): Observable<TicketingEvent> {
    return this.http.post<TicketingEvent>(`${this.baseUrl}/${id}/reject`, { reason });
  }


  // ---- Ticket categories --------------------------------------------------

  listCategories(eventId: number): Observable<TicketCategory[]> {
    return this.http.get<TicketCategory[]>(`${this.baseUrl}/${eventId}/categories`);
  }

  createCategory(eventId: number, payload: CategoryRequest): Observable<TicketCategory> {
    return this.http.post<TicketCategory>(`${this.baseUrl}/${eventId}/categories`, payload);
  }

  updateCategory(eventId: number, categoryId: number, payload: CategoryRequest): Observable<TicketCategory> {
    return this.http.put<TicketCategory>(`${this.baseUrl}/${eventId}/categories/${categoryId}`, payload);
  }

  deleteCategory(eventId: number, categoryId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${eventId}/categories/${categoryId}`);
  }

  // ---- Reservations / Tickets (free-only Phase 2 slice) --------------------

  createReservation(eventId: number, payload: ReservationRequest, idempotencyKey?: string): Observable<ReservationResponse> {
    let headers = new HttpHeaders();
    if (idempotencyKey) headers = headers.set('Idempotency-Key', idempotencyKey);
    return this.http.post<ReservationResponse>(`${this.baseUrl}/${eventId}/reservations`, payload, { headers });
  }

  confirmReservation(id: string): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(`${environment.ticketingUrl}/reservations/${id}/confirm`, {});
  }

  getReservation(id: string): Observable<ReservationResponse> {
    return this.http.get<ReservationResponse>(`${environment.ticketingUrl}/reservations/${id}`);
  }

  listMyReservations(): Observable<ReservationResponse[]> {
    return this.http.get<ReservationResponse[]>(`${environment.ticketingUrl}/reservations/mine`);
  }

  listMyTickets(): Observable<TicketResponse[]> {
    return this.http.get<TicketResponse[]>(`${environment.ticketingUrl}/tickets/mine`);
  }

  // ---- Helpers ------------------------------------------------------------

  private paged(page: number, size: number): HttpParams {
    return new HttpParams().set('page', String(page)).set('size', String(size));
  }
}
