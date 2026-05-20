import { Component, Input, signal, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';

interface VideoItem {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoId: string;
  duration: string;
}

interface PlaylistConfig {
  id: string;
  title: string;
  videos: VideoItem[];
}

@Component({
  selector: 'pmst-youtube-playlist',
  standalone: true,
  imports: [CommonModule, SafeUrlPipe],
  template: `
    <div class="youtube-playlist">
      <!-- Tabs Navigation (WP plugin style) -->
      @if (enableTabs && playlists.length > 1) {
        <div class="pmst-tabs">
          @for (playlist of playlists; track playlist.id; let i = $index) {
            <button
              type="button"
              (click)="selectPlaylist(i)"
              class="pmst-tab"
              [class.active]="activePlaylistIndex() === i"
            >
              {{ playlist.title }}
            </button>
          }
        </div>
        <p class="pmst-note">Discover the newest Nepali trailers, teasers, and videos. Click any thumbnail to play on the big screen.</p>
      } @else if (title) {
        <h3 class="text-xl font-bold text-white mb-4">{{ title }}</h3>
      }

      <!-- Main Player -->
      <div class="aspect-video bg-black rounded-xl overflow-hidden shadow-lg mb-4">
        @if (activeVideo()) {
          <iframe
            [src]="'https://www.youtube.com/embed/' + activeVideo()!.videoId + '?autoplay=0&rel=0' | safeUrl"
            class="w-full h-full"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            [title]="activeVideo()!.title"
          ></iframe>
        } @else {
          <div class="w-full h-full flex items-center justify-center text-gray-500">
            <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        }
      </div>

      <!-- Playlist - Single-row horizontal scroll with prev/next arrows -->
      @if (currentPlaylistVideos().length > 0) {
        <div class="mt-4">
          <div class="strip-wrap">
            <button
              type="button"
              class="nav-btn prev"
              (click)="scrollStrip(-1)"
              aria-label="Scroll left">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <div class="strip" #stripEl>
              @for (video of currentPlaylistVideos(); track video.id; let i = $index) {
                <button
                  (click)="selectVideo(video)"
                  type="button"
                  class="thumb-btn"
                  [class.active]="activeVideo()?.id === video.id"
                  [attr.aria-label]="video.title"
                >
                  @if (video.thumbnailUrl) {
                    <img [src]="video.thumbnailUrl" [alt]="video.title" loading="lazy">
                  } @else {
                    <div class="thumb-fallback">
                      <svg class="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                      </svg>
                    </div>
                  }
                </button>
              }
            </div>
            <button
              type="button"
              class="nav-btn next"
              (click)="scrollStrip(1)"
              aria-label="Scroll right">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

    /* WP plugin tab style */
    .pmst-tabs {
      display: flex;
      margin: 0 0 0.6rem 0;
      border-bottom: 1px solid #2a2a2a;
    }
    .pmst-tab {
      flex: 1 1 0;
      text-align: center;
      padding: 14px 0;
      background: #f5f6f8;
      color: #1d2a36;
      font-weight: 600;
      font-size: 14px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      border: 1px solid #d3d6da;
      border-left: none;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
    }
    .pmst-tab:first-child { border-left: 1px solid #d3d6da; }
    .pmst-tab:hover:not(.active) { background: #e9ecef; }
    .pmst-tab.active {
      background: #fe5252;
      color: #fff;
      border-color: #fe5252;
    }
    .pmst-note {
      color: #ccc;
      font-size: 0.9rem;
      opacity: 0.85;
      margin: 0.2rem 0 1rem;
    }
    @media (max-width: 640px) {
      .pmst-tabs { flex-direction: column; }
      .pmst-tab {
        border-left: 1px solid #d3d6da !important;
        border-top: none;
      }
      .pmst-tab:first-child { border-top: 1px solid #d3d6da; }
    }

    .strip-wrap { position: relative; }
    .strip {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scroll-behavior: smooth;
      padding: 4px 56px;
      -ms-overflow-style: none;
      scrollbar-width: thin;
    }
    .strip::-webkit-scrollbar { height: 6px; }
    .strip::-webkit-scrollbar-thumb { background: #555; border-radius: 99px; }
    .strip::-webkit-scrollbar-track { background: transparent; }
    .thumb-btn {
      flex: 0 0 auto;
      width: 240px;
      min-width: 240px;
      scroll-snap-align: start;
      background: #121212;
      border: 1px solid #2a2a2a;
      border-radius: 10px;
      overflow: hidden;
      cursor: pointer;
      padding: 0;
      transition: transform 0.15s, border-color 0.15s;
    }
    .thumb-btn:hover { transform: translateY(-2px); }
    .thumb-btn.active { outline: 2px solid #fe5252; border-color: #fe5252; }
    .thumb-btn img {
      width: 100%;
      display: block;
      aspect-ratio: 16/9;
      object-fit: cover;
    }
    .thumb-fallback {
      width: 100%;
      aspect-ratio: 16/9;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1a1a1a;
    }
    .nav-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 40px;
      height: 40px;
      border-radius: 999px;
      background: rgba(255,255,255,0.92);
      color: #111;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 5;
      box-shadow: 0 4px 14px rgba(0,0,0,0.45);
      border: none;
      transition: background .15s, transform .15s;
    }
    .nav-btn:hover { background: #fff; transform: translateY(-50%) scale(1.05); }
    .nav-btn:active { transform: translateY(-50%) scale(0.97); }
    .nav-btn.prev { left: 6px; }
    .nav-btn.next { right: 6px; }
    @media (max-width: 640px) {
      .nav-btn { width: 36px; height: 36px; }
      .strip { padding: 4px 48px; }
      .thumb-btn { width: 58vw !important; max-width: 58vw; }
    }
  `]
})
export class YoutubePlaylistComponent implements OnInit {
  @Input() title = '';
  @Input() enableTabs = false;
  @Input() playlists: PlaylistConfig[] = [];

  // Legacy support for single playlist
  @Input() set videos(value: VideoItem[]) {
    if (value && value.length > 0 && !this.playlists.length) {
      this.playlists = [{ id: 'default', title: this.title || 'Videos', videos: value }];
    }
  }

  @ViewChild('stripEl') stripEl?: ElementRef<HTMLDivElement>;

  activePlaylistIndex = signal(0);
  activeVideo = signal<VideoItem | null>(null);

  // Computed signal for current playlist videos
  currentPlaylistVideos = () => {
    const playlists = this.playlists;
    const index = this.activePlaylistIndex();
    if (playlists.length > 0 && index < playlists.length) {
      return playlists[index].videos;
    }
    return [];
  };

  ngOnInit() {
    // Initialize with first video of first playlist
    const videos = this.currentPlaylistVideos();
    if (videos.length > 0) {
      this.activeVideo.set(videos[0]);
    }
  }

  selectPlaylist(index: number) {
    this.activePlaylistIndex.set(index);
    const videos = this.currentPlaylistVideos();
    if (videos.length > 0) {
      this.activeVideo.set(videos[0]);
    }
  }

  selectVideo(video: VideoItem) {
    this.activeVideo.set(video);
  }

  scrollStrip(direction: 1 | -1) {
    const el = this.stripEl?.nativeElement;
    if (!el) return;
    const amount = Math.max(280, el.clientWidth * 0.7) * direction;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  }
}
