import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface UserInterestData {
  categoryViews: Record<string, number>;
  viewedArticles: string[];
  lastUpdated: number;
}

const STORAGE_KEY = 'pmst_user_interests';
const EXPIRY_DAYS = 30;

@Injectable({
  providedIn: 'root'
})
export class UserInterestService {
  private platformId = inject(PLATFORM_ID);

  private getData(): UserInterestData {
    if (!isPlatformBrowser(this.platformId)) {
      return { categoryViews: {}, viewedArticles: [], lastUpdated: Date.now() };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return { categoryViews: {}, viewedArticles: [], lastUpdated: Date.now() };
      }

      const data = JSON.parse(stored) as UserInterestData;
      const expiry = data.lastUpdated + (EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      if (Date.now() > expiry) {
        this.clearData();
        return { categoryViews: {}, viewedArticles: [], lastUpdated: Date.now() };
      }

      return data;
    } catch {
      return { categoryViews: {}, viewedArticles: [], lastUpdated: Date.now() };
    }
  }

  private saveData(data: UserInterestData): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save user interest data:', e);
    }
  }

  private clearData(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear user interest data:', e);
    }
  }

  trackArticleView(articleId: string, category: string): void {
    const data = this.getData();

    if (!data.viewedArticles.includes(articleId)) {
      data.viewedArticles.push(articleId);
    }

    if (category) {
      const normalizedCategory = category.toLowerCase();
      data.categoryViews[normalizedCategory] = (data.categoryViews[normalizedCategory] || 0) + 1;
    }

    data.lastUpdated = Date.now();
    this.saveData(data);
  }

  getMostViewedCategory(): string | null {
    const data = this.getData();
    const entries = Object.entries(data.categoryViews);

    if (entries.length === 0) {
      return null;
    }

    const sorted = entries.sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
  }

  hasViewedArticle(articleId: string): boolean {
    const data = this.getData();
    return data.viewedArticles.includes(articleId);
  }

  clear(): void {
    this.clearData();
  }
}
