import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'pmst-follow-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="inline-flex items-center gap-3">
      <button
        (click)="toggleFollow()"
        [class]="buttonClasses()"
        [disabled]="loading()"
      >
        @if (loading()) {
          <svg class="animate-spin w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        }
        @if (isFollowing()) {
          <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          Following
        } @else {
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
          </svg>
          Follow
        }
      </button>

      @if (showCounts) {
        <span class="text-sm text-gray-500">
          <strong class="text-gray-700">{{ followerCount() }}</strong> Followers ·
          <strong class="text-gray-700">{{ followingCount() }}</strong> Following
        </span>
      }
    </div>
  `,
  styles: [`
    :host { display: inline-block; }
  `]
})
export class FollowButtonComponent {
  @Input() targetUserId = '';
  @Input() showCounts = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  isFollowing = signal(false);
  loading = signal(false);
  followerCount = signal(0);
  followingCount = signal(0);

  buttonClasses = computed(() => {
    const base = 'inline-flex items-center font-semibold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    const sizeClasses = {
      sm: 'px-3 py-1 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-2.5 text-base'
    };
    const stateClasses = this.isFollowing()
      ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 border border-gray-300 focus:ring-gray-300'
      : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500';

    return `${base} ${sizeClasses[this.size]} ${stateClasses}`;
  });

  toggleFollow() {
    this.loading.set(true);
    // Simulate API call
    setTimeout(() => {
      const wasFollowing = this.isFollowing();
      this.isFollowing.set(!wasFollowing);
      this.followerCount.update(c => wasFollowing ? c - 1 : c + 1);
      this.loading.set(false);
    }, 400);
  }
}
