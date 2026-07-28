import { Component, Input, signal, OnInit, HostListener, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { Gallery } from '../../core/models';
import { GalleryService } from '../../core/services/gallery.service';
import { ImageUrlMapperService } from '../../services/image-url-mapper.service';

@Component({
  selector: 'pmst-showcase-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="showcase-detail" (keydown)="handleKeyboard($event)" tabindex="0">
      @if (loading()) {
        <div class="container mx-auto px-4 py-8">
          <div class="animate-pulse space-y-4">
            <div class="h-96 bg-gray-200 rounded-lg"></div>
            <div class="h-8 bg-gray-200 rounded w-1/3"></div>
            <div class="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      } @else if (error()) {
        <div class="container mx-auto px-4 py-8 text-center">
          <div class="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 class="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p class="text-red-600">{{ error() }}</p>
            <button 
              (click)="ngOnInit()"
              class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
              Retry
            </button>
          </div>
        </div>
      } @else if (gallery()) {
        <!-- pmst_model_single_details Section - Plugin Styled -->
        <div class="pmst-model-single-wrapper">
          <div class="pmst-model-single-top">
            <!-- Feature Image -->
            <div class="pmst-feature-image">
              @if (gallery()!.featuredImage) {
                <div class="pmst-feature-image-bg" [style.background-image]="'url(' + imageMapper.mapUrl(gallery()!.featuredImage, gallery()!.imageKey) + ')'">
                </div>
              } @else {
                <div class="pmst-feature-image-placeholder"></div>
              }
            </div>
            
            <!-- Model Info -->
            <div class="pmst-model-info">
              <h1 class="pmst-model-title">{{ gallery()!.title | uppercase }}</h1>
              
              <p class="pmst-posted-by">
                Posted by <strong>{{ gallery()!.authorName || 'Unknown' }}</strong> on <em>{{ gallery()!.createdAt | date:'mediumDate' }}</em>
              </p>
              
              <h4 class="pmst-gallery-info-heading">Gallery Info:</h4>
              @if (gallery()!.description) {
                <div class="pmst-model-description" [innerHTML]="gallery()!.description">
                </div>
              } @else {
                <div class="pmst-model-description">
                  <p>No description available for this gallery.</p>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Gallery Grid -->
        <div class="container mx-auto px-4 py-12 gallery-grid-container">
          @if (gallery()!.images && gallery()!.images.length > 0) {
            <div class="gallery-grid">
              @for (image of gallery()!.images; track image.id; let i = $index) {
                <div 
                  class="gallery-item bg-gray-100"
                  (click)="openLightbox(i)">
                  <img 
                    [src]="imageMapper.mapUrl(image.imageUrl, image.imageKey)" 
                    [alt]="image.caption || gallery()!.title"
                    class="w-full h-full object-cover">
                  <div class="gallery-overlay">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                    </svg>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="text-center py-12 bg-gray-50 rounded-lg">
              <p class="text-gray-500">No images in this gallery yet.</p>
            </div>
          }
        </div>
      }

      <!-- Lightbox -->
      @if (lightboxOpen() && gallery()) {
        <div class="lightbox" (click)="closeLightbox()">
          <div class="lightbox-content" (click)="$event.stopPropagation()">
            <button class="lightbox-close" (click)="closeLightbox()">&times;</button>
            
            <img 
              [src]="imageMapper.mapUrl(gallery()!.images[activeImageIndex()].imageUrl, gallery()!.images[activeImageIndex()].imageKey)" 
              [alt]="gallery()!.images[activeImageIndex()].caption || gallery()!.title"
              class="lightbox-image">
            
            @if (gallery()!.images.length > 1) {
              <button class="lightbox-nav prev" (click)="prevImage(); $event.stopPropagation()">
                &#8249;
              </button>
              <button class="lightbox-nav next" (click)="nextImage(); $event.stopPropagation()">
                &#8250;
              </button>
              <div class="lightbox-counter">
                {{ activeImageIndex() + 1 }} / {{ gallery()!.images.length }}
              </div>
            }
            
            @if (gallery()!.images[activeImageIndex()].caption) {
              <div class="absolute -bottom-12 left-0 right-0 text-center text-white">
                <p class="text-sm">{{ gallery()!.images[activeImageIndex()].caption }}</p>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* pmst_model_single_details - Plugin Styles */
    .pmst-model-single-wrapper {
      background: #e5e7eb;
      padding: 40px 0;
    }
    .pmst-model-single-top {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: center;
      gap: 40px;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    .pmst-feature-image {
      flex: 1;
      min-width: 300px;
      max-width: 500px;
    }
    .pmst-feature-image-bg {
      width: 100%;
      height: 420px;
      background: top center/cover no-repeat;
      border-radius: 15px;
      box-shadow: 0 10px 20px rgba(0,0,0,0.4);
    }
    .pmst-feature-image-placeholder {
      width: 100%;
      height: 420px;
      background: linear-gradient(135deg, #333 0%, #444 100%);
      border-radius: 15px;
    }
    .pmst-model-info {
      flex: 2;
      min-width: 300px;
      padding: 20px;
    }
    .pmst-model-title {
      font-size: 36px;
      text-transform: uppercase;
      font-weight: 800;
      margin-bottom: 10px;
      color: #4a4a6a;
      line-height: 1.2;
    }
    .pmst-posted-by {
      color: #4a4a6a;
      font-size: 14px;
      margin-bottom: 20px;
    }
    .pmst-posted-by strong {
      color: #4a4a6a;
      font-weight: 600;
    }
    .pmst-posted-by em {
      font-style: italic;
    }
    .pmst-gallery-info-heading {
      font-size: 18px;
      margin-bottom: 8px;
      color: #4a4a6a;
      font-weight: 600;
    }
    .pmst-model-description {
      font-size: 16px;
      color: #4a4a6a;
      margin-bottom: 25px;
      line-height: 1.6;
    }
    @media (max-width: 768px) {
      .pmst-model-single-top {
        flex-direction: column;
        align-items: center;
        gap: 20px;
      }
      .pmst-feature-image,
      .pmst-model-info {
        min-width: 100%;
        max-width: 100%;
      }
      .pmst-feature-image-bg,
      .pmst-feature-image-placeholder {
        height: 300px;
      }
      .pmst-model-title {
        font-size: 28px;
      }
    }
    
    /* Gallery Grid - Keeping existing style */
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    @media (min-width: 768px) {
      .gallery-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
    @media (min-width: 1024px) {
      .gallery-grid {
        grid-template-columns: repeat(5, 1fr);
      }
    }
    .gallery-grid-container {
      margin-top: 2rem;
      margin-bottom: 2rem;
    }
    .gallery-item {
      aspect-ratio: 1;
      cursor: pointer;
      overflow: hidden;
      border-radius: 0.5rem;
      position: relative;
    }
    .gallery-item:hover .gallery-overlay {
      opacity: 1;
    }
    .gallery-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s;
    }
    .lightbox {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.95);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .lightbox-content {
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
    }
    .lightbox-image {
      max-width: 100%;
      max-height: 85vh;
      object-fit: contain;
    }
    .lightbox-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      transition: background 0.3s;
    }
    .lightbox-nav:hover {
      background: rgba(255,255,255,0.4);
    }
    .lightbox-nav.prev { left: -70px; }
    .lightbox-nav.next { right: -70px; }
    .lightbox-close {
      position: absolute;
      top: -50px;
      right: 0;
      background: none;
      border: none;
      color: white;
      font-size: 32px;
      cursor: pointer;
    }
    .lightbox-counter {
      position: absolute;
      bottom: -40px;
      left: 50%;
      transform: translateX(-50%);
      color: white;
      font-size: 14px;
    }
    @media (max-width: 768px) {
      .lightbox-nav.prev { left: 10px; }
      .lightbox-nav.next { right: 10px; }
    }
  `]
})
export class ShowcaseDetailComponent implements OnInit {
  @Input() id!: string;

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    this.handleKeyboard(event);
  }

  loading = signal(true);
  error = signal<string | null>(null);
  gallery = signal<Gallery | null>(null);
  activeImageIndex = signal<number>(0);
  lightboxOpen = signal(false);

  private meta = inject(Meta);
  private title = inject(Title);

  constructor(
    private route: ActivatedRoute,
    private galleryService: GalleryService,
    public imageMapper: ImageUrlMapperService
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('id');
    if (slug) {
      this.loadGallery(slug);
    } else {
      this.error.set('Gallery not found');
      this.loading.set(false);
    }
  }

  private loadGallery(slug: string): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.galleryService.getGalleryBySlug(slug).subscribe({
      next: (gallery) => {
        this.gallery.set(gallery);
        this.setSeoMeta(gallery);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load gallery:', err);
        this.error.set('Failed to load gallery. Please try again.');
        this.loading.set(false);
      }
    });
  }

  private setSeoMeta(gallery: Gallery): void {
    // Title
    const pageTitle = gallery.seoTitle || `${gallery.title} - Gallery | PMST US-Nepal`;
    this.title.setTitle(pageTitle);

    // Meta description
    const description = gallery.seoDescription || gallery.description || `View ${gallery.title} gallery on PMST US-Nepal`;
    this.meta.updateTag({ name: 'description', content: this.stripHtml(description).substring(0, 160) });

    // Keywords
    if (gallery.seoFocusKeyword) {
      this.meta.updateTag({ name: 'keywords', content: gallery.seoFocusKeyword });
    }

    // Open Graph tags
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: this.stripHtml(description).substring(0, 160) });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    if (gallery.featuredImage) {
      this.meta.updateTag({ property: 'og:image', content: this.imageMapper.mapUrl(gallery.featuredImage, gallery.imageKey) });
    }

    // Twitter Card tags
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: this.stripHtml(description).substring(0, 160) });
    if (gallery.featuredImage) {
      this.meta.updateTag({ name: 'twitter:image', content: this.imageMapper.mapUrl(gallery.featuredImage, gallery.imageKey) });
    }
  }

  private stripHtml(html: string): string {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  openLightbox(index: number): void {
    this.activeImageIndex.set(index);
    this.lightboxOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
    document.body.style.overflow = '';
  }

  nextImage(): void {
    const gallery = this.gallery();
    if (!gallery?.images?.length) return;
    
    this.activeImageIndex.update(current => 
      current >= gallery.images.length - 1 ? 0 : current + 1
    );
  }

  prevImage(): void {
    const gallery = this.gallery();
    if (!gallery?.images?.length) return;
    
    this.activeImageIndex.update(current => 
      current <= 0 ? gallery.images.length - 1 : current - 1
    );
  }

  handleKeyboard(event: KeyboardEvent): void {
    if (!this.lightboxOpen()) return;
    
    switch (event.key) {
      case 'Escape':
        this.closeLightbox();
        break;
      case 'ArrowRight':
        this.nextImage();
        break;
      case 'ArrowLeft':
        this.prevImage();
        break;
    }
  }
}
