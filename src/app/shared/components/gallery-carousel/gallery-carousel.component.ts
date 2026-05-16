import { Component, Input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ImageUrlMapperService } from '../../../services/image-url-mapper.service';

interface GalleryItem {
  id: string;
  title: string;
  slug: string;
  featuredImage?: string;
}

@Component({
  selector: 'pmst-gallery-carousel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="gallery-carousel">
      @if (title) {
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-white">{{ title }}</h3>
          <div class="flex gap-2">
            <button
              (click)="prev()"
              [disabled]="currentIndex() === 0"
              class="p-2 rounded-full border border-gray-600 text-gray-300 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <button
              (click)="next()"
              [disabled]="currentIndex() >= maxIndex()"
              class="p-2 rounded-full border border-gray-600 text-gray-300 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      }

      <div class="overflow-hidden">
        <div
          class="flex transition-transform duration-300 ease-in-out gap-4"
          [style.transform]="'translateX(-' + (currentIndex() * (100 / visibleCount)) + '%)'"
        >
          @for (item of itemsSignal(); track item.id) {
            <div class="flex-shrink-0" [style.width]="'calc(' + (100 / visibleCount) + '% - 1rem)'">
              <a [routerLink]="['/showcase', item.slug]" class="block group">
                <div class="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-800">
                  @if (item.featuredImage) {
                    <img [src]="imageMapper.mapUrl(item.featuredImage)" [alt]="item.title"
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                  } @else {
                    <div class="w-full h-full flex items-center justify-center text-gray-600">
                      <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                    </div>
                  }
                  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity flex items-end p-3">
                    <h4 class="text-white font-bold text-sm leading-tight uppercase">{{ item.title }}</h4>
                  </div>
                </div>
              </a>
            </div>
          }
        </div>
      </div>

      <!-- Dots indicator -->
      @if (itemsSignal().length > visibleCount) {
        <div class="flex justify-center gap-1.5 mt-4">
          @for (dot of dotArray(); track $index) {
            <button
              (click)="currentIndex.set($index)"
              class="w-2 h-2 rounded-full transition-colors"
              [class]="$index === currentIndex() ? 'bg-red-500' : 'bg-gray-600'"
            ></button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class GalleryCarouselComponent {
  imageMapper = inject(ImageUrlMapperService);
  
  @Input() title = '';
  @Input() visibleCount = 4;

  // Allow external items to be passed in
  @Input() set items(value: GalleryItem[]) {
    if (value && value.length > 0) {
      this.itemsSignal.set(value);
    }
  }

  currentIndex = signal(0);
  readonly itemsSignal = signal<GalleryItem[]>([]);

  maxIndex = computed(() => Math.max(0, this.itemsSignal().length - this.visibleCount));
  dotArray = computed(() => Array(this.maxIndex() + 1));

  prev() {
    this.currentIndex.update(i => Math.max(0, i - 1));
  }

  next() {
    this.currentIndex.update(i => Math.min(this.maxIndex(), i + 1));
  }
}
