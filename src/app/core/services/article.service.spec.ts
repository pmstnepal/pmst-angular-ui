import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ArticleService } from './article.service';
import { Article, PageResponse } from '../models';

describe('ArticleService', () => {
  let service: ArticleService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ArticleService]
    });
    service = TestBed.inject(ArticleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get articles with pagination', () => {
    const mockResponse: PageResponse<Article> = {
      content: [
        {
          id: '1',
          title: 'Test Article',
          slug: 'test-article',
          excerpt: 'Test excerpt',
          category: 'news',
          publishedAt: '2025-01-01'
        }
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 9
    };

    service.getArticles(0, 9).subscribe(response => {
      expect(response.content.length).toBe(1);
      expect(response.content[0].title).toBe('Test Article');
    });

    const req = httpMock.expectOne('http://localhost:8080/articles?page=0&size=9&sort=publishedAt,desc');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get article by slug', () => {
    const mockArticle = {
      id: '1',
      title: 'Test Article',
      slug: 'test-article',
      content: 'Test content',
      excerpt: 'Test excerpt',
      category: 'news',
      publishedAt: '2025-01-01'
    };

    service.getArticleBySlug('test-article').subscribe(article => {
      expect(article.title).toBe('Test Article');
    });

    const req = httpMock.expectOne('http://localhost:8080/articles/test-article');
    expect(req.request.method).toBe('GET');
    req.flush(mockArticle);
  });

  it('should cache requests with shareReplay', () => {
    const mockResponse: PageResponse<Article> = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 9
    };

    // First request
    service.getArticles(0, 9).subscribe();
    const req1 = httpMock.expectOne('http://localhost:8080/articles?page=0&size=9&sort=publishedAt,desc');
    req1.flush(mockResponse);

    // Second request - should use cached value, no new HTTP call
    service.getArticles(0, 9).subscribe();
    httpMock.expectNone('http://localhost:8080/articles?page=0&size=9&sort=publishedAt,desc');
  });
});
