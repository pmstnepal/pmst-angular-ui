import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  category: string;
  publishedAt: string;
  author: {
    name: string;
    avatar?: string;
  };
}

@Component({
  selector: 'pmst-news-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="news-page py-8">
      <div class="container mx-auto px-4">
        <h1 class="text-3xl md:text-4xl font-bold mb-8">News & Updates</h1>

        <!-- Filters -->
        <div class="flex flex-wrap gap-2 mb-8">
          @for (category of categories(); track category) {
            <button
              (click)="setCategory(category)"
              [class.bg-indigo-600]="selectedCategory() === category"
              [class.text-white]="selectedCategory() === category"
              [class.bg-gray-200]="selectedCategory() !== category"
              [class.text-gray-700]="selectedCategory() !== category"
              class="px-4 py-2 rounded-full font-medium transition-colors"
            >
              {{ category }}
            </button>
          }
        </div>

        <!-- Articles Grid -->
        @if (loading()) {
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            @for (i of [1, 2, 3, 4, 5, 6]; track i) {
              <div class="animate-pulse bg-white rounded-lg shadow-md overflow-hidden">
                <div class="h-48 bg-gray-200"></div>
                <div class="p-4 space-y-3">
                  <div class="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div class="h-6 bg-gray-200 rounded"></div>
                  <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            @for (article of articles(); track article.id) {
              <article class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <a [routerLink]="['/news', article.slug]" class="block">
                  <div class="h-48 bg-gray-200 relative overflow-hidden">
                    @if (article.featuredImage) {
                      <img [src]="article.featuredImage" [alt]="article.title" class="w-full h-full object-cover">
                    }
                  </div>
                  <div class="p-4">
                    <span class="text-sm text-indigo-600 font-medium">{{ article.category }}</span>
                    <h2 class="text-lg font-semibold mt-2 text-gray-900 line-clamp-2">{{ article.title }}</h2>
                    <p class="text-gray-600 mt-2 text-sm line-clamp-2">{{ article.excerpt }}</p>
                    <div class="flex items-center mt-4 text-sm text-gray-500">
                      <span>{{ article.publishedAt | date:'mediumDate' }}</span>
                      <span class="mx-2">•</span>
                      <span>{{ article.author.name }}</span>
                    </div>
                  </div>
                </a>
              </article>
            }
          </div>
        }

        <!-- Pagination -->
        <div class="flex justify-center mt-12 space-x-2">
          <button 
            (click)="prevPage()"
            [disabled]="currentPage() === 1"
            class="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition-colors"
          >
            Previous
          </button>
          <span class="px-4 py-2 text-gray-700">
            Page {{ currentPage() }} of {{ totalPages() }}
          </span>
          <button 
            (click)="nextPage()"
            [disabled]="currentPage() === totalPages()"
            class="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [``]
})
export class NewsListComponent {
  categories = signal(['All', 'Fashion', 'Events', 'Interviews', 'Industry']);
  selectedCategory = signal('All');
  articles = signal<NewsArticle[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  totalPages = signal(1);

  constructor() {
    // Load mock data
    this.loadArticles();
  }

  private loadArticles(): void {
    // Mock data - replace with API call
    const mockArticles: NewsArticle[] = [
      {
        id: '1',
        title: '2024 Fashion Week Highlights: Top Models to Watch',
        slug: '2024-fashion-week-highlights',
        excerpt: 'Discover the rising stars who captured attention at this year\'s major fashion weeks around the globe.',
        category: 'Fashion',
        publishedAt: new Date().toISOString(),
        author: { name: 'Editor' }
      },
      {
        id: '2',
        title: 'Behind the Scenes: Nepal\'s Growing Modeling Industry',
        slug: 'nepal-modeling-industry',
        excerpt: 'An in-depth look at how the modeling scene is evolving in Nepal and creating new opportunities.',
        category: 'Industry',
        publishedAt: new Date().toISOString(),
        author: { name: 'Sarah Johnson' }
      },
      {
        id: '3',
        title: 'Exclusive Interview: Rising Star Priya Sharma',
        slug: 'interview-priya-sharma',
        excerpt: 'We sat down with the breakout model to discuss her journey from Kathmandu to international runways.',
        category: 'Interviews',
        publishedAt: new Date().toISOString(),
        author: { name: 'Editor' }
      },
      {
        id: '4',
        title: 'Upcoming Casting Calls: May 2024',
        slug: 'casting-calls-may-2024',
        excerpt: 'Don\'t miss these exciting opportunities. Major brands are looking for fresh faces this month.',
        category: 'Events',
        publishedAt: new Date().toISOString(),
        author: { name: 'Casting Team' }
      },
      {
        id: '5',
        title: 'Sustainable Fashion: Models Leading the Change',
        slug: 'sustainable-fashion-models',
        excerpt: 'How models are using their platforms to promote eco-friendly fashion choices and brands.',
        category: 'Fashion',
        publishedAt: new Date().toISOString(),
        author: { name: 'Green Team' }
      },
      {
        id: '6',
        title: 'PMST Annual Gala: Save the Date',
        slug: 'pmst-annual-gala-2024',
        excerpt: 'Join us for our biggest event of the year celebrating excellence in modeling and fashion.',
        category: 'Events',
        publishedAt: new Date().toISOString(),
        author: { name: 'Events Team' }
      }
    ];

    setTimeout(() => {
      this.articles.set(mockArticles);
      this.totalPages.set(5);
      this.loading.set(false);
    }, 500);
  }

  setCategory(category: string): void {
    this.selectedCategory.set(category);
    this.currentPage.set(1);
    this.loading.set(true);
    // Re-load with filter
    this.loadArticles();
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }
}
