/**
 * Core Models Index
 * Export all shared models for clean imports
 */

export * from './article.model';
export * from './gallery.model';

// Shared response interfaces
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string[]>;
}
