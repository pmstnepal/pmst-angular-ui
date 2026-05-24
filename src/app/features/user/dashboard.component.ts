import { Component, signal, computed, effect, untracked, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ArticleService } from '../../core/services/article.service';
import { GalleryService } from '../../core/services/gallery.service';

@Component({
  selector: 'pmst-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard py-8">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-3xl font-bold text-gray-900">
            {{ isAdmin() ? 'Admin Dashboard' : 'My Dashboard' }}
          </h1>
          <div class="flex gap-3">
            <a routerLink="/submit/article" class="pmst-btn-primary flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              New Article
            </a>
            <a routerLink="/submit/gallery" class="pmst-btn-primary flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              New Gallery
            </a>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              {{ isAdmin() ? 'Total Articles' : 'My Articles' }}
            </h3>
            <p class="text-3xl font-bold text-indigo-600">{{ stats().articles }}</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              {{ isAdmin() ? 'Total Galleries' : 'My Galleries' }}
            </h3>
            <p class="text-3xl font-bold text-pink-600">{{ stats().galleries }}</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Showing</h3>
            <p class="text-3xl font-bold text-green-600">{{ filteredItems().length }}</p>
          </div>
        </div>

        <!-- Toast notification -->
        @if (toastMessage()) {
          <div class="mb-4 px-4 py-3 rounded-lg text-sm font-medium"
               [class.bg-green-100]="!toastIsError()"
               [class.text-green-800]="!toastIsError()"
               [class.bg-red-100]="toastIsError()"
               [class.text-red-800]="toastIsError()">
            {{ toastMessage() }}
          </div>
        }

        <!-- Content Management Table -->
        <div class="bg-white rounded-lg shadow">
          <!-- Filter Bar -->
          <div class="p-4 border-b border-gray-200 flex flex-wrap gap-3 items-center">
            <!-- Type filter -->
            <select [value]="filterType()" (change)="filterType.set($any($event.target).value)"
                    class="db-filter-select">
              <option value="all">All Types</option>
              <option value="article">Articles Only</option>
              <option value="gallery">Galleries Only</option>
            </select>

            <!-- Status filter -->
            <select [value]="filterStatus()" (change)="filterStatus.set($any($event.target).value)"
                    class="db-filter-select">
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="pending">Pending</option>
              <option value="draft">Draft</option>
              <option value="rejected">Rejected</option>
            </select>

            <!-- Sort -->
            <select [value]="sortOrder()" (change)="sortOrder.set($any($event.target).value)"
                    class="db-filter-select">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>

            <!-- Page size -->
            <select [value]="pageSize()" (change)="onPageSizeChange($any($event.target).value)"
                    class="db-filter-select ml-auto">
              <option value="10">10 / page</option>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
            </select>
            <span class="text-sm text-gray-500 whitespace-nowrap">
              {{ filteredItems().length }} items
            </span>
          </div>

          <!-- Loading -->
          @if (loading()) {
            <div class="p-12 text-center text-gray-400">
              <svg class="animate-spin w-8 h-8 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading content...
            </div>
          } @else if (filteredItems().length === 0) {
            <div class="p-12 text-center text-gray-400">
              <p class="text-lg">No content found</p>
              <p class="text-sm mt-1">Try adjusting your filters or create new content.</p>
            </div>
          } @else {
            <div class="divide-y divide-gray-100">
              @for (item of pagedItems(); track item.id) {
                <div class="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                  <!-- Thumbnail -->
                  <div class="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-gray-100">
                    @if (item.featuredImage) {
                      <img [src]="item.featuredImage" [alt]="item.title"
                           class="w-full h-full object-cover">
                    } @else {
                      <div class="w-full h-full flex items-center justify-center text-gray-400">
                        @if (item.type === 'Article') {
                          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                          </svg>
                        } @else {
                          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                        }
                      </div>
                    }
                  </div>

                  <!-- Content info -->
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-gray-900 truncate">{{ item.title }}</p>
                    <div class="flex items-center gap-2 mt-1 flex-wrap">
                      <span class="db-badge"
                            [class.db-badge-article]="item.type === 'Article'"
                            [class.db-badge-gallery]="item.type === 'Gallery'">
                        {{ item.type }}
                      </span>
                      @if (isAdmin() && item.authorName) {
                        <span class="text-xs text-gray-500">by {{ item.authorName }}</span>
                      }
                      <span class="text-xs text-gray-400">{{ item.date | date:'mediumDate' }}</span>
                    </div>
                  </div>

                  <!-- Status badge (read-only display) -->
                  <span class="db-status-badge flex-shrink-0"
                        [class.db-status-published]="item.status === 'published'"
                        [class.db-status-pending]="item.status === 'pending'"
                        [class.db-status-draft]="item.status === 'draft'"
                        [class.db-status-rejected]="item.status === 'rejected'">
                    {{ item.status }}
                  </span>

                  <!-- Action buttons -->
                  <div class="flex-shrink-0 flex items-center gap-2">

                    <!-- Approve button: admin only, pending items -->
                    @if (isAdmin() && item.status === 'pending') {
                      @if (savingId() === item.id) {
                        <span class="db-approve-btn db-approve-btn-loading" disabled>
                          <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </span>
                      } @else {
                        <button (click)="approveItem(item)" class="db-approve-btn" title="Approve">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                          </svg>
                          Approve
                        </button>
                      }
                    }

                    <!-- Edit button -->
                    <a [routerLink]="item.type === 'Article' ? ['/submit/article/edit', item.id] : ['/submit/gallery/edit', item.id]"
                       class="db-action-btn" title="Edit">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </a>

                    <!-- Public view button (new tab, published only) -->
                    @if (item.status === 'published' && item.slug) {
                      <a [href]="item.type === 'Article' ? '/news/' + item.slug : '/showcase/' + item.slug"
                         target="_blank" rel="noopener"
                         class="db-action-btn" title="View public page">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                      </a>
                    }

                    <!-- Delete button: all users -->
                    @if (deletingId() === item.id) {
                      <span class="db-action-btn db-action-btn-danger" style="cursor:default">
                        <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                    } @else {
                      <button (click)="deleteItem(item)" class="db-action-btn db-action-btn-danger" title="Delete">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    }

                  </div>
                </div>
              }
            </div>

            <!-- Pagination bar -->
            @if (totalPages() > 1) {
              <div class="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <span class="text-sm text-gray-500">
                  Page {{ currentPage() + 1 }} of {{ totalPages() }}
                </span>
                <div class="flex items-center gap-1">
                  <!-- Prev -->
                  <button (click)="goToPage(currentPage() - 1)"
                          [disabled]="currentPage() === 0"
                          class="db-page-btn" [class.db-page-btn-disabled]="currentPage() === 0">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>

                  <!-- Page numbers -->
                  @for (p of pageNumbers(); track p) {
                    @if (p === -1) {
                      <span class="db-page-ellipsis">…</span>
                    } @else {
                      <button (click)="goToPage(p)"
                              class="db-page-btn"
                              [class.db-page-btn-active]="p === currentPage()">
                        {{ p + 1 }}
                      </button>
                    }
                  }

                  <!-- Next -->
                  <button (click)="goToPage(currentPage() + 1)"
                          [disabled]="currentPage() === totalPages() - 1"
                          class="db-page-btn" [class.db-page-btn-disabled]="currentPage() === totalPages() - 1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .db-filter-select {
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 13px;
      color: #374151;
      background: #fff;
      cursor: pointer;
    }
    .db-filter-select:focus { outline: none; border-color: #6366f1; }

    .db-badge {
      display: inline-block;
      padding: 1px 8px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
    }
    .db-badge-article { background: #e0e7ff; color: #3730a3; }
    .db-badge-gallery { background: #fce7f3; color: #9d174d; }

    .db-status-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      text-transform: capitalize;
    }
    .db-status-published { background: #d1fae5; color: #065f46; }
    .db-status-pending   { background: #fef3c7; color: #92400e; }
    .db-status-draft     { background: #f3f4f6; color: #6b7280; }
    .db-status-rejected  { background: #fee2e2; color: #991b1b; }

    .db-approve-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      background: #ea580c;
      color: #fff;
      border: none;
      cursor: pointer;
      transition: background 0.15s;
    }
    .db-approve-btn:hover { background: #c2410c; }
    .db-approve-btn-loading { opacity: 0.6; cursor: default; }

    .db-action-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background: #f3f4f6;
      color: #6b7280;
      transition: background 0.15s, color 0.15s;
    }
    .db-action-btn:hover { background: #e0e7ff; color: #4338ca; }
    .db-action-btn-danger { color: #dc2626; }
    .db-action-btn-danger:hover { background: #fee2e2; color: #991b1b; }

    .db-page-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 32px;
      padding: 0 6px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #e5e7eb;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .db-page-btn:hover:not(:disabled) { background: #e0e7ff; color: #4338ca; border-color: #c7d2fe; }
    .db-page-btn-active { background: #6366f1 !important; color: #fff !important; border-color: #6366f1 !important; }
    .db-page-btn-disabled { opacity: 0.35; cursor: default; }
    .db-page-ellipsis { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; font-size: 13px; color: #9ca3af; }

    .animate-spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private articleService = inject(ArticleService);
  private galleryService = inject(GalleryService);

  readonly isAdmin = computed(() => this.authService.isAdmin());

  stats = signal({ articles: 0, galleries: 0 });
  loading = signal(true);
  savingId = signal<string | null>(null);
  deletingId = signal<string | null>(null);
  toastMessage = signal('');
  toastIsError = signal(false);

  filterType = signal('all');
  filterStatus = signal('all');
  sortOrder = signal('newest');
  currentPage = signal(0);
  pageSize = signal(10);

  private allItems = signal<ContentItem[]>([]);

  filteredItems = computed(() => {
    let items = this.allItems();
    const type = this.filterType();
    const status = this.filterStatus();
    const sort = this.sortOrder();
    if (type !== 'all') items = items.filter(i => i.type.toLowerCase() === type);
    if (status !== 'all') items = items.filter(i => i.status === status);
    return [...items].sort((a, b) => {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return sort === 'newest' ? diff : -diff;
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredItems().length / this.pageSize())));

  pagedItems = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.filteredItems().slice(start, start + this.pageSize());
  });

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const cur = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const pages: number[] = [0];
    if (cur > 2) pages.push(-1);
    for (let i = Math.max(1, cur - 1); i <= Math.min(total - 2, cur + 1); i++) pages.push(i);
    if (cur < total - 3) pages.push(-1);
    pages.push(total - 1);
    return pages;
  });

  constructor() {
    effect(() => {
      this.filterType();
      this.filterStatus();
      this.sortOrder();
      this.pageSize();
      untracked(() => this.currentPage.set(0));
    });
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  goToPage(page: number): void {
    const clamped = Math.max(0, Math.min(page, this.totalPages() - 1));
    this.currentPage.set(clamped);
  }

  onPageSizeChange(value: string): void {
    this.pageSize.set(Number(value));
  }

  approveItem(item: ContentItem): void {
    this.savingId.set(item.id);
    const call$ = item.type === 'Article'
      ? this.articleService.updateArticleStatus(item.id, 'published')
      : this.galleryService.updateGalleryStatus(item.id, 'published');
    call$.subscribe({
      next: () => {
        this.allItems.update(items =>
          items.map(i => i.id === item.id ? { ...i, status: 'published' } : i)
        );
        this.savingId.set(null);
        this.showToast('Content approved and published.', false);
      },
      error: () => {
        this.savingId.set(null);
        this.showToast('Failed to approve. Please try again.', true);
      }
    });
  }

  deleteItem(item: ContentItem): void {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    this.deletingId.set(item.id);
    const call$ = item.type === 'Article'
      ? this.articleService.deleteArticle(item.id)
      : this.galleryService.deleteGallery(item.id);
    call$.subscribe({
      next: () => {
        this.allItems.update(items => items.filter(i => i.id !== item.id));
        this.stats.update(s => item.type === 'Article'
          ? { ...s, articles: s.articles - 1 }
          : { ...s, galleries: s.galleries - 1 }
        );
        this.deletingId.set(null);
        this.showToast('Content deleted.', false);
      },
      error: () => {
        this.deletingId.set(null);
        this.showToast('Failed to delete. Please try again.', true);
      }
    });
  }

  private showToast(msg: string, isError: boolean): void {
    this.toastMessage.set(msg);
    this.toastIsError.set(isError);
    setTimeout(() => this.toastMessage.set(''), 3000);
  }

  private loadDashboardData(): void {
    const user = this.authService.user();
    if (!user) { this.loading.set(false); return; }

    const isAdmin = this.authService.isAdmin();
    const authorId = user.id;
    let articlesLoaded = false;
    let galleriesLoaded = false;

    const checkDone = () => {
      if (articlesLoaded && galleriesLoaded) this.loading.set(false);
    };

    const articlesCall$ = isAdmin
      ? this.articleService.getAllArticles(0, 100)
      : this.articleService.getMyArticles(authorId, 0, 100);

    articlesCall$.subscribe({
      next: (response) => {
        this.stats.update(s => ({ ...s, articles: response.totalElements }));
        const mapped: ContentItem[] = response.content.map((a: any) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          type: 'Article' as const,
          status: a.status || 'published',
          date: a.createdAt || a.publishedAt || new Date().toISOString(),
          featuredImage: a.featuredImage,
          authorName: a.authorName
        }));
        this.allItems.update(current => [...current, ...mapped]);
        articlesLoaded = true;
        checkDone();
      },
      error: () => { articlesLoaded = true; checkDone(); }
    });

    const galleriesCall$ = isAdmin
      ? this.galleryService.getAllGalleries(0, 100)
      : this.galleryService.getMyGalleries(authorId, 0, 100);

    galleriesCall$.subscribe({
      next: (response) => {
        this.stats.update(s => ({ ...s, galleries: response.totalElements }));
        const mapped: ContentItem[] = response.content.map((g: any) => ({
          id: g.id,
          title: g.title,
          slug: g.slug,
          type: 'Gallery' as const,
          status: g.status || 'pending',
          date: g.createdAt || new Date().toISOString(),
          featuredImage: g.featuredImage,
          authorName: g.authorName
        }));
        this.allItems.update(current => [...current, ...mapped]);
        galleriesLoaded = true;
        checkDone();
      },
      error: () => { galleriesLoaded = true; checkDone(); }
    });
  }
}

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  type: 'Article' | 'Gallery';
  status: string;
  date: string;
  featuredImage?: string;
  authorName?: string;
}
