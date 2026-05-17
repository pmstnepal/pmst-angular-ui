import { Component, Input, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ImageUrlMapperService } from '../../services/image-url-mapper.service';

// Gallery interfaces
export interface GalleryImage {
  id: string;
  imageUrl: string;
  caption?: string;
  sortOrder: number;
}

export interface Gallery {
  id: string;
  title: string;
  slug: string;
  description?: string;
  featuredImage?: string;
  images: GalleryImage[];
  status: string;
  createdAt: string;
  authorId?: string;
}

@Component({
  selector: 'pmst-showcase-detail',
  standalone: true,
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
        <!-- Gallery Header with Featured Image -->
        <div class="relative h-64 md:h-80 lg:h-96 overflow-hidden">
          @if (gallery()!.featuredImage) {
            <img 
              [src]="imageMapper.mapUrl(gallery()!.featuredImage)" 
              [alt]="gallery()!.title"
              class="w-full h-full object-cover">
          } @else {
            <div class="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900"></div>
          }
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          <div class="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div class="container mx-auto">
              <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">{{ gallery()!.title }}</h1>
              @if (gallery()!.description) {
                <p class="text-gray-300 text-lg max-w-2xl">{{ gallery()!.description }}</p>
              }
              <div class="flex items-center gap-4 mt-4 text-gray-400 text-sm">
                <span>{{ gallery()!.images.length || 0 }} photos</span>
                <span>•</span>
                <span>{{ gallery()!.createdAt | date:'mediumDate' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Gallery Grid -->
        <div class="container mx-auto px-4 py-8">
          @if (gallery()!.images && gallery()!.images.length > 0) {
            <div class="gallery-grid">
              @for (image of gallery()!.images; track image.id; let i = $index) {
                <div 
                  class="gallery-item bg-gray-100"
                  (click)="openLightbox(i)">
                  <img 
                    [src]="imageMapper.mapUrl(image.imageUrl)" 
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
              [src]="imageMapper.mapUrl(gallery()!.images[activeImageIndex()].imageUrl)" 
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

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
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
    
    const url = `${environment.apiUrl}/galleries/${slug}`;
    this.http.get<Gallery>(url).subscribe({
      next: (gallery) => {
        this.gallery.set(gallery);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load gallery:', err);
        this.error.set('Failed to load gallery. Please try again.');
        this.loading.set(false);
      }
    });
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
