import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface GalleryImage {
  id: string;
  file: File;
  preview: string;
  caption: string;
}

@Component({
  selector: 'pmst-submit-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="submit-gallery py-8">
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
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Submit Your Gallery</h1>
          <p class="text-gray-600 mb-8">Showcase your photography and creative work with the PMST community.</p>

          <form (ngSubmit)="onSubmit()" class="space-y-6">
            <!-- Gallery Title -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Gallery Title *</label>
              <input 
                type="text" 
                [(ngModel)]="formData.title"
                name="title"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="Enter a descriptive title"
              >
            </div>

            <!-- Category -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select 
                [(ngModel)]="formData.category"
                name="category"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">Select a category</option>
                <option value="model-shoot">Model Shoot</option>
                <option value="event-coverage">Event Coverage</option>
                <option value="fashion">Fashion</option>
                <option value="portrait">Portrait</option>
                <option value="wedding">Wedding</option>
                <option value="nature">Nature</option>
              </select>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea 
                [(ngModel)]="formData.description"
                name="description"
                required
                rows="4"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="Describe your gallery, the event, or the shoot..."
              ></textarea>
            </div>

            <!-- Photo Upload -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Upload Photos *</label>
              <div 
                class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-pink-500 transition-colors cursor-pointer"
                (click)="fileInput.click()"
                (dragover)="onDragOver($event)"
                (drop)="onDrop($event)"
              >
                <svg class="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                <p class="text-gray-600">Drag and drop photos here, or click to browse</p>
                <p class="text-xs text-gray-500 mt-1">JPG, PNG, WebP up to 10MB each. Max 50 photos.</p>
                <input 
                  #fileInput
                  type="file" 
                  multiple 
                  accept="image/*"
                  class="hidden"
                  (change)="onFileSelected($event)"
                >
              </div>
            </div>

            <!-- Uploaded Images Preview -->
            @if (uploadedImages().length > 0) {
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Uploaded Photos ({{ uploadedImages().length }})
                </label>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                  @for (image of uploadedImages(); track image.id; let i = $index) {
                    <div class="relative group">
                      <img [src]="image.preview" class="w-full h-32 object-cover rounded-lg">
                      <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <button type="button" (click)="removeImage(i)" class="text-white hover:text-red-400">
                          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                      <input 
                        type="text" 
                        [(ngModel)]="image.caption"
                        [name]="'caption-' + i"
                        placeholder="Add caption..."
                        class="absolute bottom-0 left-0 right-0 bg-white bg-opacity-90 px-2 py-1 text-xs rounded-b-lg"
                      >
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Tags -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <input 
                type="text" 
                [(ngModel)]="formData.tags"
                name="tags"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="Enter tags separated by commas (e.g., photoshoot, kathmandu, fashion)"
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
                  [disabled]="isSubmitting() || uploadedImages().length === 0"
                  class="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  @if (isSubmitting()) {
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  } @else {
                    Submit Gallery
                  }
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- Guidelines -->
        <div class="mt-6 bg-pink-50 rounded-lg p-6">
          <h3 class="font-semibold text-pink-800 mb-3">Gallery Guidelines</h3>
          <ul class="text-sm text-pink-700 space-y-2">
            <li>• Minimum 5 photos per gallery</li>
            <li>• Maximum 50 photos per gallery</li>
            <li>• Photos must be high quality (minimum 1920x1080)</li>
            <li>• Only upload photos you have rights to</li>
            <li>• Add descriptive captions for better engagement</li>
            <li>• Galleries are reviewed before publication</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [``]
})
export class SubmitGalleryComponent {
  formData = {
    title: '',
    category: '',
    description: '',
    tags: ''
  };

  uploadedImages = signal<GalleryImage[]>([]);
  isSubmitting = signal(false);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files) {
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  handleFiles(files: File[]): void {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: GalleryImage = {
          id: Math.random().toString(36).substr(2, 9),
          file: file,
          preview: e.target?.result as string,
          caption: ''
        };
        this.uploadedImages.update(images => [...images, newImage]);
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    this.uploadedImages.update(images => images.filter((_, i) => i !== index));
  }

  onSubmit(): void {
    if (this.uploadedImages().length === 0) return;
    
    this.isSubmitting.set(true);
    setTimeout(() => {
      this.isSubmitting.set(false);
      alert('Gallery submitted for review!');
    }, 2000);
  }

  saveDraft(): void {
    alert('Draft saved!');
  }
}
