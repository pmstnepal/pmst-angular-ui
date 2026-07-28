import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GallerySummary } from '../../core/models';
import { GalleryService } from '../../core/services/gallery.service';
import { ImageUrlMapperService } from '../../services/image-url-mapper.service';

@Component({
  selector: 'pmst-showcase-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="pmst-gallery-wrapper">
      <!-- Search Form -->
      <form class="pmst-gallery-search-form" (submit)="onSearch($event)">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          placeholder="Search galleries..."
          [ngModelOptions]="{ standalone: true }"
        >
        <button type="submit" class="pmst-search-btn">SEARCH</button>
        @if (searchTerm()) {
          <a (click)="clearSearch()" class="pmst-reset">View All</a>
        }
      </form>

      @if (searchTerm()) {
        <div class="pmst-search-info">Searching galleries for: <strong>{{ searchTerm() }}</strong></div>
      }

      <!-- Gallery Grid -->
      @if (loading()) {
        <div class="pmst-grid">
          @for (i of [1,2,3,4,5,6,7,8]; track i) {
            <div class="pmst-grid-item animate-pulse">
              <div class="pmst-image-placeholder"></div>
              <div class="pmst-title-placeholder"></div>
              <div class="pmst-meta-placeholder"></div>
            </div>
          }
        </div>
      } @else if (filteredItems().length === 0) {
        <div class="pmst-no-results">
          <p>No galleries found matching "{{ searchTerm() }}"</p>
        </div>
      } @else {
        <div class="pmst-grid">
          @for (gallery of filteredItems(); track gallery.id) {
            <a [routerLink]="['/showcase', gallery.slug]" class="block">
              <div class="pmst-grid-item pmst-card-glow">
                @if (gallery.featuredImage) {
                  <img [src]="imageMapper.mapUrl(gallery.featuredImage)" [alt]="gallery.title">
                } @else {
                  <div class="pmst-image-fallback"></div>
                }
                <h4>{{ gallery.title }}</h4>
                <div class="pmst-meta">By {{ gallery.authorName || 'PMST US-Nepal' }}</div>
                <span class="pmst-readmore">View Gallery</span>
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
              (click)="currentPage.set($index + 1); loadGalleries()"
              [class.current]="$index + 1 === currentPage()"
              class="page-numbers"
            >
              {{ $index + 1 }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: []
})
export class ShowcaseListComponent implements OnInit {
  galleries = signal<GallerySummary[]>([]);
  loading = signal(true);
  currentPage = signal(0);
  totalPages = signal(1);
  searchTerm = signal('');

  constructor(
    private galleryService: GalleryService,
    public imageMapper: ImageUrlMapperService
  ) {}

  ngOnInit(): void {
    this.loadGalleries();
  }

  loadGalleries(): void {
    this.loading.set(true);
    const search = this.searchTerm() || undefined;
    this.galleryService.getGalleries(this.currentPage(), 12, 'createdAt,desc', search).subscribe({
      next: res => {
        this.galleries.set(res.content);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filteredItems = () => {
    return this.galleries();
  };

  pageArray = () => Array(this.totalPages());

  onSearch(event: Event): void {
    event.preventDefault();
    this.currentPage.set(0);
    this.loadGalleries();
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.currentPage.set(0);
    this.loadGalleries();
  }
}
