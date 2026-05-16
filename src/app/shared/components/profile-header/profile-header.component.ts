import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FollowButtonComponent } from '../follow-button/follow-button.component';

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  coverPhotoUrl: string;
  followers: number;
  following: number;
  postCount: number;
  galleryCount: number;
  joinedDate: string;
  socialLinks: { platform: string; url: string }[];
}

@Component({
  selector: 'pmst-profile-header',
  standalone: true,
  imports: [CommonModule, RouterLink, FollowButtonComponent],
  template: `
    <div class="profile-header">
      <!-- Cover Photo -->
      <div class="relative h-48 md:h-64 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-xl overflow-hidden">
        @if (profile().coverPhotoUrl) {
          <img
            [src]="profile().coverPhotoUrl"
            [alt]="profile().displayName + ' cover'"
            class="w-full h-full object-cover"
          >
        }
        @if (isOwner) {
          <button class="absolute bottom-3 right-3 bg-black/50 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-black/70 transition-colors flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            Edit Cover
          </button>
        }
      </div>

      <!-- Profile Info -->
      <div class="relative bg-white rounded-b-xl shadow-lg px-6 pb-6">
        <div class="flex flex-col md:flex-row md:items-end gap-4 -mt-16 md:-mt-12">
          <!-- Avatar -->
          <div class="relative">
            <div class="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
              @if (profile().avatarUrl) {
                <img [src]="profile().avatarUrl" [alt]="profile().displayName" class="w-full h-full object-cover">
              } @else {
                <div class="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 text-4xl font-bold">
                  {{ profile().displayName[0] || '?' }}
                </div>
              }
            </div>
            @if (isOwner) {
              <button class="absolute bottom-1 right-1 bg-indigo-600 text-white p-1.5 rounded-full hover:bg-indigo-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                </svg>
              </button>
            }
          </div>

          <!-- Name & Actions -->
          <div class="flex-1 pt-2 md:pt-4">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h1 class="text-2xl font-bold text-gray-900">{{ profile().displayName }}</h1>
                <p class="text-gray-500">&#64;{{ profile().username }}</p>
              </div>
              @if (!isOwner) {
                <pmst-follow-button [targetUserId]="profile().id" [showCounts]="false" size="md"></pmst-follow-button>
              } @else {
                <a routerLink="/dashboard" class="px-4 py-2 border border-gray-300 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  Edit Profile
                </a>
              }
            </div>
          </div>
        </div>

        <!-- Bio -->
        @if (profile().bio) {
          <p class="mt-4 text-gray-600 max-w-2xl">{{ profile().bio }}</p>
        }

        <!-- Stats -->
        <div class="flex flex-wrap gap-6 mt-4 pt-4 border-t border-gray-100">
          <div class="text-center">
            <div class="text-xl font-bold text-gray-900">{{ profile().postCount }}</div>
            <div class="text-xs text-gray-500">Posts</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-bold text-gray-900">{{ profile().galleryCount }}</div>
            <div class="text-xs text-gray-500">Galleries</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-bold text-gray-900">{{ profile().followers }}</div>
            <div class="text-xs text-gray-500">Followers</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-bold text-gray-900">{{ profile().following }}</div>
            <div class="text-xs text-gray-500">Following</div>
          </div>
          <div class="ml-auto text-sm text-gray-400">
            Joined {{ profile().joinedDate | date:'MMMM yyyy' }}
          </div>
        </div>

        <!-- Social Links -->
        @if (profile().socialLinks.length > 0) {
          <div class="flex gap-3 mt-3">
            @for (link of profile().socialLinks; track link.platform) {
              <a [href]="link.url" target="_blank" rel="noopener" class="text-gray-400 hover:text-indigo-600 transition-colors text-sm">
                {{ link.platform }}
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ProfileHeaderComponent {
  @Input() isOwner = false;

  profile = signal<UserProfile>({
    id: '1',
    username: 'sampleuser',
    displayName: 'Sample User',
    bio: 'Creative content contributor at PMST US-Nepal',
    avatarUrl: '',
    coverPhotoUrl: '',
    followers: 42,
    following: 18,
    postCount: 12,
    galleryCount: 5,
    joinedDate: '2024-01-15',
    socialLinks: []
  });
}
