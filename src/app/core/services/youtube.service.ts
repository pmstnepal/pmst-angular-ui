import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay, timer } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface YoutubeVideo {
  videoId: string;
  title: string;
  thumbUrl: string;
}

export interface YoutubePlaylistResponse {
  playlistId: string;
  title: string;
  items: YoutubeVideo[];
}

export interface YoutubeConfig {
  playlistIds: string[];
  playlistTitles: string[];
}

/**
 * YouTube Service
 * Calls backend /youtube/playlists endpoint, which proxies YouTube Data API v3.
 * Mirrors the WordPress [pmst_yt_playlists] shortcode behavior.
 */
@Injectable({
  providedIn: 'root'
})
export class YoutubeService {
  private readonly baseUrl = `${environment.apiUrl}/youtube`;
  private http = inject(HttpClient);

  // Cache for 1 hour (matches backend cache TTL)
  private cache = new Map<string, Observable<YoutubePlaylistResponse[]>>();
  private readonly CACHE_TTL = 60 * 60 * 1000;

  /**
   * Fetch multiple YouTube playlists with titles.
   * @param ids playlist IDs (comma-separated on the wire)
   * @param titles titles (pipe-separated on the wire)
   * @param max max videos per playlist (default 30)
   */
  getPlaylists(ids: string[], titles: string[], max = 30): Observable<YoutubePlaylistResponse[]> {
    const idsParam = ids.join(',');
    const titlesParam = titles.join('|');
    const cacheKey = `playlists-${idsParam}-${max}`;

    if (!this.cache.has(cacheKey)) {
      const params = new HttpParams()
        .set('ids', idsParam)
        .set('titles', titlesParam)
        .set('max', max.toString());

      const request$ = this.http
        .get<YoutubePlaylistResponse[]>(`${this.baseUrl}/playlists`, { params })
        .pipe(shareReplay(1));

      this.cache.set(cacheKey, request$);
      timer(this.CACHE_TTL).subscribe(() => this.cache.delete(cacheKey));
    }

    return this.cache.get(cacheKey)!;
  }

  /**
   * Fetch YouTube configuration (playlist IDs and titles) from backend.
   * This allows updating playlists without code changes.
   */
  getConfig(): Observable<YoutubeConfig> {
    return this.http.get<YoutubeConfig>(`${this.baseUrl}/config`);
  }
}
