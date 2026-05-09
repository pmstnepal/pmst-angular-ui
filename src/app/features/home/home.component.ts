import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'pmst-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home-page">
      <!-- Hero Section -->
      <section class="hero bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-20 md:py-32">
        <div class="container mx-auto px-4 text-center">
          <h1 class="text-4xl md:text-6xl font-bold mb-6">PMST US-Nepal</h1>
          <p class="text-xl md:text-2xl mb-8 text-indigo-100">Premium Model Showcase and Talent Platform</p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a routerLink="/showcase" class="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Explore Showcase
            </a>
            <a routerLink="/register" class="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
              Join as Model
            </a>
          </div>
        </div>
      </section>

      <!-- News Section -->
      <section class="py-16 bg-gray-50">
        <div class="container mx-auto px-4">
          <div class="flex justify-between items-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900">Latest News</h2>
            <a routerLink="/news" class="text-indigo-600 font-semibold hover:text-indigo-700">View All →</a>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            @for (i of [1, 2, 3]; track i) {
              <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div class="h-48 bg-gray-200"></div>
                <div class="p-4">
                  <span class="text-sm text-indigo-600 font-medium">News</span>
                  <h3 class="text-lg font-semibold mt-2 text-gray-900">Featured Article {{ i }}</h3>
                  <p class="text-gray-600 mt-2 text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Showcase Section -->
      <section class="py-16">
        <div class="container mx-auto px-4">
          <div class="flex justify-between items-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900">Featured Models</h2>
            <a routerLink="/showcase" class="text-indigo-600 font-semibold hover:text-indigo-700">View All →</a>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            @for (i of [1, 2, 3, 4]; track i) {
              <div class="relative group overflow-hidden rounded-lg aspect-[3/4]">
                <div class="w-full h-full bg-gradient-to-b from-gray-300 to-gray-400"></div>
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <div class="text-white">
                    <h3 class="font-semibold">Model {{ i }}</h3>
                    <p class="text-sm text-gray-300">Fashion • Runway</p>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Video Section -->
      <section class="py-16 bg-gray-900 text-white">
        <div class="container mx-auto px-4">
          <div class="flex justify-between items-center mb-8">
            <h2 class="text-3xl font-bold">Latest Videos</h2>
            <a href="#" class="text-indigo-400 font-semibold hover:text-indigo-300">View Playlist →</a>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            @for (i of [1, 2]; track i) {
              <div class="relative aspect-video bg-gray-800 rounded-lg overflow-hidden group">
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <h3 class="font-semibold">Featured Video {{ i }}</h3>
                  <p class="text-sm text-gray-300">2.5K views • 3 days ago</p>
                </div>
              </div>
            }
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [``]
})
export class HomeComponent {}
