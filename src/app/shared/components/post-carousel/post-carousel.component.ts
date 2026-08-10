import { Component, Input, signal, computed, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ImageUrlMapperService } from '../../../services/image-url-mapper.service';

interface CarouselItem {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  imageKey?: string;
  category: string;
  slug: string;
  date: string;
  authorName?: string;
}

@Component({
  selector: 'pmst-post-carousel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="post-carousel">
      @if (title) {
        <h3 class="text-xl font-bold text-gray-900 mb-4">{{ title }}</h3>
      }

      <div class="pmst-carousel-wrap">
        <button
          (click)="scrollCarousel(-1)"
          class="pmst-carousel-nav pmst-nav-prev"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        <div class="pmst-carousel-wrapper" #carouselWrapper>
          @for (item of itemsSignal(); track item.id) {
            <div class="pmst-carousel-post">
              <a [routerLink]="['/news', item.slug]" class="block">
                <div class="pmst-post-image">
                  @if (item.imageUrl || item.imageKey) {
                    <img [src]="imageMapper.mapUrl(item.imageUrl, item.imageKey, 'card')" [alt]="item.title">
                  } @else {
                    <div class="w-full h-full flex items-center justify-center text-gray-400">
                      <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                    </div>
                  }
                </div>
                <div class="pmst-carousel-title">
                  <a [routerLink]="['/news', item.slug]">{{ item.title }}</a>
                </div>
                <div class="pmst-carousel-meta">By {{ item.authorName || 'PMST US-Nepal' }} on {{ item.date | date:'mediumDate' }}</div>
                <div class="pmst-carousel-excerpt line-clamp-2">{{ item.excerpt }}</div>
              </a>
            </div>
          }
        </div>

        <button
          (click)="scrollCarousel(1)"
          class="pmst-carousel-nav pmst-nav-next"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: [':host { display: block; }']
})
export class PostCarouselComponent {
  imageMapper = inject(ImageUrlMapperService);

  @Input() title = '';
  @Input() visibleCount = 3;

  @ViewChild('carouselWrapper') carouselWrapper?: ElementRef<HTMLDivElement>;

  // Allow external items to be passed in - uses setter to update signal
  @Input() set items(value: CarouselItem[]) {
    if (value && value.length > 0) {
      this.itemsSignal.set(value);
    }
  }

  readonly itemsSignal = signal<CarouselItem[]>([
    { id: '1', title: '"Meet and Greet" with Nayak Pradeep Khadka held in America', excerpt: 'Nepali film star Pradeep Khadka meets fans in the US.', imageUrl: '', category: 'Entertainment', slug: 'meet-and-greet-pradeep-khadka', date: '2025-05-08' },
    { id: '2', title: 'INFA Awards 2025: Top Five Nominees Honored', excerpt: 'The International Nepali Film Academy honored nominees in Kathmandu.', imageUrl: '', category: 'Entertainment', slug: 'infa-awards-2025', date: '2025-05-07' },
    { id: '3', title: 'Abha Dhungana\'s debut confirmed through Kashyap', excerpt: 'New actress debut confirmed in upcoming film.', imageUrl: '', category: 'Entertainment', slug: 'abha-dhungana-debut', date: '2025-05-06' },
    { id: '4', title: 'Rajshri, the new heroine in \'Jadau\'', excerpt: 'New actress joins the cast of Jadau film.', imageUrl: '', category: 'Entertainment', slug: 'rajshri-jadau', date: '2025-05-05' },
    { id: '5', title: 'Pradeep Bhattarai Replaces Manoj Gajurel in Comedy Darbar', excerpt: 'Actor replacement in popular comedy show.', imageUrl: '', category: 'Entertainment', slug: 'pradeep-bhattarai-comedy-darbar', date: '2025-05-04' },
    { id: '6', title: 'NAIFF 2025 to Showcase 31 Global Films in Maryland', excerpt: 'Nepal America International Film Festival returns this June.', imageUrl: '', category: 'Entertainment', slug: 'naiff-2025', date: '2025-05-03' },
  ]);

  scrollCarousel(direction: number) {
    const wrapper = this.carouselWrapper?.nativeElement;
    if (!wrapper) return;
    const scrollAmount = wrapper.offsetWidth;
    wrapper.scrollLeft += direction * scrollAmount;
  }
}
