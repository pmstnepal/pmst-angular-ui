import { Component, Input, OnInit, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { CommentSectionComponent } from '../../shared/components/comments/comment-section.component';
import { environment } from '../../../environments/environment';
import { ImageUrlMapperService } from '../../services/image-url-mapper.service';

interface ArticleDetail {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  youtubeLink?: string;
  embedCode?: string;
  galleryImages?: string;
  category: string;
  status: string;
  publishedAt: string;
  createdAt: string;
  authorId?: string;
}

interface RelatedArticle {
  id: string;
  slug: string;
  title: string;
  featuredImage?: string;
  publishedAt: string;
}

@Component({
  selector: 'pmst-news-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, CommentSectionComponent],
  template: `
    @if (loading()) {
      <div class="pmst-post-container">
        <div class="pmst-skeleton-hero"></div>
        <div class="pmst-skeleton-title"></div>
        <div class="pmst-skeleton-line"></div>
        <div class="pmst-skeleton-line" style="width:75%"></div>
        <div class="pmst-skeleton-line"></div>
        <div class="pmst-skeleton-line" style="width:85%"></div>
      </div>
    } @else if (notFound()) {
      <div class="pmst-post-container" style="text-align:center;padding:80px 40px;">
        <h2 style="color:#FE5252;font-size:24px;">Article not found</h2>
        <a routerLink="/news" style="color:#aaa;margin-top:20px;display:inline-block;">← Back to News</a>
      </div>
    } @else {
      <div class="pmst-post-container">

        <!-- Google Ad Top -->
        <div [innerHTML]="googleAd"></div>

        <!-- Featured Hero: YouTube OR Blurred Image -->
        <div class="pmst-featured-wrapper">
          <div class="pmst-logo-overlay">
            <img src="https://nepalicommunityhub.com/wp-content/uploads/2025/03/pmstusnepal.png" alt="PMST Logo" />
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
            <div class="pmst-featured-blur"
                 [style.background-image]="'url(' + imageMapper.mapUrl(article().featuredImage) + ')'">
            </div>
            <div class="pmst-featured-center">
              <img [src]="imageMapper.mapUrl(article().featuredImage)" [alt]="article().title" />
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
          <div style="margin:40px 0;">
            <h3 style="color:#FE5252;font-size:20px;margin-bottom:15px;">📱 Social Media Highlight</h3>
            <div class="pmst-social-embed-container">
              <div class="pmst-social-embed-wrapper" [innerHTML]="safeEmbedCode()"></div>
            </div>
          </div>
        }

        <!-- Gallery Grid -->
        @if (galleryUrls().length > 0) {
          <div class="pmst-gallery-grid">
            @for (img of galleryUrls(); track img) {
              <a [href]="imageMapper.mapUrl(img)" data-fancybox="gallery" class="pmst-lightbox">
                <img [src]="imageMapper.mapUrl(img)" alt="" loading="lazy" />
              </a>
            }
          </div>
        }

        <!-- Google Ad Bottom -->
        <div [innerHTML]="googleAd"></div>

        <!-- Related Posts -->
        @if (relatedArticles().length > 0) {
          <div class="pmst-related-posts">
            <h3>Related Posts</h3>
            <ul>
              @for (rel of relatedArticles(); track rel.id) {
                <li>
                  <a [routerLink]="['/news', rel.slug]">{{ rel.title }}</a>
                </li>
              }
            </ul>
          </div>
        }

        <!-- Back link -->
        <div style="margin-top:30px;">
          <a routerLink="/news" style="color:#FE5252;text-decoration:none;font-weight:600;">← Back to News</a>
        </div>
      </div>

      <!-- Comments -->
      <div style="background:#1e1e1e;padding:0 40px 40px;">
        <pmst-comment-section [contentType]="'article'" [contentId]="article().id"></pmst-comment-section>
      </div>
    }
  `,
  styles: [`
    .pmst-post-container {
      background: #1e1e1e;
      color: #fff;
      padding: 40px;
      max-width: 1200px;
      margin: auto;
      border-radius: 10px;
    }
    .pmst-title {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .pmst-meta {
      color: #aaa;
      margin-bottom: 20px;
    }
    .pmst-content {
      line-height: 1.8;
      margin-bottom: 30px;
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
      background-size: cover;
      background-position: center;
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
      height: 35px; width: auto;
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
    .pmst-gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 12px;
      margin: 30px 0;
    }
    .pmst-gallery-grid img {
      width: 100%; height: 100%;
      object-fit: cover;
      aspect-ratio: 1/1;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: 0.3s ease;
      cursor: pointer;
    }
    .pmst-gallery-grid img:hover { transform: scale(1.03); }
    .pmst-related-posts { margin: 30px 0; }
    .pmst-related-posts h3 { color: #fff; margin-bottom: 15px; }
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
    @media (max-width: 768px) {
      .pmst-post-container { padding: 20px 16px; }
      .pmst-featured-wrapper { height: auto !important; padding: 20px 0; background: #111; }
      .pmst-featured-blur { display: none !important; }
      .pmst-featured-center img { max-width: 100%; max-height: 400px; }
      .pmst-title { font-size: 22px; }
    }
  `]
})
export class NewsDetailComponent implements OnInit {
  @Input() slug!: string;

  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private platformId = inject(PLATFORM_ID);
  imageMapper = inject(ImageUrlMapperService);

  loading = signal(true);
  notFound = signal(false);
  article = signal<ArticleDetail>({
    id: '', slug: '', title: '', excerpt: '', content: '',
    category: '', status: '', publishedAt: '', createdAt: ''
  });
  relatedArticles = signal<RelatedArticle[]>([]);

  readonly googleAd: SafeHtml;

  constructor() {
    this.googleAd = this.sanitizer.bypassSecurityTrustHtml(`
      <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8768534328781288" crossorigin="anonymous"></script>
      <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-8768534328781288"
           data-ad-slot="6811674647" data-ad-format="auto" data-full-width-responsive="true"></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
    `);
  }

  ngOnInit(): void {
    if (!this.slug) return;
    this.loadArticle();
  }

  private loadArticle(): void {
    this.loading.set(true);
    this.http.get<ArticleDetail>(`${environment.apiUrl}/articles/${this.slug}`)
      .subscribe({
        next: data => {
          this.article.set(data);
          this.loading.set(false);
          this.loadRelated(data.category);
          if (isPlatformBrowser(this.platformId)) {
            this.injectJsonLd(data);
            this.loadFancybox();
          }
        },
        error: () => {
          this.notFound.set(true);
          this.loading.set(false);
        }
      });
  }

  private loadRelated(category: string): void {
    this.http.get<RelatedArticle[]>(`${environment.apiUrl}/articles/${this.slug}/related`)
      .subscribe({ next: data => this.relatedArticles.set(data), error: () => {} });
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
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((u: string) => u && !u.startsWith('attachment:')).slice(0, 6)
        : [];
    } catch {
      return [];
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
        logo: { '@type': 'ImageObject', url: 'https://nepalicommunityhub.com/wp-content/uploads/2025/03/pmstusnepal.png' }
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

  private loadFancybox(): void {
    if (document.getElementById('fancybox-css')) return;
    const link = document.createElement('link');
    link.id = 'fancybox-css';
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/@fancyapps/ui/dist/fancybox/fancybox.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@fancyapps/ui@5/dist/fancybox/fancybox.umd.js';
    script.onload = () => (window as any).Fancybox?.bind('[data-fancybox]');
    document.body.appendChild(script);
  }
}
