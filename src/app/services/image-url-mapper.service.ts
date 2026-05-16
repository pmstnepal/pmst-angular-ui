import { Injectable } from '@angular/core';

/**
 * Image URL Mapper Service
 * Maps WordPress image URLs to local/development paths
 *
 * Unified Lookup Strategy:
 * - All content images have unique filenames across all years
 * - Uses manifest.json for O(1) filename-to-path lookups
 * - 2024/2025/2026 articles find their images in 2019/2023 folders
 */
@Injectable({
  providedIn: 'root'
})
export class ImageUrlMapperService {
  // Direct mappings for non-year paths
  private patterns = [
    {
      'match': 'https://pmstusnepal.com/wp-content/uploads/ultimatemember/',
      'replace': '/assets/images/ultimatemember/'
    },
    {
      'match': 'https://pmstusnepal.com/wp-content/uploads/woocommerce-placeholder',
      'replace': '/assets/images/woocommerce-placeholder'
    }
  ];

  private fallbackImage = '/assets/images/placeholder.jpg';
  private imageManifest: Map<string, string> = new Map();
  private manifestLoaded = false;

  constructor() {
    // Manifest will be loaded via APP_INITIALIZER before app renders
  }

  /**
   * Load image manifest for fast lookups
   * Called by APP_INITIALIZER to ensure manifest is loaded before app renders
   */
  async loadManifest(): Promise<void> {
    if (this.manifestLoaded) {
      return;
    }
    
    try {
      const response = await fetch('/assets/image-manifest.json');
      if (response.ok) {
        const manifest = await response.json();
        // Build filename -> path map
        Object.entries(manifest).forEach(([filename, path]) => {
          this.imageManifest.set(filename, path as string);
        });
        this.manifestLoaded = true;
        console.log(`[ImageUrlMapper] Loaded ${this.imageManifest.size} images from manifest`);
      } else {
        console.warn('[ImageUrlMapper] Failed to fetch manifest:', response.status);
      }
    } catch (error) {
      console.warn('[ImageUrlMapper] Failed to load manifest, falling back to pattern matching', error);
    }
  }

  /**
   * Map WordPress URL to local/development URL
   * Uses manifest-based lookup for unified image resolution
   */
  mapUrl(wpUrl: string | null | undefined): string {
    if (!wpUrl) {
      return this.fallbackImage;
    }

    // Check non-year patterns first (ultimatemember, woocommerce)
    for (const pattern of this.patterns) {
      if (wpUrl.includes(pattern.match)) {
        return wpUrl.replace(pattern.match, pattern.replace);
      }
    }

    // Extract filename from WordPress uploads URL
    // Pattern: https://pmstusnepal.com/wp-content/uploads/YYYY/MM/filename.ext
    const uploadsMatch = wpUrl.match(/wp-content\/uploads\/\d{4}\/\d{2}\/([^/]+\.[^.]+)$/);
    if (uploadsMatch) {
      const filename = uploadsMatch[1];

      // Use manifest for fast lookup if loaded
      if (this.manifestLoaded && this.imageManifest.has(filename)) {
        return this.imageManifest.get(filename)!;
      }

      // Fallback: Try to construct path (will 404 if not found, that's ok)
      // For development, we can try a few common patterns
      return `/assets/images/2023/${filename}`;
    }

    // If no pattern matches, return as-is (might be external URL)
    return wpUrl;
  }
  
  /**
   * Get image URL with size specification
   */
  getImageUrl(wpUrl: string | null | undefined, size: 'original' | 'large' | 'medium' | 'thumbnail' = 'original'): string {
    const baseUrl = this.mapUrl(wpUrl);
    
    if (size === 'original') {
      return baseUrl;
    }
    
    // For local development, we just return the original
    // In production, this would return the sized version
    return baseUrl;
  }
  
  /**
   * Check if URL is a WordPress content URL
   */
  isWordPressUrl(url: string): boolean {
    return url?.includes('pmstusnepal.com/wp-content/uploads') ?? false;
  }
}
