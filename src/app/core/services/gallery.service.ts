import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Gallery, GallerySummary, PageResponse } from '../models';

/**
 * Create Gallery Payload
 */
export interface CreateGalleryPayload {
  title: string;
  slug: string;
  description?: string;
  featuredImage?: string;
  images?: string[];
  seoFocusKeyword?: string;
  seoDescription?: string;
  status: 'draft' | 'pending' | 'published';
}

/**
 * Gallery Service
 * Dedicated service for gallery API operations with request deduplication
 */
@Injectable({
  providedIn: 'root'
})
export class GalleryService {
  private readonly baseUrl = `${environment.apiUrl}/galleries`;
  
  // Cache for GET requests (5 minute TTL)
  private cache = new Map<string, Observable<any>>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private http: HttpClient) {}

  /**
   * Get paginated galleries
   * Uses shareReplay(1) to deduplicate concurrent requests
   */
  getGalleries(page = 0, size = 12, sort = 'createdAt,desc', search?: string): Observable<PageResponse<GallerySummary>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (search) {
      params = params.set('search', search);
    }

    const cacheKey = `galleries-${page}-${size}-${sort}-${search || ''}`;
    
    if (!this.cache.has(cacheKey)) {
      const request$ = this.http.get<PageResponse<GallerySummary>>(this.baseUrl, { params })
        .pipe(shareReplay(1));
      
      this.cache.set(cacheKey, request$);
      timer(this.CACHE_TTL).subscribe(() => this.cache.delete(cacheKey));
    }
    
    return this.cache.get(cacheKey)!;
  }

  /**
   * Get featured galleries for home page
   * Uses shareReplay(1) to deduplicate concurrent requests
   */
  getFeaturedGalleries(size = 6): Observable<PageResponse<GallerySummary>> {
    const cacheKey = `galleries-featured-${size}`;
    
    if (!this.cache.has(cacheKey)) {
      const params = new HttpParams()
        .set('page', '0')
        .set('size', size.toString())
        .set('sort', 'createdAt,desc');

      const request$ = this.http.get<PageResponse<GallerySummary>>(this.baseUrl, { params })
        .pipe(shareReplay(1));
      
      this.cache.set(cacheKey, request$);
      timer(this.CACHE_TTL).subscribe(() => this.cache.delete(cacheKey));
    }
    
    return this.cache.get(cacheKey)!;
  }

  /**
   * Get gallery by slug with full details
   * Uses shareReplay(1) to deduplicate concurrent requests
   */
  getGalleryBySlug(slug: string): Observable<Gallery> {
    const cacheKey = `gallery-${slug}`;
    
    if (!this.cache.has(cacheKey)) {
      const request$ = this.http.get<Gallery>(`${this.baseUrl}/${slug}`)
        .pipe(shareReplay(1));
      
      this.cache.set(cacheKey, request$);
      timer(this.CACHE_TTL).subscribe(() => this.cache.delete(cacheKey));
    }
    
    return this.cache.get(cacheKey)!;
  }

  /**
   * Create new gallery
   */
  createGallery(payload: CreateGalleryPayload): Observable<Gallery> {
    return this.http.post<Gallery>(this.baseUrl, payload);
  }

  /**
   * Get gallery by ID (for edit mode)
   */
  getGalleryById(id: string): Observable<Gallery> {
    return this.http.get<Gallery>(`${this.baseUrl}/id/${id}`);
  }

  /**
   * Update gallery by ID
   */
  updateGallery(id: string, payload: CreateGalleryPayload): Observable<Gallery> {
    return this.http.put<Gallery>(`${this.baseUrl}/${id}`, payload);
  }

  /**
   * Update gallery status only (for inline dashboard status change)
   */
  updateGalleryStatus(id: string, status: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/status`, { status });
  }

  /**
   * Get galleries for a specific user (for dashboard)
   */
  getMyGalleries(authorId: string, page = 0, size = 20, status?: string): Observable<PageResponse<Gallery>> {
    let params = new HttpParams()
      .set('authorId', authorId)
      .set('page', page.toString())
      .set('size', size.toString());
    if (status) params = params.set('status', status);
    return this.http.get<PageResponse<Gallery>>(`${this.baseUrl}/my`, { params });
  }

  /**
   * Get all galleries with pending+published status (for admin dashboard)
   */
  getAllGalleries(page = 0, size = 20, status?: string): Observable<PageResponse<Gallery>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (status) params = params.set('status', status);
    return this.http.get<PageResponse<Gallery>>(`${this.baseUrl}/all`, { params });
  }

  deleteGallery(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Clear cache - useful after mutations
   */
  clearCache(): void {
    this.cache.clear();
  }
}
