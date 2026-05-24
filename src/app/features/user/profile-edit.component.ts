import { Component, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService, UserDto } from '../../services/user.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'pmst-profile-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Edit Profile</h1>

      @if (loading()) {
        <div class="animate-pulse space-y-4">
          <div class="h-8 bg-gray-200 rounded w-1/3"></div>
          <div class="h-4 bg-gray-200 rounded w-full"></div>
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      } @else {
        <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Basic Info -->
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input 
                  type="text" 
                  formControlName="displayName"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Title / Designation</label>
                <input 
                  type="text" 
                  formControlName="title"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                <input 
                  type="text" 
                  formControlName="organization"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
              </div>
            </div>

            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea 
                formControlName="bio"
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              ></textarea>
            </div>
          </div>

          <!-- Contact Info -->
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Phone Numbers (comma separated)</label>
                <input 
                  type="text" 
                  formControlName="phones"
                  placeholder="+977 1234567890, +977 9876543210"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
              </div>
            </div>
          </div>

          <!-- Address -->
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Address</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <input 
                  type="text" 
                  formControlName="addressStreet"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input 
                  type="text" 
                  formControlName="addressCity"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">State / Province</label>
                <input 
                  type="text" 
                  formControlName="addressState"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input 
                  type="text" 
                  formControlName="addressCountry"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                <input 
                  type="text" 
                  formControlName="addressPostal"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
              </div>
            </div>
          </div>

          <!-- Online Presence -->
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Online Presence</h2>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Websites (comma separated)</label>
                <input 
                  type="text" 
                  formControlName="websites"
                  placeholder="https://example.com, https://myportfolio.com"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Social Media Links (comma separated)</label>
                <input 
                  type="text" 
                  formControlName="socials"
                  placeholder="https://facebook.com/username, https://instagram.com/username"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
              </div>
            </div>
          </div>

          <!-- Photos -->
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Profile Photos</h2>
            <p class="text-sm text-gray-500 mb-4">Image upload functionality will be added later</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                <input 
                  type="text" 
                  formControlName="avatarUrl"
                  placeholder="https://example.com/avatar.jpg"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Cover Photo URL</label>
                <input 
                  type="text" 
                  formControlName="coverPhotoUrl"
                  placeholder="https://example.com/cover.jpg"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-4">
            <button 
              type="button"
              (click)="onCancel()"
              class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              [disabled]="profileForm.invalid || saving()"
              class="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if (saving()) {
                Saving...
              } @else {
                Save Changes
              }
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [``]
})
export class ProfileEditComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  profileForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      displayName: [''],
      title: [''],
      organization: [''],
      bio: [''],
      phones: [''],
      addressStreet: [''],
      addressCity: [''],
      addressState: [''],
      addressCountry: [''],
      addressPostal: [''],
      websites: [''],
      socials: [''],
      avatarUrl: [''],
      coverPhotoUrl: ['']
    });
  }

  ngOnInit(): void {
    this.loadCurrentUserProfile();
  }

  private loadCurrentUserProfile(): void {
    const currentUser = this.authService.user();
    if (currentUser) {
      this.userService.getUserProfile(currentUser.id).subscribe({
        next: (profile) => {
          this.populateForm(profile);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load profile:', err);
          this.loading.set(false);
        }
      });
    }
  }

  private populateForm(profile: UserDto): void {
    this.profileForm.patchValue({
      displayName: profile.displayName || '',
      title: profile.title || '',
      organization: profile.organization || '',
      bio: profile.bio || '',
      phones: profile.phones || '',
      addressStreet: profile.addressStreet || '',
      addressCity: profile.addressCity || '',
      addressState: profile.addressState || '',
      addressCountry: profile.addressCountry || '',
      addressPostal: profile.addressPostal || '',
      websites: profile.websites || '',
      socials: profile.socials || '',
      avatarUrl: profile.avatarUrl || '',
      coverPhotoUrl: profile.coverPhotoUrl || ''
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) return;

    const currentUser = this.authService.user();
    if (!currentUser) return;

    this.saving.set(true);

    const profileData: Partial<UserDto> = this.profileForm.value;

    this.userService.updateProfile(currentUser.id, profileData).subscribe({
      next: (updatedProfile) => {
        this.saving.set(false);
        // Refresh current user data
        this.authService.refreshUser().subscribe();
        alert('Profile updated successfully!');
      },
      error: (err) => {
        console.error('Failed to update profile:', err);
        this.saving.set(false);
        alert('Failed to update profile. Please try again.');
      }
    });
  }

  onCancel(): void {
    // Navigate back to profile page
    window.history.back();
  }
}
