/**
 * Article Models
 * Centralized article interfaces to enforce DRY principle
 */

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  featuredImage?: string;
  youtubeLink?: string;
  embedCode?: string;
  galleryImages?: string[];
  category: string;
  publishedAt: string;
  authorId?: string;
  authorName?: string;
  status?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  youtubeLink?: string;
  embedCode?: string;
  galleryImages?: string[];
  category: string;
  publishedAt: string;
  authorName?: string;
}

export interface ArticleDetail {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  youtubeLink?: string;
  embedCode?: string;
  galleryImages?: string[] | string; // Can be array or JSON string
  category: string;
  status?: string;
  publishedAt: string;
  createdAt?: string;
  authorId?: string;
  author?: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

export interface RelatedArticle {
  id: string;
  slug: string;
  title: string;
  featuredImage?: string;
  publishedAt: string;
}
