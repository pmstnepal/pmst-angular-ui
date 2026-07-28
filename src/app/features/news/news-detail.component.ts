import { Component, OnInit, signal, inject, PLATFORM_ID, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { isPlatformBrowser, DatePipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { CommentSectionComponent } from '../../shared/components/comments/comment-section.component';
import { ArticleDetail, RelatedArticle } from '../../core/models';
import { ArticleService } from '../../core/services/article.service';
import { ImageUrlMapperService } from '../../services/image-url-mapper.service';
import { UserInterestService } from '../../services/user-interest.service';

@Component({
  selector: 'pmst-news-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, CommentSectionComponent],
  template: `
    @if (loading()) {
      <div class="pmst-post-container">
        <div class="pmst-skeleton-hero"></div>
        <div class="pmst-skeleton-title"></div>
        <div class="pmst-skeleton-line"></div>
        <div class="pmst-skeleton-line pmst-skeleton-75"></div>
        <div class="pmst-skeleton-line"></div>
        <div class="pmst-skeleton-line pmst-skeleton-85"></div>
      </div>
    } @else if (notFound()) {
      <div class="pmst-post-container pmst-not-found">
        <h2 class="pmst-not-found-title">Article not found</h2>
        <a routerLink="/spotlight" class="pmst-back-link">← Back to Spotlight</a>
      </div>
    } @else {
      <div class="pmst-post-container">

        <!-- Google Ad Top -->
        <div [innerHTML]="googleAd"></div>

        <!-- Featured Hero: YouTube OR Blurred Image -->
        <div class="pmst-featured-wrapper">
          <div class="pmst-logo-overlay">
            <img src="/assets/images/logo/pmst-logo.png" alt="PMST Logo" />
          </div>

          @if (article().youtubeLink) {
            <div class="pmst-video-responsive">
              <iframe
                [src]="safeYoutubeUrl()"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen>
              </iframe>
            </div>
          } @else if (article().featuredImage) {
            <div class="pmst-featured-blur"></div>
            <div class="pmst-featured-center">
              <img [src]="imageMapper.mapUrl(article().featuredImage, article().imageKey)" [alt]="article().title" />
            </div>
          }
        </div>

        <!-- Reactions Placeholder -->
        <div class="pmst-reactions-placeholder">
          <span>❤️ Reactions</span>
        </div>

        <!-- Title & Meta -->
        <h1 class="pmst-title">{{ article().title }}</h1>
        <div class="pmst-meta">
          By PMST US-Nepal | {{ article().publishedAt | date:'mediumDate' }}
        </div>

        <!-- Article Content -->
        <div class="pmst-content" [innerHTML]="safeContent()"></div>

        <!-- Social Media Embed -->
        @if (article().embedCode) {
          <div class="pmst-social-section">
            <h3 class="pmst-social-title">📱 Social Media Highlight</h3>
            <div class="pmst-social-embed-container">
              <div class="pmst-social-embed-wrapper" [innerHTML]="safeEmbedCode()"></div>
            </div>
          </div>
        }

        <!-- Gallery Grid with Lightbox -->
        @if (galleryUrls().length > 0) {
          <div class="pmst-gallery-section">
            <h3 class="pmst-gallery-title">Gallery ({{ galleryUrls().length }} images)</h3>
            
            <!-- Thumbnail Grid - Dynamic based on image count -->
            <div class="pmst-gallery-grid" [class]="'pmst-gallery-count-' + galleryUrls().length">
              @for (img of galleryUrls(); track $index) {
                <div 
                  class="pmst-gallery-item"
                  (click)="openLightbox($index)">
                  <img [src]="img" alt="Gallery image {{ $index + 1 }}" loading="lazy" />
                  <div class="pmst-gallery-overlay">
                    <svg class="pmst-zoom-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                    </svg>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Lightbox (same as model gallery) -->
        @if (lightboxOpen()) {
          <div class="pmst-lightbox" (click)="closeLightbox()">
            <div class="pmst-lightbox-content" (click)="$event.stopPropagation()">
              <button class="pmst-lightbox-close" (click)="closeLightbox()">&times;</button>
              
              <img 
                [src]="galleryUrls()[activeImageIndex()]" 
                alt="Gallery image"
                class="pmst-lightbox-image">
              
              @if (galleryUrls().length > 1) {
                <button class="pmst-lightbox-nav prev" (click)="prevImage(); $event.stopPropagation()">
                  &#8249;
                </button>
                <button class="pmst-lightbox-nav next" (click)="nextImage(); $event.stopPropagation()">
                  &#8250;
                </button>
                <div class="pmst-lightbox-counter">
                  {{ activeImageIndex() + 1 }} / {{ galleryUrls().length }}
                </div>
              }
            </div>
          </div>
        }

        <!-- Google Ad Bottom -->
        <div [innerHTML]="googleAd"></div>

        <!-- Related Posts -->
        @if (relatedArticles().length > 0) {
          <div class="pmst-related-posts">
            <h3>You might like it</h3>
            <ul>
              @for (rel of relatedArticles(); track rel.id) {
                <li>
                  <a routerLink="/news/{{ rel.slug }}">{{ rel.title }}</a>
                </li>
              }
            </ul>
          </div>
        }

        <!-- Back link -->
        <div class="pmst-back-section">
          <a routerLink="/spotlight" class="pmst-back-link-primary">← Back to Spotlight</a>
        </div>
      </div>

      <!-- Comments -->
      <div class="pmst-comments-section">
        <pmst-comment-section [contentType]="'article'" [contentId]="article().id"></pmst-comment-section>
      </div>
    }
  `,
  styles: [`
    .pmst-post-container {
      background: #ffffff;
      color: #4a4a6a;
      padding: 40px;
      max-width: 1200px;
      margin: auto;
      border-radius: 10px;
    }
    .pmst-not-found {
      text-align: center;
      padding: 80px 40px;
    }
    .pmst-not-found-title {
      color: #fe5252;
      font-size: 24px;
    }
    .pmst-back-link {
      color: #6b7280;
      margin-top: 20px;
      display: inline-block;
    }
    .pmst-back-section {
      margin-top: 30px;
    }
    .pmst-back-link-primary {
      color: #fe5252;
      text-decoration: none;
      font-weight: 600;
    }
    .pmst-comments-section {
      background: #f3f4f6;
      padding: 0 40px 40px;
    }
    .pmst-social-section {
      margin: 40px 0;
    }
    .pmst-social-title {
      color: #fe5252;
      font-size: 20px;
      margin-bottom: 15px;
    }
    .pmst-ad {
      display: block;
    }
    .pmst-skeleton-75 {
      width: 75%;
    }
    .pmst-skeleton-85 {
      width: 85%;
    }
    .pmst-title {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 10px;
      color: #4a4a6a;
    }
    .pmst-meta {
      color: #6b7280;
      margin-bottom: 20px;
    }
    .pmst-content {
      line-height: 1.8;
      margin-bottom: 30px;
      color: #4a4a6a;
    }
    .pmst-featured-wrapper {
      position: relative;
      width: 100%;
      height: 690px;
      overflow: hidden;
      margin-bottom: 40px;
    }
    .pmst-featured-blur {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: #e5e7eb;
      filter: blur(20px);
      transform: scale(1.1);
    }
    .pmst-featured-center {
      position: relative;
      width: 100%; height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }
    .pmst-featured-center img {
      max-height: 95%; max-width: 95%;
      object-fit: contain;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .pmst-logo-overlay {
      position: absolute;
      top: 15px; right: 15px;
      z-index: 9;
      background: rgba(0,0,0,0.4);
      padding: 5px 8px;
      border-radius: 8px;
    }
    .pmst-logo-overlay img {
      height: 30px; width: auto;
      display: block; object-fit: contain; opacity: 0.95;
    }
    .pmst-video-responsive {
      position: relative;
      width: 100%; height: 100%;
    }
    .pmst-video-responsive iframe {
      width: 100%; height: 100%;
      border-radius: 10px;
    }
    .pmst-reactions-placeholder {
      margin: 20px 0;
      text-align: center;
      color: #aaa;
      font-size: 14px;
      padding: 10px;
      border: 1px dashed #444;
      border-radius: 8px;
    }
    .pmst-related-posts ul { padding-left: 20px; }
    .pmst-related-posts li { margin-bottom: 8px; }
    .pmst-related-posts a { color: #FE5252; text-decoration: none; }
    .pmst-related-posts a:hover { text-decoration: underline; }
    .pmst-social-embed-container { margin: 0 auto; text-align: center; }
    .pmst-social-embed-wrapper {
      max-width: 700px; margin: 0 auto;
      position: relative; overflow: hidden;
      padding-top: 56.25%;
    }
    .pmst-social-embed-wrapper iframe,
    .pmst-social-embed-wrapper blockquote {
      position: absolute !important;
      top: 0; left: 0;
      width: 100% !important; height: 100% !important;
    }
    .pmst-skeleton-hero {
      height: 400px; background: #2a2a2a;
      border-radius: 10px; margin-bottom: 30px;
      animation: pulse 1.5s infinite;
    }
    .pmst-skeleton-title {
      height: 36px; background: #2a2a2a;
      border-radius: 6px; margin-bottom: 16px; width: 70%;
      animation: pulse 1.5s infinite;
    }
    .pmst-skeleton-line {
      height: 16px; background: #2a2a2a;
      border-radius: 4px; margin-bottom: 12px; width: 100%;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    /* Gallery Grid with Lightbox Styles */
    .pmst-gallery-section {
      margin: 40px 0;
      background: #e5e7eb;
      padding: 24px;
      border-radius: 16px;
    }
    .pmst-gallery-title {
      color: #FE5252;
      font-size: 20px;
      margin-bottom: 20px;
      text-align: center;
    }
    .pmst-gallery-grid {
      display: flex;
      gap: 12px;
      width: 100%;
    }
    /* Dynamic sizing based on image count - all in one row */
    .pmst-gallery-grid.pmst-gallery-count-1 {
      max-width: 600px;
      margin: 0 auto;
    }
    .pmst-gallery-grid.pmst-gallery-count-1 .pmst-gallery-item {
      flex: 1;
    }
    .pmst-gallery-grid.pmst-gallery-count-2 .pmst-gallery-item {
      flex: 1;
    }
    .pmst-gallery-grid.pmst-gallery-count-3 .pmst-gallery-item,
    .pmst-gallery-grid.pmst-gallery-count-4 .pmst-gallery-item,
    .pmst-gallery-grid.pmst-gallery-count-5 .pmst-gallery-item,
    .pmst-gallery-grid.pmst-gallery-count-6 .pmst-gallery-item,
    .pmst-gallery-grid.pmst-gallery-count-7 .pmst-gallery-item,
    .pmst-gallery-grid.pmst-gallery-count-8 .pmst-gallery-item,
    .pmst-gallery-grid.pmst-gallery-count-9 .pmst-gallery-item {
      flex: 1;
    }
    .pmst-gallery-item {
      position: relative;
      aspect-ratio: 4/3;
      border-radius: 12px;
      overflow: hidden;
      cursor: zoom-in;
      display: block;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .pmst-gallery-item:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    }
    .pmst-gallery-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .pmst-gallery-item:hover img {
      transform: scale(1.1);
    }
    .pmst-gallery-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .pmst-gallery-item:hover .pmst-gallery-overlay {
      opacity: 1;
    }
    .pmst-zoom-icon {
      width: 40px;
      height: 40px;
      color: white;
    }
    /* Lightbox Styles (same as model gallery) */
    .pmst-lightbox {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.95);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pmst-lightbox-content {
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
    }
    .pmst-lightbox-image {
      max-width: 100%;
      max-height: 85vh;
      object-fit: contain;
    }
    .pmst-lightbox-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      transition: background 0.3s;
    }
    .pmst-lightbox-nav:hover {
      background: rgba(255,255,255,0.4);
    }
    .pmst-lightbox-nav.prev { left: -70px; }
    .pmst-lightbox-nav.next { right: -70px; }
    .pmst-lightbox-close {
      position: absolute;
      top: -50px;
      right: 0;
      background: none;
      border: none;
      color: white;
      font-size: 32px;
      cursor: pointer;
    }
    .pmst-lightbox-counter {
      position: absolute;
      bottom: -40px;
      left: 50%;
      transform: translateX(-50%);
      color: white;
      font-size: 14px;
    }
    @media (max-width: 768px) {
      .pmst-lightbox-nav.prev { left: 10px; }
      .pmst-lightbox-nav.next { right: 10px; }
      .pmst-post-container { padding: 20px 16px; }
      .pmst-featured-wrapper { height: auto !important; padding: 20px 0; background: #111; }
      .pmst-featured-blur { display: none !important; }
      .pmst-featured-center img { max-width: 100%; max-height: 400px; }
      .pmst-title { font-size: 22px; }
      .pmst-gallery-grid {
        flex-wrap: wrap;
      }
      .pmst-gallery-grid.pmst-gallery-count-1 .pmst-gallery-item {
        flex: 1;
      }
      .pmst-gallery-grid.pmst-gallery-count-2 .pmst-gallery-item {
        flex: 1;
      }
      .pmst-gallery-grid.pmst-gallery-count-3 .pmst-gallery-item,
      .pmst-gallery-grid.pmst-gallery-count-4 .pmst-gallery-item,
      .pmst-gallery-grid.pmst-gallery-count-5 .pmst-gallery-item,
      .pmst-gallery-grid.pmst-gallery-count-6 .pmst-gallery-item {
        flex: 1 1 calc(50% - 6px);
      }
      .pmst-gallery-grid.pmst-gallery-count-7 .pmst-gallery-item,
      .pmst-gallery-grid.pmst-gallery-count-8 .pmst-gallery-item,
      .pmst-gallery-grid.pmst-gallery-count-9 .pmst-gallery-item {
        flex: 1 1 calc(33.333% - 8px);
      }
      .pmst-gallery-section { padding: 16px; }
    }
  `]
})
export class NewsDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private articleService = inject(ArticleService);
  private sanitizer = inject(DomSanitizer);
  private platformId = inject(PLATFORM_ID);
  imageMapper = inject(ImageUrlMapperService);
  private userInterestService = inject(UserInterestService);

  loading = signal(true);
  notFound = signal(false);
  article = signal<ArticleDetail>({
    id: '', slug: '', title: '', excerpt: '', content: '',
    category: '', status: '', publishedAt: '', createdAt: ''
  });
  relatedArticles = signal<RelatedArticle[]>([]);

  // Lightbox state (same as model gallery)
  activeImageIndex = signal<number>(0);
  lightboxOpen = signal(false);

  readonly googleAd: SafeHtml;

  constructor() {
    this.googleAd = this.sanitizer.bypassSecurityTrustHtml(`
      <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8768534328781288" crossorigin="anonymous"></script>
      <ins class="adsbygoogle pmst-ad" data-ad-client="ca-pub-8768534328781288"
           data-ad-slot="6811674647" data-ad-format="auto" data-full-width-responsive="true"></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
    `);
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.loadArticle(slug);
      }
    });
  }

  private loadArticle(slug: string): void {
    this.loading.set(true);
    this.articleService.getArticleBySlug(slug).subscribe({
      next: data => {
        this.article.set(data);
        this.loading.set(false);
        this.userInterestService.trackArticleView(data.id, data.category);
        this.loadRelated(data.category);
        if (isPlatformBrowser(this.platformId)) {
          this.injectJsonLd(data);
        }
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      }
    });
  }

  private loadRelated(category: string): void {
    const mostViewedCategory = this.userInterestService.getMostViewedCategory();
    const currentArticleId = this.article().id;

    // Use most-viewed category if available, otherwise use current article's category
    const targetCategory = mostViewedCategory || category;

    this.articleService.getArticles(0, 5, targetCategory).subscribe({
      next: res => {
        const related = res.content
          .filter(a => a.id !== currentArticleId) // Exclude current article
          .slice(0, 5) // Limit to 5
          .map(a => ({
            id: a.id,
            slug: a.slug,
            title: a.title,
            featuredImage: a.featuredImage,
            publishedAt: a.publishedAt
          }));
        this.relatedArticles.set(related);
      },
      error: () => {}
    });
  }

  safeContent(): SafeHtml {
    const raw = this.article().content || '';
    const stripped = raw.replace(/<img[^>]+>/gi, '');
    return this.sanitizer.bypassSecurityTrustHtml(stripped);
  }

  safeEmbedCode(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.article().embedCode || '');
  }

  safeYoutubeUrl(): SafeResourceUrl {
    const url = this.article().youtubeLink || '';
    const embedUrl = this.toYoutubeEmbed(url);
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  galleryUrls(): string[] {
    const raw = this.article().galleryImages;
    const featuredImage = this.article().featuredImage;
    
    if (!raw) return [];
    
    let urls: string[] = [];
    
    // Parse the gallery images data
    if (Array.isArray(raw)) {
      urls = raw;
    } else if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        urls = Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    
    // Filter out empty/null, featured image, and duplicates
    const seen = new Set<string>();
    return urls
      .filter((u: string) => {
        if (!u || u.trim() === '') return false;
        // Skip if this is the featured image
        if (featuredImage && (u === featuredImage || u.includes(featuredImage.split('/').pop() || ''))) {
          return false;
        }
        // Skip duplicates
        if (seen.has(u)) return false;
        seen.add(u);
        return true;
      })
      .map((u: string) => this.imageMapper.mapUrl(u))
      .filter((u: string) => u && !u.startsWith('attachment:')) // Remove unresolvable attachments
      .slice(0, 6);
  }

  // Lightbox methods (same as model gallery)
  openLightbox(index: number): void {
    this.activeImageIndex.set(index);
    this.lightboxOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
    document.body.style.overflow = '';
  }

  nextImage(): void {
    const urls = this.galleryUrls();
    if (urls.length <= 1) return;
    
    this.activeImageIndex.update(current => 
      current >= urls.length - 1 ? 0 : current + 1
    );
  }

  prevImage(): void {
    const urls = this.galleryUrls();
    if (urls.length <= 1) return;
    
    this.activeImageIndex.update(current => 
      current <= 0 ? urls.length - 1 : current - 1
    );
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    if (!this.lightboxOpen()) return;
    
    switch (event.key) {
      case 'Escape':
        this.closeLightbox();
        break;
      case 'ArrowRight':
        this.nextImage();
        break;
      case 'ArrowLeft':
        this.prevImage();
        break;
    }
  }

  private toYoutubeEmbed(url: string): string {
    if (!url) return '';
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  }

  private injectJsonLd(data: ArticleDetail): void {
    const existing = document.getElementById('pmst-article-ld');
    if (existing) existing.remove();
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      mainEntityOfPage: window.location.href,
      headline: data.title,
      description: data.excerpt,
      image: data.featuredImage ? { '@type': 'ImageObject', url: data.featuredImage } : undefined,
      author: { '@type': 'Organization', name: 'PMST US-Nepal' },
      publisher: {
        '@type': 'Organization',
        name: 'PMST US-Nepal',
        logo: { '@type': 'ImageObject', url: '/assets/images/logo/pmst-logo.png' }
      },
      datePublished: data.publishedAt,
      dateModified: data.publishedAt
    };
    const script = document.createElement('script');
    script.id = 'pmst-article-ld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
  }
}
