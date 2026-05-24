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
  styles: [':host { display: block; }']
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
