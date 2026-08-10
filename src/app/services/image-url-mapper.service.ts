import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export type ImageTier = 'thumb' | 'card' | 'hero' | 'master';

/**
 * Image URL Mapper Service
 * Maps WordPress image URLs to local/development paths.
 * In production, maps image_key (S3 base path) to CloudFront tier URLs.
 *
 * Two URL strategies:
 *  1. imageKey-based (new uploads + migrated images):
 *     getTierUrl(imageKey, tier) → {CF_DOMAIN}/{imageKey}/{tier}.webp
 *  2. Legacy WP URL mapping (fallback for items not yet processed):
 *     mapUrl(wpUrl) → local asset or CF URL
 */
@Injectable({
  providedIn: 'root'
})
export class ImageUrlMapperService {
  private readonly cfDomain: string = (environment as any).cfDomain ?? '';

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
  private manifestLoading = false;

  constructor() {
    // Manifest loads lazily on first use - no blocking
  }

  /**
   * Primary method for prod — resolves an image_key + tier to a full CloudFront URL.
   * Falls back to mapUrl(legacyUrl) when image_key is null (item not yet processed).
   *
   * @param imageKey  S3 base path e.g. "media/2024/03/my-photo-uuid"
   * @param tier      Desired size tier
   * @param legacyUrl Original WP URL used as fallback when imageKey is null
   */
  getTierUrl(imageKey: string | null | undefined, tier: ImageTier = 'card', legacyUrl?: string | null): string {
    if (imageKey) {
      const base = this.cfDomain ? `${this.cfDomain}/${imageKey}` : `/assets/processed/${imageKey}`;
      return `${base}/${tier}.webp`;
    }
    return this.mapUrl(legacyUrl);
  }

  /**
   * Convenience overload: same as getTierUrl but always returns the card tier.
   * Use for article cards, gallery grids — most common case.
   */
  getCardUrl(imageKey: string | null | undefined, legacyUrl?: string | null): string {
    return this.getTierUrl(imageKey, 'card', legacyUrl);
  }

  /**
   * Returns hero URL (1200px) — use for detail page featured images.
   */
  getHeroUrl(imageKey: string | null | undefined, legacyUrl?: string | null): string {
    return this.getTierUrl(imageKey, 'hero', legacyUrl);
  }

  /**
   * Returns thumbnail URL (150px) — use for gallery grids, avatars.
   */
  getThumbUrl(imageKey: string | null | undefined, legacyUrl?: string | null): string {
    return this.getTierUrl(imageKey, 'thumb', legacyUrl);
  }

  /**
   * Returns master URL (original-resolution) — use for lightbox / full view.
   */
  getMasterUrl(imageKey: string | null | undefined, legacyUrl?: string | null): string {
    return this.getTierUrl(imageKey, 'master', legacyUrl);
  }

  /**
   * Load image manifest for fast lookups
   * Loads lazily on first use - does not block app startup
   */
  private async loadManifest(): Promise<void> {
    if (this.manifestLoaded || this.manifestLoading) {
      return;
    }
    
    this.manifestLoading = true;
    
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
      }
    } catch {
      // Silent fail - pattern matching fallback works fine
    } finally {
      this.manifestLoading = false;
    }
  }

  /**
   * Map WordPress URL or image_key to a usable image URL.
   * Prefer imageKey when available; otherwise parse a legacy WP URL or image_key string.
   */
  mapUrl(wpUrl: string | null | undefined, imageKey?: string | null | undefined, tier: ImageTier = 'card'): string {
    // Trigger lazy manifest load (non-blocking)
    this.loadManifest();

    const effectiveKey = imageKey || wpUrl;
    if (!effectiveKey) {
      return this.fallbackImage;
    }

    // If we have a bare image_key (media/YYYY/MM/basename), use it directly
    if (effectiveKey.startsWith('media/')) {
      return this.getTierUrl(effectiveKey, tier, wpUrl);
    }

    const resolvedWpUrl = wpUrl || imageKey;
    if (!resolvedWpUrl) {
      return this.fallbackImage;
    }

    // Handle attachment IDs from gallery_images (e.g., "attachment:26217")
    const attachmentMatch = resolvedWpUrl.match(/^attachment:(\d+)$/);
    if (attachmentMatch) {
      const attachmentId = attachmentMatch[1];
      const wpAttachmentUrl = `https://pmstusnepal.com/?attachment_id=${attachmentId}`;
      console.warn(`[ImageUrlMapper] Attachment ID ${attachmentId} - using WordPress URL`);
      return wpAttachmentUrl;
    }

    // In production, rewrite WP media URLs to CloudFront processed images
    if (this.cfDomain && this.isWordPressUrl(resolvedWpUrl)) {
      const stem = (name: string) => name.replace(/\.[^/.]+$/, '');

      const yearMonthMatch = resolvedWpUrl.match(/wp-content\/uploads\/(\d{4})\/(\d{2})\/([^/]+?\.[^.]+)$/);
      if (yearMonthMatch) {
        const [, year, month, filename] = yearMonthMatch;
        return `${this.cfDomain}/media/${year}/${month}/${stem(filename)}/${tier}.webp`;
      }

      const folderMatch = resolvedWpUrl.match(/wp-content\/uploads\/([^/]+)\/([^/]+?\.[^.]+)$/);
      if (folderMatch) {
        const [, , filename] = folderMatch;
        // Non-year folders (ultimatemember, logo, woocommerce-placeholder, etc.)
        // were uploaded to the default media/2024/01 prefix by the migration script
        return `${this.cfDomain}/media/2024/01/${stem(filename)}/${tier}.webp`;
      }

      const rootMatch = resolvedWpUrl.match(/wp-content\/uploads\/([^/]+?\.[^.]+)$/);
      if (rootMatch) {
        const [, filename] = rootMatch;
        return `${this.cfDomain}/media/2024/01/${stem(filename)}/${tier}.webp`;
      }

      return resolvedWpUrl;
    }

    // Development / local fallback behavior
    for (const pattern of this.patterns) {
      if (resolvedWpUrl.includes(pattern.match)) {
        return resolvedWpUrl.replace(pattern.match, pattern.replace);
      }
    }

    const uploadsMatch = resolvedWpUrl.match(/wp-content\/uploads\/\d{4}\/\d{2}\/([^/]+\.[^.]+)$/);
    if (uploadsMatch) {
      const filename = uploadsMatch[1];
      if (this.manifestLoaded && this.imageManifest.has(filename)) {
        return this.imageManifest.get(filename)!;
      }
      return `/assets/images/2023/${filename}`;
    }

    // If no pattern matches, return as-is (might be external URL)
    return resolvedWpUrl;
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
