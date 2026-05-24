import { Component, Input, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { UserService, UserDto } from '../../services/user.service';
import { AuthService } from '../../core/services/auth.service';

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
          @if (user().coverPhotoUrl) {
            <img [src]="user().coverPhotoUrl" alt="Cover" class="w-full h-full object-cover">
          }
          <div class="absolute inset-0 bg-black/30"></div>
        </div>

        <div class="container mx-auto px-4">
          <!-- Profile Header -->
          <div class="relative -mt-16 md:-mt-20 mb-8">
            <div class="flex flex-col md:flex-row items-center md:items-end gap-6">
              <!-- Avatar -->
              <div class="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg">
                @if (user().avatarUrl) {
                  <img [src]="user().avatarUrl" [alt]="user().displayName" class="w-full h-full rounded-full object-cover">
                } @else {
                  <span class="text-5xl md:text-6xl font-bold text-white">{{ user().displayName?.[0] || user().username?.[0] || '?' }}</span>
                }
              </div>

              <!-- Info -->
              <div class="text-center md:text-left flex-1 mb-2">
                <h1 class="text-2xl md:text-3xl font-bold text-gray-900">{{ user().displayName || user().username }}</h1>
                <p class="text-gray-500">&#64;{{ user().username }}</p>
                <p class="text-gray-600 mt-2">{{ user().bio }}</p>
                <div class="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                  @if (user().title) {
                    <span class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                      {{ user().title }}
                    </span>
                  }
                  @if (user().organization) {
                    <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {{ user().organization }}
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
              <div class="text-2xl font-bold text-gray-900">0</div>
              <div class="text-sm text-gray-500">Followers</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900">0</div>
              <div class="text-sm text-gray-500">Following</div>
            </div>
          </div>

          <!-- Content Tabs -->
          <div class="mb-8">
            <div class="flex border-b border-gray-200">
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
                @case ('about') {
                  <div class="max-w-2xl">
                    <h3 class="text-lg font-bold text-gray-900 mb-4">About</h3>
                    <p class="text-gray-700 leading-relaxed mb-6">{{ user().bio || 'No bio provided' }}</p>
                    
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
                    <div class="space-y-2 text-gray-700">
                      @if (user().title) {
                        <p><strong>Title:</strong> {{ user().title }}</p>
                      }
                      @if (user().organization) {
                        <p><strong>Organization:</strong> {{ user().organization }}</p>
                      }
                      @if (isOwnProfile() && user().email) {
                        <p><strong>Email:</strong> <a href="mailto:{{ user().email }}" class="text-indigo-600 hover:text-indigo-700">{{ user().email }}</a></p>
                      }
                      @if (isOwnProfile() && user().phones) {
                        <p><strong>Phone(s):</strong> {{ user().phones }}</p>
                      }
                      @if (user().addressStreet || user().addressCity || user().addressState || user().addressCountry) {
                        <p><strong>Address:</strong> 
                          @if (isOwnProfile()) {
                            {{ [user().addressStreet, user().addressCity, user().addressState, user().addressCountry, user().addressPostal].filter(filterTruthy).join(', ') }}
                          } @else {
                            {{ [user().addressState, user().addressCountry].filter(filterTruthy).join(', ') }}
                          }
                        </p>
                      }
                      @if (user().websites) {
                        <p><strong>Website(s):</strong> <a href="#" class="text-indigo-600 hover:text-indigo-700">{{ user().websites }}</a></p>
                      }
                      @if (user().socials) {
                        <p><strong>Socials:</strong> <a href="#" class="text-indigo-600 hover:text-indigo-700">{{ user().socials }}</a></p>
                      }
                    </div>
                  </div>
                }
                @case ('activity') {
                  <div class="max-w-2xl">
                    <p class="text-gray-500">Activities section - user's posts will appear here</p>
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
export class ProfileComponent implements OnInit {
  @Input() username!: string;

  loading = signal(true);
  activeTab = signal<'about' | 'activity'>('about');
  isOwnProfile = signal(false);

  user = signal<UserDto>({
    id: '',
    cognitoId: '',
    email: '',
    username: '',
    displayName: '',
    bio: '',
    avatarUrl: '',
    coverPhotoUrl: '',
    title: '',
    organization: '',
    phones: '',
    websites: '',
    socials: '',
    addressCountry: '',
    addressState: '',
    addressCity: '',
    addressStreet: '',
    addressPostal: '',
    role: '',
    status: ''
  });

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const usernameParam = this.route.snapshot.paramMap.get('username') || this.username;
    
    if (usernameParam) {
      this.loadUserProfile(usernameParam);
    }
  }

  private loadUserProfile(username: string): void {
    this.userService.getUserByUsername(username).subscribe({
      next: (userData) => {
        this.user.set(userData);
        this.checkIsOwnProfile();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load user profile:', err);
        this.loading.set(false);
      }
    });
  }

  private checkIsOwnProfile(): void {
    const currentUser = this.authService.user();
    this.isOwnProfile.set(currentUser?.username === this.user().username);
  }

  setTab(tab: 'about' | 'activity'): void {
    this.activeTab.set(tab);
  }

  filterTruthy(value: string | undefined | null): boolean {
    return !!value;
  }
}
