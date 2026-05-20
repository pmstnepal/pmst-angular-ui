import { Component, OnInit, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Article, GallerySummary } from '../../core/models';
import { ArticleService } from '../../core/services/article.service';
import { GalleryService } from '../../core/services/gallery.service';
import { YoutubeService } from '../../core/services/youtube.service';
import { YoutubePlaylistComponent } from '../../shared/components/youtube-playlist/youtube-playlist.component';
import { PostCarouselComponent } from '../../shared/components/post-carousel/post-carousel.component';
import { GalleryCarouselComponent } from '../../shared/components/gallery-carousel/gallery-carousel.component';

// Live site playlist IDs (from WP shortcode [pmst_yt_playlists ids="..."])
const YOUTUBE_PLAYLIST_IDS = [
  'PL706KEgmVFK9d0swdjzjVCau3fSZBLcjH',
  'PL706KEgmVFK9HIMBXBUpdRJlovKTzCmhe',
  'PL706KEgmVFK-lbYXEVF7HnS6A5zdo0wK7'
];
const YOUTUBE_PLAYLIST_TITLES = ['NEW TRAILERS', 'TRENDING SONGS', 'PMST VIDEOS'];

@Component({
  selector: 'pmst-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, YoutubePlaylistComponent, PostCarouselComponent, GalleryCarouselComponent],
  template: `
    <div class="home-page">

      <!-- ① HERO BANNER (pmst-hero-lite) -->
      <section class="pmst-hero-lite">
        <h1 class="title">Creation and Creativity</h1>
        <div class="sub">Audio and Video</div>
      </section>

      <!-- ② YOUTUBE SUBSCRIBE -->
      <section class="py-6 bg-gray-900 text-center">
        <div class="container mx-auto px-4">
          <div class="g-ytsubscribe" data-channelid="UCtSOZtP4CpKooRCt9Hbzucw" data-layout="full" data-count="default"></div>
        </div>
      </section>

      <!-- ③ YOUTUBE PLAYLISTS (Tabbed) -->
      <section class="py-10 bg-gray-900">
        <div class="container mx-auto px-4">
          @if (youtubeLoading()) {
            <div class="animate-pulse">
              <div class="flex gap-2 mb-6 border-b border-gray-700">
                <div class="h-10 w-32 bg-gray-700 rounded-t"></div>
                <div class="h-10 w-32 bg-gray-800 rounded-t"></div>
                <div class="h-10 w-32 bg-gray-800 rounded-t"></div>
              </div>
              <div class="aspect-video bg-gray-800 rounded-xl mb-4"></div>
              <div class="flex gap-3 overflow-hidden">
                @for (i of [1,2,3,4,5,6]; track i) {
                  <div class="w-40 h-24 bg-gray-800 rounded flex-shrink-0"></div>
                }
              </div>
            </div>
          } @else if (youtubePlaylists().length > 0) {
            <pmst-youtube-playlist
              [enableTabs]="true"
              [playlists]="youtubePlaylists()">
            </pmst-youtube-playlist>
          } @else {
            <div class="text-center text-gray-400 py-12">Videos unavailable. Please try again later.</div>
          }
        </div>
      </section>

      <!-- ④ GOOGLE ADS PLACEHOLDER -->
      <section class="py-6 bg-gray-100">
        <div class="container mx-auto px-4 text-center">
          <div class="bg-gray-300 rounded-lg p-8 text-gray-500 text-sm">
            <p>Advertisement</p>
            <!-- Google AdSense will be inserted here -->
          </div>
        </div>
      </section>

      <!-- ⑤ LATEST NEWS (pmst-hero-lite + post-carousel) -->
      <section class="pmst-hero-lite">
        <h1 class="title">Latest News</h1>
        <div class="sub">Gossip and Entertainment</div>
      </section>

      <section class="py-10 bg-gray-50">
        <div class="container mx-auto px-4">
          @if (newsLoading()) {
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              @for (i of [1,2,3]; track i) {
                <div class="animate-pulse bg-white rounded-lg shadow overflow-hidden">
                  <div class="h-48 bg-gray-200"></div>
                  <div class="p-4 space-y-3">
                    <div class="h-3 bg-gray-200 rounded w-1/4"></div>
                    <div class="h-5 bg-gray-200 rounded"></div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <pmst-post-carousel
              title=""
              [visibleCount]="3"
              [items]="carouselNews()">
            </pmst-post-carousel>
          }

          <div class="mt-8 text-center">
            <a routerLink="/news" class="pmst-btn-primary">VIEW ALL</a>
          </div>
        </div>
      </section>

      <!-- ⑥ CONTENT WRITER CTA (50/50 Grid) -->
      <section class="hide-this-on-mobile py-12 bg-gray-100">
        <div class="container mx-auto px-4">
          <div class="grid md:grid-cols-2 gap-8 items-center">
            <!-- Left: Hero Text -->
            <div class="pmst-hero-lite !bg-transparent">
              <h1 class="title !text-gray-900">Become a Voice in</h1>
              <div class="sub !text-xl md:!text-2xl !text-gray-700">Nepali News, Entertainment &amp; Gossip</div>
            </div>
            <!-- Right: Description + CTA -->
            <div class="text-center">
              <p class="text-gray-600 mb-4">Love writing about Nepali movies, music, celebrities? Join our content team!</p>
              <p class="text-sm text-gray-500 mb-6">Share exclusive updates, gossip, and industry insights with our growing audience.</p>
              <a routerLink="/submit/article" class="pmst-btn-primary">Submit Your Article/News Here</a>
            </div>
          </div>
        </div>
      </section>

      <!-- ⑦ MODEL & GALLERY (pmst-hero-lite + gallery-carousel) -->
      <section class="pmst-hero-lite">
        <h1 class="title">Model and Gallery</h1>
        <div class="sub">Featuring</div>
      </section>

      <section class="py-10" style="background:#1a1a2e;">
        <div class="container mx-auto px-4">
          @if (galleriesLoading()) {
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              @for (i of [1,2,3,4]; track i) {
                <div class="animate-pulse rounded-lg overflow-hidden aspect-[4/3] bg-gray-700"></div>
              }
            </div>
          } @else {
            <pmst-gallery-carousel
              title=""
              [visibleCount]="4"
              [items]="carouselGalleries()">
            </pmst-gallery-carousel>
          }

          <div class="mt-8 text-center">
            <a routerLink="/showcase" class="pmst-btn-primary">VIEW ALL</a>
          </div>
        </div>
      </section>

      <!-- ⑧ GALLERY SUBMISSION CTA (50/50 Grid) -->
      <section class="hide-this-on-mobile py-12 bg-gray-100">
        <div class="container mx-auto px-4">
          <div class="grid md:grid-cols-2 gap-8 items-center">
            <!-- Left: Description + CTA -->
            <div class="text-center">
              <p class="text-gray-600 mb-4">Showcase your talent with PMST US-Nepal!</p>
              <ul class="text-sm text-gray-500 mb-6 space-y-1">
                <li>Get featured on our platform</li>
                <li>Gain recognition in the community</li>
                <li>Connect with fellow creatives</li>
              </ul>
              <a routerLink="/submit/gallery" class="pmst-btn-primary">Submit Your Gallery</a>
            </div>
            <!-- Right: Hero Text -->
            <div class="pmst-hero-lite !bg-transparent">
              <h1 class="title !text-gray-900">Showcase Your Talent</h1>
              <div class="sub !text-xl md:!text-2xl !text-gray-700">Model, Event, Gallery or Photography</div>
            </div>
          </div>
        </div>
      </section>

    </div>
  `,
  styles: [``]
})
export class HomeComponent implements OnInit {
  latestNews = signal<Article[]>([]);
  featuredGalleries = signal<GallerySummary[]>([]);
  newsLoading = signal(true);
  galleriesLoading = signal(true);

  // YouTube playlists loaded from backend (proxies YouTube Data API v3)
  youtubePlaylists = signal<Array<{ id: string; title: string; videos: Array<{ id: string; title: string; thumbnailUrl: string; videoId: string; duration: string }> }>>([]);
  youtubeLoading = signal(true);

  private youtubeService = inject(YoutubeService);

  // Transform API data for post-carousel component
  carouselNews = () => this.latestNews().map(article => ({
    id: article.id,
    title: article.title,
    excerpt: article.excerpt,
    imageUrl: article.featuredImage || '',
    category: article.category,
    slug: article.slug,
    date: article.publishedAt
  }));

  // Transform API data for gallery-carousel component
  carouselGalleries = () => this.featuredGalleries().map(gallery => ({
    id: gallery.id,
    title: gallery.title,
    slug: gallery.slug,
    featuredImage: gallery.featuredImage || ''
  }));

  constructor(
    private articleService: ArticleService,
    private galleryService: GalleryService
  ) {}

  ngOnInit(): void {
    // Load 6 articles for carousel (with caching via ArticleService)
    this.articleService.getLatestArticles(6).subscribe({
      next: res => { this.latestNews.set(res.content); this.newsLoading.set(false); },
      error: () => this.newsLoading.set(false)
    });

    // Load 6 galleries for carousel (with caching via GalleryService)
    this.galleryService.getFeaturedGalleries(6).subscribe({
      next: res => { this.featuredGalleries.set(res.content); this.galleriesLoading.set(false); },
      error: () => this.galleriesLoading.set(false)
    });

    // Load YouTube playlists from backend (cached 1h server-side)
    this.youtubeService.getPlaylists(YOUTUBE_PLAYLIST_IDS, YOUTUBE_PLAYLIST_TITLES, 30).subscribe({
      next: playlists => {
        this.youtubePlaylists.set(playlists.map(pl => ({
          id: pl.playlistId,
          title: pl.title,
          videos: pl.items.map(v => ({
            id: v.videoId,
            title: v.title,
            thumbnailUrl: v.thumbUrl,
            videoId: v.videoId,
            duration: ''
          }))
        })));
        this.youtubeLoading.set(false);
      },
      error: err => {
        console.error('Failed to load YouTube playlists:', err);
        this.youtubeLoading.set(false);
      }
    });
  }
}
