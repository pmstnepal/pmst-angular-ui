import { Component, Input, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ImageUrlMapperService } from '../../../services/image-url-mapper.service';

interface GalleryItem {
  id: string;
  title: string;
  slug: string;
  featuredImage?: string;
  imageKey?: string;
  authorName?: string;
}

@Component({
  selector: 'pmst-gallery-carousel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="pmst-gallery-slider">
      <!-- Main Slider -->
      <div class="pmst-model-slider-wrapper">
        @for (item of itemsSignal(); track item.id; let i = $index) {
          <div
            class="pmst-model-slide"
            [class.active]="i === currentIndex()"
            [style.background-image]="'url(' + (item.featuredImage ? imageMapper.mapUrl(item.featuredImage, item.imageKey) : '') + ')'"
          >
            <div class="pmst-slide-overlay">
              <h2>{{ item.title }}</h2>
              <p>By {{ item.authorName || 'PMST US-Nepal' }}</p>
            </div>
            <a [routerLink]="['/showcase', item.slug]" class="pmst-slide-link"></a>
          </div>
        }
      </div>

      <!-- Thumbnails -->
      <div class="pmst-model-thumbnails-wrapper">
        @for (item of itemsSignal(); track item.id; let i = $index) {
          <div
            class="pmst-model-thumbnail"
            [class.active]="i === currentIndex()"
            (click)="currentIndex.set(i)"
          >
            <a [routerLink]="['/showcase', item.slug]">
              @if (item.featuredImage) {
                <img [src]="imageMapper.mapUrl(item.featuredImage, item.imageKey)" [alt]="item.title">
              } @else {
                <div class="pmst-thumbnail-fallback"></div>
              }
            </a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [':host { display: block; }']
})
export class GalleryCarouselComponent implements OnInit, OnDestroy {
  imageMapper = inject(ImageUrlMapperService);

  @Input() title = '';
  @Input() visibleCount = 4;

  @Input() set items(value: GalleryItem[]) {
    if (value && value.length > 0) {
      this.itemsSignal.set(value);
    }
  }

  currentIndex = signal(0);
  readonly itemsSignal = signal<GalleryItem[]>([]);

  private autoRotateInterval?: number;

  ngOnInit() {
    this.startAutoRotate();
  }

  ngOnDestroy() {
    this.stopAutoRotate();
  }

  startAutoRotate() {
    this.autoRotateInterval = window.setInterval(() => {
      this.currentIndex.update(i => (i + 1) % this.itemsSignal().length);
    }, 5000);
  }

  stopAutoRotate() {
    if (this.autoRotateInterval) {
      clearInterval(this.autoRotateInterval);
    }
  }
}
