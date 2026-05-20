import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'pmst-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard py-8">
      <div class="container mx-auto px-4">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">My Dashboard</h1>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Stats Cards -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-700 mb-2">My Articles</h3>
            <p class="text-3xl font-bold text-indigo-600">{{ stats().articles }}</p>
            <p class="text-sm text-gray-500">Published articles</p>
          </div>
          
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-700 mb-2">My Galleries</h3>
            <p class="text-3xl font-bold text-pink-600">{{ stats().galleries }}</p>
            <p class="text-sm text-gray-500">Photo galleries</p>
          </div>
          
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-700 mb-2">Followers</h3>
            <p class="text-3xl font-bold text-green-600">{{ stats().followers }}</p>
            <p class="text-sm text-gray-500">People following you</p>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
          <h2 class="text-xl font-semibold mb-4">Quick Actions</h2>
          <div class="flex flex-wrap gap-4">
            <a routerLink="/submit/article" class="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Submit Article
            </a>
            <a routerLink="/submit/gallery" class="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              Submit Gallery
            </a>
            <a routerLink="/profile/me" class="bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              View Profile
            </a>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4">Recent Submissions</h3>
            @if (recentSubmissions().length === 0) {
              <p class="text-gray-500">No submissions yet. Start creating content!</p>
            } @else {
              <div class="space-y-3">
                @for (item of recentSubmissions(); track item.id) {
                  <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p class="font-medium">{{ item.title }}</p>
                      <p class="text-sm text-gray-500">{{ item.type }} • {{ item.date }}</p>
                    </div>
                    <span class="px-2 py-1 text-xs rounded" [class.bg-green-100]="item.status === 'published'" [class.text-green-800]="item.status === 'published'" [class.bg-yellow-100]="item.status === 'pending'" [class.text-yellow-800]="item.status === 'pending'">
                      {{ item.status }}
                    </span>
                  </div>
                }
              </div>
            }
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4">Account Settings</h3>
            <div class="space-y-3">
              <button class="w-full text-left p-3 hover:bg-gray-50 rounded flex items-center justify-between">
                <span>Edit Profile</span>
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
              <button class="w-full text-left p-3 hover:bg-gray-50 rounded flex items-center justify-between">
                <span>Change Password</span>
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
              <button class="w-full text-left p-3 hover:bg-gray-50 rounded flex items-center justify-between">
                <span>Notification Settings</span>
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [``]
})
export class DashboardComponent {
  stats = signal({
    articles: 12,
    galleries: 5,
    followers: 234
  });

  recentSubmissions = signal([
    { id: 1, title: 'Nepali Film Industry 2024', type: 'Article', date: '2024-01-15', status: 'published' },
    { id: 2, title: 'Fashion Week Gallery', type: 'Gallery', date: '2024-01-10', status: 'pending' },
    { id: 3, title: 'Interview with Actor', type: 'Article', date: '2024-01-05', status: 'published' }
  ]);
}
