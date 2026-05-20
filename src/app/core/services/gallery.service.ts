import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Gallery, GallerySummary, PageResponse } from '../models';

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
  getGalleries(page = 0, size = 12, sort = 'createdAt,desc'): Observable<PageResponse<GallerySummary>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    const cacheKey = `galleries-${page}-${size}-${sort}`;
    
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
   * Clear cache - useful after mutations
   */
  clearCache(): void {
    this.cache.clear();
  }
}
