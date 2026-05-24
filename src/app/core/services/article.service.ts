import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Article, NewsArticle, ArticleDetail, PageResponse } from '../models';

/**
 * Article Service
 * Dedicated service for article API operations with request deduplication
 */
@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  private readonly baseUrl = `${environment.apiUrl}/articles`;
  
  // Cache for GET requests (5 minute TTL)
  private cache = new Map<string, Observable<any>>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private http: HttpClient) {}

  /**
   * Get paginated articles with optional filtering
   * Uses shareReplay(1) to deduplicate concurrent requests
   */
  getArticles(page = 0, size = 9, category?: string, sort = 'publishedAt,desc', search?: string): Observable<PageResponse<NewsArticle>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (category && category !== 'All') {
      params = params.set('category', category.toLowerCase().replace(' ', '-'));
    }

    if (search) {
      params = params.set('search', search);
    }

    const cacheKey = `articles-${page}-${size}-${category || 'all'}-${sort}-${search || ''}`;

    if (!this.cache.has(cacheKey)) {
      const request$ = this.http.get<PageResponse<NewsArticle>>(this.baseUrl, { params })
        .pipe(shareReplay(1));

      this.cache.set(cacheKey, request$);

      // Auto-expire cache entry after TTL
      timer(this.CACHE_TTL).subscribe(() => this.cache.delete(cacheKey));
    }

    return this.cache.get(cacheKey)!;
  }

  /**
   * Get article by slug
   * Uses shareReplay(1) to deduplicate concurrent requests
   */
  getArticleBySlug(slug: string): Observable<ArticleDetail> {
    const cacheKey = `article-${slug}`;
    
    if (!this.cache.has(cacheKey)) {
      const request$ = this.http.get<ArticleDetail>(`${this.baseUrl}/${slug}`)
        .pipe(shareReplay(1));
      
      this.cache.set(cacheKey, request$);
      timer(this.CACHE_TTL).subscribe(() => this.cache.delete(cacheKey));
    }
    
    return this.cache.get(cacheKey)!;
  }

  /**
   * Get latest articles for home page
   */
  getLatestArticles(size = 6): Observable<PageResponse<Article>> {
    return this.getArticles(0, size, undefined, 'publishedAt,desc');
  }

  /**
   * Clear cache - useful after mutations
   */
  clearCache(): void {
    this.cache.clear();
  }
}
