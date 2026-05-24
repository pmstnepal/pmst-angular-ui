import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Article, NewsArticle, ArticleDetail, PageResponse } from '../models';

export interface CreateArticlePayload {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  status: 'draft' | 'pending' | 'published';
  slug?: string;
  featuredImage?: string;
  youtubeLink?: string;
  embedCode?: string;
  galleryImages?: string;
  seoFocusKeyword?: string;
  seoDescription?: string;
  seoTitle?: string;
}

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
   * Create a new article (submit for review or save as draft)
   */
  createArticle(payload: CreateArticlePayload): Observable<Article> {
    return this.http.post<Article>(this.baseUrl, payload);
  }

  /**
   * Get article by ID (for edit mode)
   */
  getArticleById(id: string): Observable<ArticleDetail> {
    return this.http.get<ArticleDetail>(`${this.baseUrl}/id/${id}`);
  }

  /**
   * Update article by ID
   */
  updateArticle(id: string, payload: CreateArticlePayload): Observable<Article> {
    return this.http.put<Article>(`${this.baseUrl}/${id}`, payload);
  }

  /**
   * Update article status only (for inline dashboard status change)
   */
  updateArticleStatus(id: string, status: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/status`, { status });
  }

  /**
   * Get articles for a specific user (for dashboard)
   */
  getMyArticles(authorId: string, page = 0, size = 20, status?: string): Observable<PageResponse<NewsArticle>> {
    let params = new HttpParams()
      .set('authorId', authorId)
      .set('page', page.toString())
      .set('size', size.toString());
    if (status) params = params.set('status', status);
    return this.http.get<PageResponse<NewsArticle>>(`${this.baseUrl}/my`, { params });
  }

  /**
   * Get all articles with pending+published status (for admin dashboard)
   */
  getAllArticles(page = 0, size = 20, status?: string): Observable<PageResponse<NewsArticle>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (status) params = params.set('status', status);
    return this.http.get<PageResponse<NewsArticle>>(`${this.baseUrl}/all`, { params });
  }

  deleteArticle(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Clear cache - useful after mutations
   */
  clearCache(): void {
    this.cache.clear();
  }
}
