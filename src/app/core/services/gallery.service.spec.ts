import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GalleryService } from './gallery.service';
import { Gallery, PageResponse } from '../models';

describe('GalleryService', () => {
  let service: GalleryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GalleryService]
    });
    service = TestBed.inject(GalleryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get galleries with pagination', () => {
    const mockResponse: PageResponse<Gallery> = {
      content: [
        {
          id: '1',
          title: 'Test Gallery',
          slug: 'test-gallery',
          images: [],
          status: 'published',
          createdAt: '2025-01-01'
        }
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 12
    };

    service.getGalleries(0, 12).subscribe(response => {
      expect(response.content.length).toBe(1);
      expect(response.content[0].title).toBe('Test Gallery');
    });

    const req = httpMock.expectOne('http://localhost:8080/galleries?page=0&size=12&sort=createdAt,desc');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get featured galleries', () => {
    const mockResponse: PageResponse<Gallery> = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 6
    };

    service.getFeaturedGalleries(6).subscribe(response => {
      expect(response.size).toBe(6);
    });

    const req = httpMock.expectOne('http://localhost:8080/galleries?page=0&size=6&sort=createdAt,desc');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get gallery by slug', () => {
    const mockGallery: Gallery = {
      id: '1',
      title: 'Test Gallery',
      slug: 'test-gallery',
      description: 'Test description',
      images: [
        { id: '1', imageUrl: 'test.jpg', sortOrder: 1 }
      ],
      status: 'published',
      createdAt: '2025-01-01'
    };

    service.getGalleryBySlug('test-gallery').subscribe(gallery => {
      expect(gallery.title).toBe('Test Gallery');
      expect(gallery.images.length).toBe(1);
    });

    const req = httpMock.expectOne('http://localhost:8080/galleries/test-gallery');
    expect(req.request.method).toBe('GET');
    req.flush(mockGallery);
  });

  it('should clear cache', () => {
    service.clearCache();
    // Cache clear is internal - just verify no error
    expect(service).toBeTruthy();
  });
});
