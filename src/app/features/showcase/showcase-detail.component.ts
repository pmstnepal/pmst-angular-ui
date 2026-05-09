import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'pmst-showcase-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="showcase-detail">
      @if (loading()) {
        <div class="container mx-auto px-4 py-8">
          <div class="animate-pulse space-y-4">
            <div class="h-96 bg-gray-200 rounded-lg"></div>
            <div class="h-8 bg-gray-200 rounded w-1/3"></div>
            <div class="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      } @else {
        <!-- Cover Photo -->
        <div class="relative h-64 md:h-96 bg-gradient-to-br from-indigo-600 to-purple-700">
          <div class="absolute inset-0 bg-black/20"></div>
        </div>

        <div class="container mx-auto px-4">
          <!-- Profile Header -->
          <div class="relative -mt-20 mb-8">
            <div class="flex flex-col md:flex-row items-center md:items-end gap-6">
              <!-- Avatar -->
              <div class="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg">
                <span class="text-5xl md:text-6xl font-bold text-white">{{ model().name[0] }}</span>
              </div>

              <!-- Info -->
              <div class="text-center md:text-left flex-1 mb-2">
                <h1 class="text-2xl md:text-3xl font-bold text-gray-900">{{ model().name }}</h1>
                <p class="text-gray-600">{{ model().location }}</p>
                <div class="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                  @for (category of model().categories; track category) {
                    <span class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                      {{ category }}
                    </span>
                  }
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-3">
                <button class="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                  Follow
                </button>
                <button class="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-colors">
                  Message
                </button>
              </div>
            </div>
          </div>

          <!-- Stats -->
          <div class="flex justify-center md:justify-start gap-8 py-6 border-y border-gray-200 mb-8">
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900">{{ model().stats.followers | number }}</div>
              <div class="text-sm text-gray-500">Followers</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900">{{ model().stats.following | number }}</div>
              <div class="text-sm text-gray-500">Following</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900">{{ model().stats.photos }}</div>
              <div class="text-sm text-gray-500">Photos</div>
            </div>
          </div>

          <!-- Bio -->
          <div class="max-w-3xl mb-12">
            <h2 class="text-xl font-bold text-gray-900 mb-4">About</h2>
            <p class="text-gray-700 leading-relaxed">{{ model().bio }}</p>
          </div>

          <!-- Gallery -->
          <div class="mb-12">
            <h2 class="text-xl font-bold text-gray-900 mb-6">Portfolio</h2>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              @for (photo of model().portfolio; track photo.id) {
                <div class="relative aspect-square rounded-lg overflow-hidden group cursor-pointer">
                  <div class="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300"></div>
                  <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                    </svg>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Comments Section -->
          <div class="max-w-3xl">
            <h2 class="text-xl font-bold text-gray-900 mb-6">Comments</h2>
            
            <!-- Comment Form -->
            <div class="flex gap-4 mb-8">
              <div class="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"></div>
              <div class="flex-1">
                <textarea 
                  placeholder="Write a comment..."
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  rows="3"
                ></textarea>
                <div class="flex justify-end mt-2">
                  <button class="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                    Post Comment
                  </button>
                </div>
              </div>
            </div>

            <!-- Comments List -->
            <div class="space-y-4">
              @for (comment of comments(); track comment.id) {
                <div class="flex gap-4">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <span class="text-white font-semibold">{{ comment.author[0] }}</span>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-semibold text-gray-900">{{ comment.author }}</span>
                      <span class="text-sm text-gray-500">{{ comment.time }}</span>
                    </div>
                    <p class="text-gray-700">{{ comment.text }}</p>
                    <div class="flex items-center gap-4 mt-2">
                      <button class="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                        </svg>
                        {{ comment.likes }}
                      </button>
                      <button class="text-sm text-gray-500 hover:text-indigo-600">Reply</button>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [``]
})
export class ShowcaseDetailComponent {
  @Input() id!: string;

  loading = signal(true);
  model = signal({
    name: '',
    location: '',
    categories: [] as string[],
    bio: '',
    stats: {
      followers: 0,
      following: 0,
      photos: 0
    },
    portfolio: [] as { id: string; url: string }[]
  });

  comments = signal([
    { id: '1', author: 'Fashion Fan', text: 'Amazing portfolio! Love your work.', time: '2 hours ago', likes: 12 },
    { id: '2', author: 'Photographer Joe', text: 'Would love to collaborate on a shoot.', time: '5 hours ago', likes: 8 },
    { id: '3', author: 'Model Agency', text: 'Great poses and expressions. Keep it up!', time: '1 day ago', likes: 24 }
  ]);

  constructor() {
    // Simulate loading model data
    setTimeout(() => {
      this.model.set({
        name: 'Priya Sharma',
        location: 'Kathmandu, Nepal',
        categories: ['Fashion', 'Runway', 'Editorial'],
        bio: 'Professional model based in Kathmandu with 5 years of experience in fashion and runway. Featured in major fashion weeks across Asia and worked with renowned designers. Passionate about promoting Nepali talent on the global stage.',
        stats: {
          followers: 12547,
          following: 342,
          photos: 48
        },
        portfolio: [
          { id: '1', url: '' },
          { id: '2', url: '' },
          { id: '3', url: '' },
          { id: '4', url: '' },
          { id: '5', url: '' },
          { id: '6', url: '' }
        ]
      });
      this.loading.set(false);
    }, 600);
  }
}
