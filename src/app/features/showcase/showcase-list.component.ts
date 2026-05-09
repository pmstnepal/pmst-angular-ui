import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface Model {
  id: string;
  name: string;
  imageUrl?: string;
  categories: string[];
  location: string;
  stats: {
    followers: number;
    photos: number;
  };
}

@Component({
  selector: 'pmst-showcase-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="showcase-page py-8">
      <div class="container mx-auto px-4">
        <!-- Header -->
        <div class="text-center mb-12">
          <h1 class="text-3xl md:text-4xl font-bold mb-4">Model Showcase</h1>
          <p class="text-gray-600 max-w-2xl mx-auto">
            Discover talented models from Nepal and around the world. Browse portfolios, connect with professionals, and find your next collaboration.
          </p>
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap justify-center gap-2 mb-8">
          @for (category of categories(); track category) {
            <button
              (click)="setCategory(category)"
              [class.bg-indigo-600]="selectedCategory() === category"
              [class.text-white]="selectedCategory() === category"
              [class.bg-gray-200]="selectedCategory() !== category"
              [class.text-gray-700]="selectedCategory() !== category"
              class="px-4 py-2 rounded-full font-medium transition-colors"
            >
              {{ category }}
            </button>
          }
        </div>

        <!-- Models Grid -->
        @if (loading()) {
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            @for (i of [1, 2, 3, 4, 5, 6, 7, 8]; track i) {
              <div class="animate-pulse">
                <div class="aspect-[3/4] bg-gray-200 rounded-lg"></div>
                <div class="mt-3 h-4 bg-gray-200 rounded w-2/3"></div>
                <div class="mt-2 h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            }
          </div>
        } @else {
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            @for (model of models(); track model.id) {
              <a [routerLink]="['/showcase', model.id]" class="group">
                <div class="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
                  @if (model.imageUrl) {
                    <img 
                      [src]="model.imageUrl" 
                      [alt]="model.name"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    >
                  } @else {
                    <div class="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                      <span class="text-4xl font-bold text-white">{{ model.name[0] }}</span>
                    </div>
                  }
                  
                  <!-- Overlay -->
                  <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div class="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 class="font-semibold text-lg">{{ model.name }}</h3>
                      <p class="text-sm text-gray-300">{{ model.location }}</p>
                      <div class="flex gap-4 mt-2 text-xs">
                        <span>{{ model.stats.followers | number }} followers</span>
                        <span>{{ model.stats.photos }} photos</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Mobile Info -->
                <div class="mt-3 md:hidden">
                  <h3 class="font-semibold text-gray-900">{{ model.name }}</h3>
                  <p class="text-sm text-gray-500">{{ model.categories[0] }}</p>
                </div>
              </a>
            }
          </div>
        }

        <!-- Load More -->
        @if (!loading() && hasMore()) {
          <div class="text-center mt-12">
            <button 
              (click)="loadMore()"
              class="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Load More Models
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [``]
})
export class ShowcaseListComponent {
  categories = signal(['All', 'Fashion', 'Commercial', 'Runway', 'Editorial', 'Lifestyle']);
  selectedCategory = signal('All');
  models = signal<Model[]>([]);
  loading = signal(true);
  hasMore = signal(true);
  currentPage = signal(1);

  constructor() {
    this.loadModels();
  }

  private loadModels(): void {
    // Mock data - replace with API call
    const mockModels: Model[] = [
      { id: '1', name: 'Priya Sharma', categories: ['Fashion', 'Runway'], location: 'Kathmandu, Nepal', stats: { followers: 12500, photos: 48 } },
      { id: '2', name: 'Anika Gurung', categories: ['Commercial', 'Lifestyle'], location: 'Pokhara, Nepal', stats: { followers: 8900, photos: 32 } },
      { id: '3', name: 'Sita Tamang', categories: ['Editorial', 'Fashion'], location: 'Lalitpur, Nepal', stats: { followers: 15200, photos: 67 } },
      { id: '4', name: 'Maya Rai', categories: ['Runway', 'Fashion'], location: 'Bhaktapur, Nepal', stats: { followers: 21000, photos: 89 } },
      { id: '5', name: 'Kavita Limbu', categories: ['Commercial', 'Lifestyle'], location: 'Kathmandu, Nepal', stats: { followers: 6700, photos: 24 } },
      { id: '6', name: 'Rina Karki', categories: ['Editorial', 'Fashion'], location: 'Chitwan, Nepal', stats: { followers: 9800, photos: 41 } },
      { id: '7', name: 'Bina Magar', categories: ['Fashion', 'Commercial'], location: 'Kathmandu, Nepal', stats: { followers: 11300, photos: 52 } },
      { id: '8', name: 'Laxmi BK', categories: ['Runway', 'Editorial'], location: 'Pokhara, Nepal', stats: { followers: 14400, photos: 73 } }
    ];

    setTimeout(() => {
      this.models.set(mockModels);
      this.loading.set(false);
    }, 500);
  }

  setCategory(category: string): void {
    this.selectedCategory.set(category);
    this.currentPage.set(1);
    this.loading.set(true);
    this.loadModels();
  }

  loadMore(): void {
    this.currentPage.update(p => p + 1);
    // Would load more from API
    this.hasMore.set(false);
  }
}
