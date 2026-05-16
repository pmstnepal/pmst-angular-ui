import { Component, Input, signal, OnInit } from '@angular/core';
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
      <!-- Tabs Navigation -->
      @if (enableTabs && playlists.length > 1) {
        <div class="flex gap-2 mb-6 border-b border-gray-700">
          @for (playlist of playlists; track playlist.id; let i = $index) {
            <button
              (click)="selectPlaylist(i)"
              class="px-4 py-3 text-sm font-semibold uppercase tracking-wide transition-colors"
              [class.text-white]="activePlaylistIndex() === i"
              [class.border-b-2]="activePlaylistIndex() === i"
              [class.border-red-500]="activePlaylistIndex() === i"
              [class.text-gray-400]="activePlaylistIndex() !== i"
              [class.hover:text-white]="activePlaylistIndex() !== i"
            >
              {{ playlist.title }}
            </button>
          }
        </div>
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

      @if (activeVideo()) {
        <h4 class="text-lg font-semibold text-white mb-4">{{ activeVideo()!.title }}</h4>
      }

      <!-- Playlist Grid (Horizontal scroll on mobile, grid on desktop) -->
      @if (currentPlaylistVideos().length > 0) {
        <div class="bg-gray-800 rounded-xl p-3">
          <p class="text-sm font-semibold text-gray-400 mb-3">{{ currentPlaylistVideos().length }} videos</p>
          <div class="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-4 lg:grid-cols-6">
            @for (video of currentPlaylistVideos(); track video.id; let i = $index) {
              <button
                (click)="selectVideo(video)"
                class="flex-shrink-0 w-40 md:w-auto text-left hover:bg-gray-700 transition-colors rounded-lg p-2"
                [class.bg-gray-700]="activeVideo()?.id === video.id"
              >
                <div class="relative aspect-video bg-gray-900 rounded overflow-hidden mb-2">
                  @if (video.thumbnailUrl) {
                    <img [src]="video.thumbnailUrl" [alt]="video.title" class="w-full h-full object-cover">
                  } @else {
                    <div class="w-full h-full flex items-center justify-center">
                      <svg class="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                      </svg>
                    </div>
                  }
                  <span class="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">{{ video.duration }}</span>
                  @if (activeVideo()?.id === video.id) {
                    <div class="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div class="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                        <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  }
                </div>
                <p class="text-xs font-medium text-gray-300 line-clamp-2">{{ video.title }}</p>
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
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
}
