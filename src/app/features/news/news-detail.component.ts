import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'pmst-news-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="news-detail py-8">
      <div class="container mx-auto px-4 max-w-4xl">
        @if (loading()) {
          <div class="animate-pulse space-y-4">
            <div class="h-8 bg-gray-200 rounded w-3/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/4"></div>
            <div class="h-64 bg-gray-200 rounded"></div>
            <div class="space-y-2">
              <div class="h-4 bg-gray-200 rounded"></div>
              <div class="h-4 bg-gray-200 rounded"></div>
              <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        } @else {
          <article>
            <!-- Category & Meta -->
            <div class="flex items-center gap-4 mb-4">
              <span class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                {{ article().category }}
              </span>
              <span class="text-gray-500">{{ article().publishedAt | date:'mediumDate' }}</span>
            </div>

            <!-- Title -->
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {{ article().title }}
            </h1>

            <!-- Author -->
            <div class="flex items-center gap-3 mb-8 pb-8 border-b border-gray-200">
              <div class="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <span class="text-indigo-600 font-semibold">{{ article().author.name[0] }}</span>
              </div>
              <div>
                <p class="font-semibold text-gray-900">{{ article().author.name }}</p>
                <p class="text-sm text-gray-500">Author</p>
              </div>
            </div>

            <!-- Featured Image -->
            @if (article().featuredImage) {
              <div class="mb-8">
                <img 
                  [src]="article().featuredImage" 
                  [alt]="article().title"
                  class="w-full h-auto rounded-lg shadow-lg"
                >
              </div>
            }

            <!-- Content -->
            <div class="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p class="text-xl text-gray-600 mb-6">{{ article().excerpt }}</p>
              <div [innerHTML]="article().content"></div>
            </div>

            <!-- Tags -->
            <div class="flex flex-wrap gap-2 mt-8 pt-8 border-t border-gray-200">
              @for (tag of article().tags; track tag) {
                <span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  #{{ tag }}
                </span>
              }
            </div>

            <!-- Navigation -->
            <div class="flex justify-between mt-12 pt-8 border-t border-gray-200">
              <a routerLink="/news" class="text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-2">
                ← Back to News
              </a>
              <div class="flex gap-4">
                <button class="text-gray-600 hover:text-indigo-600 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                  </svg>
                  Share
                </button>
              </div>
            </div>
          </article>
        }
      </div>
    </div>
  `,
  styles: [``]
})
export class NewsDetailComponent {
  @Input() slug!: string;

  loading = signal(true);
  article = signal({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    publishedAt: '',
    author: { name: '' },
    tags: [] as string[]
  });

  constructor() {
    // Simulate loading article data
    setTimeout(() => {
      this.article.set({
        title: '2024 Fashion Week Highlights: Top Models to Watch',
        excerpt: 'Discover the rising stars who captured attention at this year\'s major fashion weeks around the globe. From New York to Paris, these models are defining the future of fashion.',
        content: `
          <p>The 2024 fashion season has been nothing short of spectacular. With major fashion weeks taking place in New York, London, Milan, and Paris, the industry has witnessed the emergence of several breakthrough talents who are reshaping the modeling landscape.</p>
          
          <h2>Breakthrough Moments</h2>
          <p>This season marked a significant shift toward diversity and inclusion on the runways. Models from Nepal and South Asia have been particularly prominent, with several making their debut at major international shows.</p>
          
          <h2>Top Performers</h2>
          <p>Among the standout performers, we saw exceptional walks from models representing agencies across Asia. Their unique perspectives and professional presentation earned them standing ovations and multiple bookings.</p>
          
          <h2>Looking Ahead</h2>
          <p>As we look toward the rest of 2024, these rising stars are positioned to become household names. With campaigns already lined up for major luxury brands, their impact on the industry is just beginning.</p>
        `,
        category: 'Fashion',
        publishedAt: new Date().toISOString(),
        author: { name: 'Fashion Editor' },
        tags: ['Fashion Week', 'Models', '2024', 'Trends']
      });
      this.loading.set(false);
    }, 500);
  }
}
