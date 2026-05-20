import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'pmst-admin-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-dashboard py-8">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div class="flex items-center space-x-2">
            <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Admin</span>
          </div>
        </div>
        
        <!-- Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-sm font-medium text-gray-500 mb-1">Total Users</h3>
            <p class="text-3xl font-bold text-indigo-600">{{ stats().users }}</p>
            <p class="text-xs text-green-600 mt-1">+{{ stats().newUsers }} new today</p>
          </div>
          
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-sm font-medium text-gray-500 mb-1">Pending Review</h3>
            <p class="text-3xl font-bold text-yellow-600">{{ stats().pending }}</p>
            <p class="text-xs text-gray-500 mt-1">Articles & Galleries</p>
          </div>
          
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-sm font-medium text-gray-500 mb-1">Published</h3>
            <p class="text-3xl font-bold text-green-600">{{ stats().published }}</p>
            <p class="text-xs text-gray-500 mt-1">This month</p>
          </div>
          
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-sm font-medium text-gray-500 mb-1">Flagged Comments</h3>
            <p class="text-3xl font-bold text-red-600">{{ stats().flagged }}</p>
            <p class="text-xs text-gray-500 mt-1">Needs attention</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Pending Submissions -->
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-white rounded-lg shadow">
              <div class="p-6 border-b">
                <h2 class="text-xl font-semibold">Pending Submissions</h2>
              </div>
              <div class="divide-y">
                @for (item of pendingSubmissions(); track item.id) {
                  <div class="p-6 flex items-center justify-between hover:bg-gray-50">
                    <div class="flex items-start space-x-4">
                      <div class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        @if (item.type === 'gallery') {
                          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                        } @else {
                          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                          </svg>
                        }
                      </div>
                      <div>
                        <h4 class="font-semibold text-gray-900">{{ item.title }}</h4>
                        <p class="text-sm text-gray-500">by {{ item.author }} • {{ item.date }}</p>
                        <span class="inline-block mt-1 px-2 py-0.5 text-xs rounded" [class.bg-blue-100]="item.type === 'article'" [class.text-blue-800]="item.type === 'article'" [class.bg-pink-100]="item.type === 'gallery'" [class.text-pink-800]="item.type === 'gallery'">
                          {{ item.type }}
                        </span>
                      </div>
                    </div>
                    <div class="flex items-center space-x-2">
                      <button 
                        (click)="approveItem(item.id)"
                        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        Approve
                      </button>
                      <button 
                        (click)="rejectItem(item.id)"
                        class="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                }
                @if (pendingSubmissions().length === 0) {
                  <div class="p-6 text-center text-gray-500">
                    No pending submissions
                  </div>
                }
              </div>
            </div>

            <!-- Recent Comments -->
            <div class="bg-white rounded-lg shadow">
              <div class="p-6 border-b">
                <h2 class="text-xl font-semibold">Recent Comments</h2>
              </div>
              <div class="divide-y">
                @for (comment of recentComments(); track comment.id) {
                  <div class="p-6 hover:bg-gray-50">
                    <div class="flex items-start justify-between">
                      <div class="flex items-start space-x-3">
                        <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span class="text-indigo-600 font-semibold">{{ comment.author[0] }}</span>
                        </div>
                        <div>
                          <p class="font-semibold">{{ comment.author }}</p>
                          <p class="text-sm text-gray-600 mt-1">{{ comment.content }}</p>
                          <p class="text-xs text-gray-400 mt-2">on {{ comment.article }} • {{ comment.date }}</p>
                        </div>
                      </div>
                      @if (comment.flagged) {
                        <span class="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Flagged</span>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Quick Actions -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="font-semibold mb-4">Quick Actions</h3>
              <div class="space-y-2">
                <button class="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center">
                  <svg class="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                  </svg>
                  Manage Users
                </button>
                <button class="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center">
                  <svg class="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                  </svg>
                  Categories
                </button>
                <button class="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center">
                  <svg class="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Site Settings
                </button>
              </div>
            </div>

            <!-- System Status -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="font-semibold mb-4">System Status</h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">Database</span>
                  <span class="flex items-center text-green-600 text-sm">
                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Online
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">Storage</span>
                  <span class="flex items-center text-green-600 text-sm">
                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Online
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">CDN</span>
                  <span class="flex items-center text-green-600 text-sm">
                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [``]
})
export class AdminDashboardComponent {
  stats = signal({
    users: 1234,
    newUsers: 12,
    pending: 8,
    published: 45,
    flagged: 3
  });

  pendingSubmissions = signal([
    { id: 1, title: 'Nepali Fashion Week 2024', author: 'John Doe', date: '2 hours ago', type: 'gallery' },
    { id: 2, title: 'Interview with Director', author: 'Jane Smith', date: '5 hours ago', type: 'article' },
    { id: 3, title: 'Event Coverage: Music Festival', author: 'Mike Johnson', date: '1 day ago', type: 'gallery' }
  ]);

  recentComments = signal([
    { id: 1, author: 'Alice', content: 'Great article! Very informative.', article: 'Nepali Cinema Trends', date: '1 hour ago', flagged: false },
    { id: 2, author: 'Bob', content: 'Amazing photos from the event!', article: 'Fashion Week Gallery', date: '3 hours ago', flagged: true },
    { id: 3, author: 'Charlie', content: 'Thanks for sharing this news.', article: 'Film Release Announcement', date: '5 hours ago', flagged: false }
  ]);

  approveItem(id: number): void {
    this.pendingSubmissions.update(items => items.filter(item => item.id !== id));
    alert('Item approved!');
  }

  rejectItem(id: number): void {
    this.pendingSubmissions.update(items => items.filter(item => item.id !== id));
    alert('Item rejected!');
  }
}
