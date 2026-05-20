import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NewsArticle } from '../../core/models';
import { ArticleService } from '../../core/services/article.service';
import { ImageUrlMapperService } from '../../services/image-url-mapper.service';

@Component({
  selector: 'pmst-news-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="news-page" style="background:#f8f8f8; min-height:100vh;">

      <!-- Page Header -->
      <div class="py-10" style="background:#1a1a2e;">
        <div class="container mx-auto px-4">
          <p class="text-red-400 text-xs font-semibold uppercase tracking-widest mb-2">Stories</p>
          <h1 class="text-3xl md:text-4xl font-extrabold text-white uppercase tracking-wide">News &amp; Updates</h1>
        </div>
      </div>

      <div class="container mx-auto px-4 py-10">

        <!-- Category Filters -->
        <div class="flex flex-wrap gap-2 mb-8">
          @for (category of categories(); track category) {
            <button
              (click)="setCategory(category)"
              class="px-4 py-2 rounded font-semibold text-sm uppercase tracking-wide transition-colors"
              [style.background]="selectedCategory() === category ? '#c0392b' : '#e5e7eb'"
              [style.color]="selectedCategory() === category ? '#fff' : '#374151'"
            >
              {{ category }}
            </button>
          }
        </div>

        <!-- Articles Grid -->
        @if (loading()) {
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="animate-pulse bg-white rounded-lg shadow overflow-hidden">
                <div class="h-48 bg-gray-200"></div>
                <div class="p-4 space-y-3">
                  <div class="h-3 bg-gray-200 rounded w-1/4"></div>
                  <div class="h-5 bg-gray-200 rounded"></div>
                  <div class="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            }
          </div>
        } @else if (articles().length === 0) {
          <div class="text-center py-20 text-gray-500">
            <p class="text-lg font-medium">No articles found.</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            @for (article of articles(); track article.id) {
              <article class="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow group">
                <a [routerLink]="['/news', article.slug]" class="block">
                  <div class="h-48 overflow-hidden relative">
                    @if (article.featuredImage) {
                      <img [src]="imageMapper.mapUrl(article.featuredImage)" [alt]="article.title"
                           class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                    } @else {
                      <div class="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span class="text-gray-400 text-xs uppercase">No image</span>
                      </div>
                    }
                    <span class="absolute top-3 left-3 text-white text-xs font-bold uppercase px-2 py-1 rounded" style="background:#c0392b;">
                      {{ article.category | uppercase }}
                    </span>
                  </div>
                  <div class="p-4">
                    <h2 class="text-base font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-red-700 transition-colors">{{ article.title }}</h2>
                    <p class="text-gray-500 mt-2 text-sm line-clamp-2">{{ article.excerpt }}</p>
                    <p class="text-xs text-gray-400 mt-3">{{ article.publishedAt | date:'mediumDate' }}</p>
                  </div>
                </a>
              </article>
            }
          </div>
        }

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="flex justify-center items-center mt-12 gap-3">
            <button
              (click)="prevPage()"
              [disabled]="currentPage() === 0"
              class="px-5 py-2 rounded font-semibold text-sm uppercase disabled:opacity-40 transition-colors"
              style="background:#c0392b; color:#fff;">
              ← Previous
            </button>
            <span class="text-gray-600 text-sm">
              Page {{ currentPage() + 1 }} of {{ totalPages() }}
            </span>
            <button
              (click)="nextPage()"
              [disabled]="currentPage() + 1 >= totalPages()"
              class="px-5 py-2 rounded font-semibold text-sm uppercase disabled:opacity-40 transition-colors"
              style="background:#c0392b; color:#fff;">
              Next →
            </button>
          </div>
        }

        <!-- Submit CTA -->
        <div class="mt-14 text-center">
          <a routerLink="/submit/article"
             class="inline-block text-white font-bold px-8 py-3 rounded uppercase tracking-wide text-sm hover:opacity-90 transition-opacity"
             style="background:#c0392b;">SUBMIT YOUR ARTICLE / NEWS</a>
        </div>
      </div>
    </div>
  `,
  styles: [``]
})
export class NewsListComponent implements OnInit {
  categories = signal(['All', 'Entertainment', 'Nepal News', 'Events']);
  selectedCategory = signal('All');
  articles = signal<NewsArticle[]>([]);
  loading = signal(true);
  currentPage = signal(0);
  totalPages = signal(1);

  constructor(
    private articleService: ArticleService,
    public imageMapper: ImageUrlMapperService
  ) {}

  ngOnInit(): void {
    this.loadArticles();
  }

  private loadArticles(): void {
    this.loading.set(true);
    const cat = this.selectedCategory();
    const page = this.currentPage();
    
    this.articleService.getArticles(page, 9, cat === 'All' ? undefined : cat).subscribe({
      next: res => {
        this.articles.set(res.content);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setCategory(category: string): void {
    this.selectedCategory.set(category);
    this.currentPage.set(0);
    this.loadArticles();
  }

  prevPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.loadArticles();
    }
  }

  nextPage(): void {
    if (this.currentPage() + 1 < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadArticles();
    }
  }
}
