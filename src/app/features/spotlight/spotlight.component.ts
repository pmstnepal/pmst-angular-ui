import { Component, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ArticleService } from '../../core/services/article.service';
import { ImageUrlMapperService } from '../../services/image-url-mapper.service';
import { NewsArticle } from '../../core/models';

@Component({
  selector: 'pmst-spotlight',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="pmst-gallery-wrapper">
      <!-- Category Tabs -->
      <div class="pmst-category-tabs">
        <button
          (click)="setCategory('Entertainment')"
          [class.active]="selectedCategory() === 'Entertainment'"
          class="pmst-tab-btn">
          Entertainment
        </button>
        <button
          (click)="setCategory('Nepal News')"
          [class.active]="selectedCategory() === 'Nepal News'"
          class="pmst-tab-btn">
          Nepal News
        </button>
      </div>

      <!-- Search Form -->
      <form class="pmst-gallery-search-form" (submit)="onSearch($event)">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          placeholder="Search posts..."
          [ngModelOptions]="{ standalone: true }"
        >
        <button type="submit" class="pmst-search-btn">SEARCH</button>
        @if (searchTerm()) {
          <a (click)="clearSearch()" class="pmst-reset">View All</a>
        }
      </form>

      @if (searchTerm()) {
        <div class="pmst-search-info">Searching posts for: <strong>{{ searchTerm() }}</strong></div>
      }

      <!-- Post Grid -->
      @if (loading()) {
        <div class="pmst-grid">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="pmst-grid-item animate-pulse">
              <div class="pmst-image-placeholder"></div>
              <div class="pmst-title-placeholder"></div>
              <div class="pmst-meta-placeholder"></div>
              <div class="pmst-excerpt-placeholder"></div>
            </div>
          }
        </div>
      } @else {
        <div class="pmst-post-gallery">
          @if (filteredItems().length === 0) {
            <div class="pmst-no-results">
              <p>No articles found matching "{{ searchTerm() }}"</p>
            </div>
          } @else {
            <div class="pmst-grid">
              @for (item of filteredItems(); track item.id) {
                <a [routerLink]="['/news', item.slug]" class="block">
                  <div class="pmst-grid-item pmst-card-glow">
                    @if (item.featuredImage) {
                      <img [src]="imageMapper.mapUrl(item.featuredImage)" [alt]="item.title">
                    } @else {
                      <div class="pmst-image-fallback"></div>
                    }
                    <h4>{{ item.title }}</h4>
                    <div class="pmst-meta">By {{ item.authorName || 'PMST US-Nepal' }} on {{ formatDate(item.publishedAt) }}</div>
                    <div class="pmst-excerpt">{{ item.excerpt }}</div>
                    <span class="pmst-readmore">Read More</span>
                  </div>
                </a>
              }
            </div>
          }

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="pmst-pagination">
              @for (page of pageArray(); track $index) {
                <button
                  (click)="currentPage.set($index + 1); loadArticles()"
                  [class.current]="$index + 1 === currentPage()"
                  class="page-numbers"
                >
                  {{ $index + 1 }}
                </button>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: []
})
export class SpotlightComponent implements OnInit {
  searchTerm = signal('');
  currentPage = signal(0);
  itemsPerPage = 17;
  loading = signal(true);
  articles = signal<NewsArticle[]>([]);
  totalPages = signal(1);
  selectedCategory = signal('Entertainment');

  constructor(
    private articleService: ArticleService,
    public imageMapper: ImageUrlMapperService
  ) {}

  ngOnInit(): void {
    this.loadArticles();
  }

  setCategory(category: string): void {
    this.selectedCategory.set(category);
    this.currentPage.set(0);
    this.searchTerm.set('');
    this.loadArticles();
  }

  loadArticles(): void {
    this.loading.set(true);
    const page = this.currentPage();
    const search = this.searchTerm() || undefined;
    const category = this.selectedCategory();

    this.articleService.getArticles(page, this.itemsPerPage, category, 'publishedAt,desc', search).subscribe({
      next: res => {
        this.articles.set(res.content);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filteredItems = () => {
    return this.articles();
  };

  pageArray = () => Array(this.totalPages());

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  onSearch(event: Event): void {
    event.preventDefault();
    this.currentPage.set(0);
    this.loadArticles();
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.currentPage.set(0);
    this.loadArticles();
  }
}
