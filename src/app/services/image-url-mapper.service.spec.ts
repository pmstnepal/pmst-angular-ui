import { TestBed } from '@angular/core/testing';
import { ImageUrlMapperService } from './image-url-mapper.service';

describe('ImageUrlMapperService', () => {
  let service: ImageUrlMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ImageUrlMapperService]
    });
    service = TestBed.inject(ImageUrlMapperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return fallback image for null/undefined', () => {
    expect(service.mapUrl(null)).toBe('/assets/images/placeholder.jpg');
    expect(service.mapUrl(undefined)).toBe('/assets/images/placeholder.jpg');
  });

  it('should map ultimatemember URLs', () => {
    const wpUrl = 'https://pmstusnepal.com/wp-content/uploads/ultimatemember/123/profile.jpg';
    const result = service.mapUrl(wpUrl);
    expect(result).toBe('/assets/images/ultimatemember/123/profile.jpg');
  });

  it('should map woocommerce placeholder URLs', () => {
    const wpUrl = 'https://pmstusnepal.com/wp-content/uploads/woocommerce-placeholder.png';
    const result = service.mapUrl(wpUrl);
    expect(result).toBe('/assets/images/woocommerce-placeholder.png');
  });

  it('should extract filename from uploads URL', () => {
    const wpUrl = 'https://pmstusnepal.com/wp-content/uploads/2023/05/image.jpg';
    const result = service.mapUrl(wpUrl);
    expect(result).toContain('image.jpg');
  });

  it('should return original URL if no pattern matches', () => {
    const externalUrl = 'https://example.com/image.jpg';
    expect(service.mapUrl(externalUrl)).toBe(externalUrl);
  });

  it('should check if URL is WordPress URL', () => {
    expect(service.isWordPressUrl('https://pmstusnepal.com/wp-content/uploads/image.jpg')).toBe(true);
    expect(service.isWordPressUrl('https://example.com/image.jpg')).toBe(false);
  });
});
