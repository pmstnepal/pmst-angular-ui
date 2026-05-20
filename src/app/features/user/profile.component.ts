import { Component, Input, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'pmst-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="profile-page">
      @if (loading()) {
        <div class="container mx-auto px-4 py-8">
          <div class="animate-pulse space-y-4">
            <div class="h-64 bg-gray-200 rounded-lg"></div>
            <div class="h-8 bg-gray-200 rounded w-1/3"></div>
            <div class="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      } @else {
        <!-- Cover Photo -->
        <div class="relative h-48 md:h-72 bg-gradient-to-br from-purple-600 to-indigo-700">
          @if (user().coverPhoto) {
            <img [src]="user().coverPhoto" alt="Cover" class="w-full h-full object-cover">
          }
          <div class="absolute inset-0 bg-black/30"></div>
        </div>

        <div class="container mx-auto px-4">
          <!-- Profile Header -->
          <div class="relative -mt-16 md:-mt-20 mb-8">
            <div class="flex flex-col md:flex-row items-center md:items-end gap-6">
              <!-- Avatar -->
              <div class="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg">
                @if (user().avatar) {
                  <img [src]="user().avatar" [alt]="user().displayName" class="w-full h-full rounded-full object-cover">
                } @else {
                  <span class="text-5xl md:text-6xl font-bold text-white">{{ user().displayName[0] }}</span>
                }
              </div>

              <!-- Info -->
              <div class="text-center md:text-left flex-1 mb-2">
                <h1 class="text-2xl md:text-3xl font-bold text-gray-900">{{ user().displayName }}</h1>
                <p class="text-gray-500">&#64;{{ user().username }}</p>
                <p class="text-gray-600 mt-2">{{ user().bio }}</p>
                <div class="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                  @for (role of user().roles; track role) {
                    <span class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                      {{ role }}
                    </span>
                  }
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-3 mb-2">
                @if (isOwnProfile()) {
                  <button class="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                    Edit Profile
                  </button>
                } @else {
                  <button class="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                    Follow
                  </button>
                  <button class="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-colors">
                    Message
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Stats -->
          <div class="flex justify-center md:justify-start gap-8 py-6 border-y border-gray-200 mb-8">
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900">{{ user().stats.followers | number }}</div>
              <div class="text-sm text-gray-500">Followers</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900">{{ user().stats.following | number }}</div>
              <div class="text-sm text-gray-500">Following</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900">{{ user().stats.photos }}</div>
              <div class="text-sm text-gray-500">Photos</div>
            </div>
          </div>

          <!-- Content Tabs -->
          <div class="mb-8">
            <div class="flex border-b border-gray-200">
              <button 
                (click)="setTab('photos')"
                [class.border-indigo-600]="activeTab() === 'photos'"
                [class.text-indigo-600]="activeTab() === 'photos'"
                class="px-6 py-3 font-medium border-b-2 border-transparent hover:text-indigo-600 transition-colors"
              >
                Photos
              </button>
              <button 
                (click)="setTab('about')"
                [class.border-indigo-600]="activeTab() === 'about'"
                [class.text-indigo-600]="activeTab() === 'about'"
                class="px-6 py-3 font-medium border-b-2 border-transparent hover:text-indigo-600 transition-colors"
              >
                About
              </button>
              <button 
                (click)="setTab('activity')"
                [class.border-indigo-600]="activeTab() === 'activity'"
                [class.text-indigo-600]="activeTab() === 'activity'"
                class="px-6 py-3 font-medium border-b-2 border-transparent hover:text-indigo-600 transition-colors"
              >
                Activity
              </button>
            </div>

            <div class="py-8">
              @switch (activeTab()) {
                @case ('photos') {
                  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    @for (photo of photos(); track photo.id) {
                      <div class="relative aspect-square rounded-lg overflow-hidden group cursor-pointer bg-gray-100">
                        <div class="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300"></div>
                        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                          </svg>
                        </div>
                      </div>
                    }
                  </div>
                }
                @case ('about') {
                  <div class="max-w-2xl">
                    <h3 class="text-lg font-bold text-gray-900 mb-4">About</h3>
                    <p class="text-gray-700 leading-relaxed mb-6">{{ user().bio }}</p>
                    
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
                    <div class="space-y-2 text-gray-700">
                      <p><strong>Location:</strong> {{ user().location }}</p>
                      <p><strong>Website:</strong> <a href="#" class="text-indigo-600 hover:text-indigo-700">{{ user().website }}</a></p>
                      <p><strong>Email:</strong> <a href="mailto:{{ user().email }}" class="text-indigo-600 hover:text-indigo-700">{{ user().email }}</a></p>
                    </div>
                  </div>
                }
                @case ('activity') {
                  <div class="max-w-2xl space-y-4">
                    @for (activity of activities(); track activity.id) {
                      <div class="flex gap-4 p-4 bg-gray-50 rounded-lg">
                        <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                        </div>
                        <div>
                          <p class="text-gray-900">{{ activity.description }}</p>
                          <p class="text-sm text-gray-500">{{ activity.time }}</p>
                        </div>
                      </div>
                    }
                  </div>
                }
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [``]
})
export class ProfileComponent {
  @Input() username!: string;

  loading = signal(true);
  activeTab = signal<'photos' | 'about' | 'activity'>('photos');
  isOwnProfile = signal(false);

  user = signal({
    username: '',
    displayName: '',
    bio: '',
    avatar: '',
    coverPhoto: '',
    location: '',
    website: '',
    email: '',
    roles: [] as string[],
    stats: {
      followers: 0,
      following: 0,
      photos: 0
    }
  });

  photos = signal<{ id: string }[]>([]);
  activities = signal<{ id: string; description: string; time: string }[]>([]);

  constructor() {
    // Simulate loading user data
    setTimeout(() => {
      this.user.set({
        username: 'priyasharma',
        displayName: 'Priya Sharma',
        bio: 'Professional model based in Kathmandu. Passionate about fashion, photography, and promoting Nepali talent globally. Available for bookings and collaborations.',
        avatar: '',
        coverPhoto: '',
        location: 'Kathmandu, Nepal',
        website: 'www.priyasharma.com',
        email: 'contact@priyasharma.com',
        roles: ['Model', 'Influencer'],
        stats: {
          followers: 12547,
          following: 342,
          photos: 48
        }
      });

      this.photos.set([
        { id: '1' }, { id: '2' }, { id: '3' }, { id: '4' },
        { id: '5' }, { id: '6' }, { id: '7' }, { id: '8' }
      ]);

      this.activities.set([
        { id: '1', description: 'Uploaded 3 new photos to portfolio', time: '2 hours ago' },
        { id: '2', description: 'Commented on Anika\'s photo', time: '5 hours ago' },
        { id: '3', description: 'Updated profile information', time: '1 day ago' },
        { id: '4', description: 'Liked 12 photos', time: '2 days ago' }
      ]);

      this.loading.set(false);
    }, 600);
  }

  setTab(tab: 'photos' | 'about' | 'activity'): void {
    this.activeTab.set(tab);
  }
}
