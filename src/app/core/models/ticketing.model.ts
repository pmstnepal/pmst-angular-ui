/**
 * Ticketing models — mirror the pmst-ticketing-service DTOs
 * (EventResponse / EventRequest / CategoryResponse / CategoryRequest).
 * Money is integer cents + ISO currency code.
 */

export type EventStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
export type EventFormat = 'IN_PERSON' | 'ONLINE' | 'HYBRID';
export type AccessType = 'INHERIT' | 'IN_PERSON' | 'ONLINE';
export type CheckinStrategy = 'ONCE_PER_EVENT' | 'ONCE_PER_DAY';
export type ApprovalAction = 'SUBMIT' | 'APPROVE' | 'REJECT';

/** Matches EventResponse.java */
export interface TicketingEvent {
  id: number;
  slug: string;
  title: string;
  description?: string;
  status: EventStatus;
  format: EventFormat;
  venueName?: string;
  location?: string;
  timezone: string;
  startsAt?: string;
  endsAt?: string;
  currencyCode: string;
  createdBySub: string;
  pmstArticleId?: number | null;
  organizer?: string;
  imageUrl?: string;
  priceFromCts?: number | null;
  totalCapacity?: number | null;
  createdAt: string;
  updatedAt: string;
}

/** Matches EventRequest.java (status is controlled by the workflow, not the client) */
export interface EventRequest {
  title: string;
  description?: string;
  slug?: string;
  format?: EventFormat;
  venueName?: string;
  location?: string;
  timezone?: string;
  startsAt?: string;
  endsAt?: string;
  currencyCode?: string;
  pmstArticleId?: number | null;
  organizer?: string;
  imageUrl?: string;
}

/** Matches CategoryResponse.java */
export interface TicketCategory {
  id: number;
  eventId: number;
  name: string;
  description?: string;
  priceCts: number;
  currencyCode: string;
  maxTickets?: number | null;
  bounded: boolean;
  accessRestricted: boolean;
  accessType: AccessType;
  checkinStrategy: CheckinStrategy;
  salesStart?: string;
  salesEnd?: string;
  ordinal: number;
}

/** Matches CategoryRequest.java */
export interface CategoryRequest {
  name: string;
  description?: string;
  priceCts: number;
  currencyCode?: string;
  maxTickets?: number | null;
  bounded?: boolean;
  accessRestricted?: boolean;
  accessType?: AccessType;
  checkinStrategy?: CheckinStrategy;
  salesStart?: string;
  salesEnd?: string;
  ordinal?: number;
}

/** Matches ApprovalLogResponse.java */
export interface ApprovalLogEntry {
  id: number;
  eventId: number;
  action: ApprovalAction;
  actorSub: string;
  reason?: string;
  createdAt: string;
}

export type ReservationStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
export type TicketStatus = 'ACQUIRED' | 'CHECKED_IN' | 'CANCELLED';

export interface ReservationItemRequest {
  categoryId: number;
  quantity: number;
}

export interface ReservationRequest {
  buyerEmail: string;
  buyerName?: string;
  items: ReservationItemRequest[];
}

export interface TicketResponse {
  id: string;
  reservationId: string;
  categoryId: number;
  categoryName: string;
  status: TicketStatus;
  attendeeName?: string;
  attendeeEmail?: string;
  priceCts: number;
  currencyCode: string;
  qrCode: string;
  createdAt: string;
}

export interface ReservationResponse {
  id: string;
  eventId: number;
  status: ReservationStatus;
  buyerEmail: string;
  buyerName?: string;
  totalCts: number;
  currencyCode: string;
  idempotencyKey?: string;
  expiresAt?: string;
  createdAt: string;
  tickets: TicketResponse[];
}
