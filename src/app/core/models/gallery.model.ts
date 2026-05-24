/**
 * Gallery Models
 * Centralized gallery interfaces to enforce DRY principle
 */

export interface GalleryImage {
  id: string;
  imageUrl: string;
  caption?: string;
  sortOrder: number;
}

export interface Gallery {
  id: string;
  title: string;
  slug: string;
  description?: string;
  featuredImage?: string;
  images: GalleryImage[];
  status: string;
  createdAt: string;
  authorId?: string;
  authorName?: string;
  categoryId?: string;
  seoFocusKeyword?: string;
  seoDescription?: string;
  seoTitle?: string;
}

export interface GallerySummary {
  id: string;
  title: string;
  slug: string;
  featuredImage?: string;
  authorName?: string;
}
