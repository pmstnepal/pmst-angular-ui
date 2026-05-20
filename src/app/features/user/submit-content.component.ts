import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'pmst-submit-content',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="submit-content py-8">
      <div class="container mx-auto px-4 max-w-4xl">
        <div class="mb-6">
          <a routerLink="/dashboard" class="text-gray-600 hover:text-indigo-600 flex items-center">
            <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Back to Dashboard
          </a>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Submit Your Article</h1>
          <p class="text-gray-600 mb-8">Share your news, stories, or entertainment updates with the PMST community.</p>

          <form (ngSubmit)="onSubmit()" class="space-y-6">
            <!-- Title -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Article Title *</label>
              <input 
                type="text" 
                [(ngModel)]="formData.title"
                name="title"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter a catchy title"
              >
            </div>

            <!-- Category -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select 
                [(ngModel)]="formData.category"
                name="category"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a category</option>
                <option value="news">News</option>
                <option value="entertainment">Entertainment</option>
                <option value="fashion">Fashion</option>
                <option value="events">Events</option>
                <option value="interviews">Interviews</option>
              </select>
            </div>

            <!-- Excerpt -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Short Excerpt *</label>
              <textarea 
                [(ngModel)]="formData.excerpt"
                name="excerpt"
                required
                rows="2"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Brief summary of your article (150 characters max)"
                maxlength="150"
              ></textarea>
              <p class="text-xs text-gray-500 mt-1">{{ formData.excerpt.length || 0 }}/150 characters</p>
            </div>

            <!-- Content -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Article Content *</label>
              <textarea 
                [(ngModel)]="formData.content"
                name="content"
                required
                rows="10"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Write your full article here..."
              ></textarea>
            </div>

            <!-- Featured Image -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Featured Image</label>
              <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
                <svg class="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <p class="text-gray-600">Drag and drop an image, or <span class="text-indigo-600 cursor-pointer">browse</span></p>
                <p class="text-xs text-gray-500 mt-1">JPG, PNG, WebP up to 5MB</p>
              </div>
            </div>

            <!-- Tags -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <input 
                type="text" 
                [(ngModel)]="formData.tags"
                name="tags"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter tags separated by commas (e.g., nepali cinema, fashion, events)"
              >
            </div>

            <!-- Submit Buttons -->
            <div class="flex items-center justify-between pt-4 border-t">
              <button 
                type="button" 
                (click)="saveDraft()"
                class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Save as Draft
              </button>
              <div class="flex gap-3">
                <a routerLink="/dashboard" class="px-6 py-3 text-gray-600 hover:text-gray-800">
                  Cancel
                </a>
                <button 
                  type="submit"
                  [disabled]="isSubmitting()"
                  class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  @if (isSubmitting()) {
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  } @else {
                    Submit for Review
                  }
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- Guidelines -->
        <div class="mt-6 bg-blue-50 rounded-lg p-6">
          <h3 class="font-semibold text-blue-800 mb-3">Submission Guidelines</h3>
          <ul class="text-sm text-blue-700 space-y-2">
            <li>• Content must be original and not published elsewhere</li>
            <li>• Articles should be at least 300 words</li>
            <li>• Include proper attribution for quotes and images</li>
            <li>• No promotional or spam content</li>
            <li>• Submissions are reviewed within 24-48 hours</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [``]
})
export class SubmitContentComponent {
  formData = {
    title: '',
    category: '',
    excerpt: '',
    content: '',
    tags: ''
  };

  isSubmitting = signal(false);

  onSubmit(): void {
    this.isSubmitting.set(true);
    // Simulate API call
    setTimeout(() => {
      this.isSubmitting.set(false);
      alert('Article submitted for review!');
    }, 2000);
  }

  saveDraft(): void {
    alert('Draft saved!');
  }
}
