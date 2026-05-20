import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GallerySummary } from '../../core/models';
import { GalleryService } from '../../core/services/gallery.service';
import { ImageUrlMapperService } from '../../services/image-url-mapper.service';

@Component({
  selector: 'pmst-showcase-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div style="background:#f8f8f8; min-height:100vh;">

      <!-- Page Header -->
      <div class="py-10" style="background:#1a1a2e;">
        <div class="container mx-auto px-4">
          <p class="text-red-400 text-xs font-semibold uppercase tracking-widest mb-2">Photography</p>
          <h1 class="text-3xl md:text-4xl font-extrabold text-white uppercase tracking-wide">Model &amp; Gallery</h1>
          <p class="text-gray-400 text-sm mt-2">Discover stunning photography from Nepali artists and events.</p>
        </div>
      </div>

      <div class="container mx-auto px-4 py-10">

        <!-- Gallery Grid -->
        @if (loading()) {
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            @for (i of [1,2,3,4,5,6,7,8]; track i) {
              <div class="animate-pulse rounded-lg overflow-hidden aspect-[4/3] bg-gray-200"></div>
            }
          </div>
        } @else if (galleries().length === 0) {
          <div class="text-center py-20 text-gray-500">
            <p class="text-lg font-medium">No galleries found.</p>
          </div>
        } @else {
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            @for (gallery of galleries(); track gallery.id) {
              <a [routerLink]="['/showcase', gallery.slug]" class="relative group overflow-hidden rounded-lg aspect-[4/3] block bg-gray-200">
                @if (gallery.featuredImage) {
                  <img [src]="imageMapper.mapUrl(gallery.featuredImage)" [alt]="gallery.title"
                       class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                }
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent">
                  <div class="absolute bottom-0 left-0 right-0 p-3">
                    <h3 class="text-white font-bold text-xs uppercase leading-tight line-clamp-2">{{ gallery.title }}</h3>
                    <p class="text-gray-300 text-xs mt-1">By PMST US-Nepal</p>
                  </div>
                </div>
              </a>
            }
          </div>
        }

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="flex justify-center items-center mt-12 gap-3">
            <button (click)="prevPage()" [disabled]="currentPage() === 0"
              class="px-5 py-2 rounded font-semibold text-sm uppercase disabled:opacity-40"
              style="background:#c0392b; color:#fff;">← Previous</button>
            <span class="text-gray-600 text-sm">Page {{ currentPage() + 1 }} of {{ totalPages() }}</span>
            <button (click)="nextPage()" [disabled]="currentPage() + 1 >= totalPages()"
              class="px-5 py-2 rounded font-semibold text-sm uppercase disabled:opacity-40"
              style="background:#c0392b; color:#fff;">Next →</button>
          </div>
        }

        <!-- CTA -->
        <div class="mt-16 rounded-xl p-10 text-center text-white" style="background:#1a1a2e;">
          <h2 class="text-2xl font-extrabold uppercase mb-3">Model, Event, Gallery or Photography</h2>
          <p class="text-gray-400 mb-6 text-sm max-w-xl mx-auto">
            Become a part of our creative community! Whether you're a model, photographer, or someone who loves capturing beautiful moments — showcase your work and get recognized.
          </p>
          <div class="flex flex-wrap justify-center gap-3">
            <a routerLink="/submit/gallery"
               class="text-white font-bold px-8 py-3 rounded uppercase tracking-wide text-sm hover:opacity-90"
               style="background:#c0392b;">SUBMIT YOUR GALLERY</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [``]
})
export class ShowcaseListComponent implements OnInit {
  galleries = signal<GallerySummary[]>([]);
  loading = signal(true);
  currentPage = signal(0);
  totalPages = signal(1);

  constructor(
    private galleryService: GalleryService,
    public imageMapper: ImageUrlMapperService
  ) {}

  ngOnInit(): void {
    this.loadGalleries();
  }

  private loadGalleries(): void {
    this.loading.set(true);
    this.galleryService.getGalleries(this.currentPage(), 12).subscribe({
      next: res => { 
        this.galleries.set(res.content); 
        this.totalPages.set(res.totalPages); 
        this.loading.set(false); 
      },
      error: () => this.loading.set(false)
    });
  }

  prevPage(): void {
    if (this.currentPage() > 0) { this.currentPage.update(p => p - 1); this.loadGalleries(); }
  }

  nextPage(): void {
    if (this.currentPage() + 1 < this.totalPages()) { this.currentPage.update(p => p + 1); this.loadGalleries(); }
  }
}
