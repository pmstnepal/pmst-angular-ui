import { Component, Input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ImageUrlMapperService } from '../../../services/image-url-mapper.service';

interface CarouselItem {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  category: string;
  slug: string;
  date: string;
}

@Component({
  selector: 'pmst-post-carousel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="post-carousel">
      @if (title) {
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-900">{{ title }}</h3>
          <div class="flex gap-2">
            <button
              (click)="prev()"
              [disabled]="currentIndex() === 0"
              class="p-2 rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <button
              (click)="next()"
              [disabled]="currentIndex() >= maxIndex()"
              class="p-2 rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
              <a [routerLink]="['/news', item.slug]" class="block group">
                <div class="bg-white rounded-xl shadow-md overflow-hidden card-hover">
                  <div class="aspect-video bg-gray-200 overflow-hidden">
                    @if (item.imageUrl) {
                      <img [src]="imageMapper.mapUrl(item.imageUrl)" [alt]="item.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                    } @else {
                      <div class="w-full h-full flex items-center justify-center text-gray-400">
                        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                      </div>
                    }
                  </div>
                  <div class="p-4">
                    <span class="text-xs font-semibold text-indigo-600 uppercase tracking-wide">{{ item.category }}</span>
                    <h4 class="mt-1 text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {{ item.title }}
                    </h4>
                    <p class="mt-1 text-xs text-gray-500 line-clamp-2">{{ item.excerpt }}</p>
                    <p class="mt-2 text-xs text-gray-400">{{ item.date | date:'mediumDate' }}</p>
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
              [class]="$index === currentIndex() ? 'bg-indigo-600' : 'bg-gray-300'"
            ></button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .card-hover { transition: all 0.3s ease; }
    .card-hover:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
    .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  `]
})
export class PostCarouselComponent {
  imageMapper = inject(ImageUrlMapperService);
  
  @Input() title = '';
  @Input() visibleCount = 3;

  // Allow external items to be passed in - uses setter to update signal
  @Input() set items(value: CarouselItem[]) {
    if (value && value.length > 0) {
      this.itemsSignal.set(value);
    }
  }

  currentIndex = signal(0);
  // Use readonly so template can access but not overwrite directly
  readonly itemsSignal = signal<CarouselItem[]>([
    { id: '1', title: '"Meet and Greet" with Nayak Pradeep Khadka held in America', excerpt: 'Nepali film star Pradeep Khadka meets fans in the US.', imageUrl: '', category: 'Entertainment', slug: 'meet-and-greet-pradeep-khadka', date: '2025-05-08' },
    { id: '2', title: 'INFA Awards 2025: Top Five Nominees Honored', excerpt: 'The International Nepali Film Academy honored nominees in Kathmandu.', imageUrl: '', category: 'Entertainment', slug: 'infa-awards-2025', date: '2025-05-07' },
    { id: '3', title: 'Teaser of Nepali Film "Mohar" Highlights Deuki Tradition', excerpt: 'New Nepali film explores the Deuki tradition.', imageUrl: '', category: 'Movies', slug: 'mohar-teaser', date: '2025-05-06' },
    { id: '4', title: 'Prakash Saput Teams Up with Dayahang Rai in "Mirmire"', excerpt: 'Two Nepali stars collaborate on an upcoming film.', imageUrl: '', category: 'Movies', slug: 'mirmire-collaboration', date: '2025-05-05' },
    { id: '5', title: 'NAIFF 2025 to Showcase 31 Global Films in Maryland', excerpt: 'Nepal America International Film Festival returns this June.', imageUrl: '', category: 'Events', slug: 'naiff-2025', date: '2025-05-04' },
  ]);

  maxIndex = computed(() => Math.max(0, this.itemsSignal().length - this.visibleCount));
  dotArray = computed(() => Array(this.maxIndex() + 1));

  prev() {
    this.currentIndex.update(i => Math.max(0, i - 1));
  }

  next() {
    this.currentIndex.update(i => Math.min(this.maxIndex(), i + 1));
  }
}
