import { Component, signal, computed, ChangeDetectionStrategy, inject, ElementRef, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { QuillModule } from 'ngx-quill';
import { GalleryService, CreateGalleryPayload } from '../../core/services/gallery.service';
import { AuthService } from '../../core/services/auth.service';

interface GalleryImageUpload {
  id: string;
  file: File;
  preview: string;
  caption: string;
}

@Component({
  selector: 'pmst-submit-gallery',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, QuillModule, DatePipe],
  template: `
    <!-- ── Banners (outside container) ── -->
    @if (successMessage()) {
      <div class="banner banner-success">✓ {{ successMessage() }}</div>
    }
    @if (errorMessage()) {
      <div class="banner banner-error">{{ errorMessage() }}</div>
    }

    <!-- ══════════════════════════════════════════════════════════
         MAIN GALLERY EDITOR CONTAINER
    ═══════════════════════════════════════════════════════════ -->
    <div class="pmst-post-container editor-shell">

      <!-- ══ ROW 1: Top nav bar ══ -->
      <div class="editor-topbar">
        <a routerLink="/dashboard" class="topbar-back">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:14px;height:14px">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Dashboard
        </a>
        <span class="topbar-sep">›</span>
        <span class="topbar-crumb">{{ editId() ? 'Edit Gallery' : 'New Gallery' }}</span>
        <div class="topbar-actions">
          <button type="button" (click)="saveDraft()" [disabled]="isSubmitting()" class="pmst-btn-primary">
            Save Draft
          </button>
          <button type="button" (click)="onSubmit()" [disabled]="isSubmitting()" class="pmst-btn-primary">
            @if (isSubmitting()) {
              <svg class="animate-spin" fill="none" viewBox="0 0 24 24" style="width:14px;height:14px">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isAdmin() ? 'Publishing...' : 'Submitting...' }}
            } @else {
              {{ isAdmin() ? 'Publish' : 'Submit for Review' }}
            }
          </button>
        </div>
      </div>

      <!-- ══ ROW 2: Title input ══ -->
      <div class="title-row">
        <input
          type="text"
          [(ngModel)]="formData.title"
          name="title"
          (ngModelChange)="onTitleChange($event)"
          class="title-input"
          placeholder="Gallery Title..."
        >
      </div>

      <!-- ══ ROW 3: Hero 2-column grid ══ -->
      <div class="hero-grid">

        <!-- LEFT: Featured Image (required) -->
        <div class="hero-left">
          <div class="hero-panel-label">Featured Image <span class="required-star">*</span></div>
          <div class="hero-image-zone"
               [class.hero-image-zone--error]="submitAttempted() && !featuredImagePreview()"
               [class.hero-image-zone--filled]="!!featuredImagePreview()"
               (click)="featuredImgInput.click()">
            @if (featuredImagePreview()) {
              <div class="pmst-featured-blur" [style.background-image]="'url(' + featuredImagePreview() + ')'"></div>
              <div class="pmst-featured-center">
                <img [src]="featuredImagePreview()" alt="Featured image preview">
              </div>
              <button type="button" class="hero-swap-btn" (click)="$event.stopPropagation(); featuredImgInput.click()">✏️ Swap</button>
              <button type="button" class="hero-clear-btn" (click)="$event.stopPropagation(); clearFeaturedImage()">✕</button>
            } @else {
              <div class="hero-upload-prompt">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:40px;height:40px">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <p class="upload-prompt-title">Click to upload featured image</p>
                <p class="upload-prompt-sub">JPG, PNG, WebP — max 5 MB</p>
              </div>
            }
            @if (submitAttempted() && !featuredImagePreview()) {
              <div class="hero-error-badge">⚠ Required</div>
            }
          </div>
          <input #featuredImgInput type="file" accept="image/*" class="sr-only"
            (change)="onFeaturedImageChange($event)">
        </div>

        <!-- RIGHT: Gallery info panel -->
        <div class="hero-right">

          <!-- Gallery Info (Quill editor) -->
          <div class="sidebar-block">
            <label class="field-label">Gallery Info <span class="required-star">*</span></label>
            <quill-editor
              [(ngModel)]="formData.description"
              name="gallery_description"
              [modules]="quillModules"
              [styles]="{minHeight: '200px'}"
              placeholder="Describe your gallery, the model, event, or shoot..."
              class="pmst-content-editor"
            ></quill-editor>
            @if (submitAttempted() && isContentEmpty(formData.description)) {
              <p class="field-error">Gallery info is required.</p>
            }
          </div>

          <!-- SEO collapsible -->
          <div class="sidebar-block">
            <button type="button" class="seo-toggle-btn" (click)="seoOpen.set(!seoOpen())">
              🔍 SEO Settings <span>{{ seoOpen() ? '▲' : '▼' }}</span>
            </button>
            @if (seoOpen()) {
              <div class="seo-body">
                <label class="field-label">Focus Keyword</label>
                <input type="text" [(ngModel)]="formData.seoFocusKeyword" name="seo_kw"
                  class="field-input" placeholder="e.g. Nepali model photoshoot">
                <label class="field-label" style="margin-top:8px">Meta Description</label>
                <input type="text" [(ngModel)]="formData.seoDescription" name="seo_desc"
                  (ngModelChange)="updateSeoPreview()" maxlength="160"
                  class="field-input" placeholder="160 chars max">
                <div class="seo-preview">
                  <p class="seo-preview-url">pmstusnepal.com › showcase › {{ generatedSlug() || 'your-slug' }}</p>
                  <p class="seo-preview-title">{{ seoPreviewTitle() }}</p>
                  <p class="seo-preview-desc">{{ seoPreviewDesc() }}</p>
                </div>
              </div>
            }
          </div>

        </div>
        <!-- end hero-right -->
      </div>
      <!-- end hero-grid -->

      <!-- Title live preview -->
      @if (formData.title) {
        <h1 class="pmst-title">{{ formData.title | uppercase }}</h1>
      } @else {
        <h1 class="pmst-title pmst-title--placeholder">Gallery Title</h1>
      }
      @if (generatedSlug()) {
        <div class="slug-badge">🔗 /showcase/{{ generatedSlug() }}</div>
      }
      <div class="pmst-meta">By PMST US-Nepal &nbsp;|&nbsp; {{ today | date:'mediumDate' }}</div>

      <!-- ══ Gallery Images Section ══ -->
      <div class="gallery-section">
        <div class="section-label">
          Gallery Images 
          <span class="section-label-sub">({{ galleryImages().length }} uploaded, min 6 - max 35)</span>
        </div>
        @if (submitAttempted() && galleryImages().length < 6) {
          <p class="field-error">Minimum 6 images required. Currently: {{ galleryImages().length }}</p>
        }
        
        <!-- Upload zone -->
        <div class="gallery-upload-zone"
             (click)="galleryFileInput.click()"
             (dragover)="onDragOver($event)"
             (drop)="onDrop($event)">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:32px;height:32px">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
          <p class="upload-prompt-title">Click or drag & drop to upload images</p>
          <p class="upload-prompt-sub">Min 6 - max 35 photos. Add focus keyword as alt text for better SEO.</p>
          <input #galleryFileInput type="file" accept="image/*" multiple class="sr-only"
            (change)="onGalleryFilesSelected($event)">
        </div>

        <!-- Images grid preview -->
        @if (galleryImages().length > 0) {
          <div class="gallery-images-grid">
            @for (image of galleryImages(); track image.id; let i = $index) {
              <div class="gallery-image-item">
                <img [src]="image.preview" alt="Gallery image {{ i + 1 }}">
                <button type="button" class="gallery-image-remove" (click)="removeGalleryImage(i)">✕</button>
                <input 
                  type="text" 
                  [(ngModel)]="image.caption"
                  [name]="'caption-' + i"
                  placeholder="Alt text / caption"
                  class="gallery-image-caption"
                >
              </div>
            }
          </div>
        }
      </div>

    </div>
    <!-- end pmst-post-container -->
  `,
  styles: [`
    /* ── Banners ── */
    .banner { padding: 12px 24px; font-size: 14px; }
    .banner-success { background: #d1fae5; color: #065f46; border-bottom: 1px solid #6ee7b7; }
    .banner-error   { background: #fee2e2; color: #991b1b; border-bottom: 1px solid #fca5a5; }

    /* ── Post shell ── */
    .pmst-post-container { background: #fff; color: #4a4a6a; padding: 32px 40px 48px; max-width: 1200px; margin: 24px auto; border-radius: 10px; }
    .editor-shell { }

    /* ── Top bar inside container ── */
    .editor-topbar {
      display: flex; align-items: center; gap: 8px;
      padding: 0 0 14px; border-bottom: 1px solid #ff6b6b; margin-bottom: 20px;
      font-size: 13px; color: #6b7280;
    }
    .topbar-back { display: flex; align-items: center; gap: 4px; color: #6b7280; text-decoration: none; }
    .topbar-back:hover { color: #4a4a6a; }
    .topbar-sep { color: #d1d5db; }
    .topbar-crumb { color: #4a4a6a; font-weight: 600; flex: 1; }
    .topbar-actions { display: flex; gap: 8px; margin-left: auto; }

    /* ── Title input row ── */
    .title-row { margin-bottom: 20px; }
    .title-input {
      width: 100%; box-sizing: border-box;
      font-size: 22px; font-weight: 700; color: #1a1a2e;
      border: none; border-bottom: 2px dashed #e5e7eb;
      padding: 8px 0; outline: none; background: transparent;
      transition: border-color 0.2s;
    }
    .title-input::placeholder { color: #d1d5db; font-style: italic; }
    .title-input:hover { border-bottom-color: #ff6b6b; }
    .title-input:focus { border-bottom-color: #ff6b6b; }

    /* ── Hero grid ── */
    .hero-grid { display: grid; grid-template-columns: 1fr 340px; gap: 24px; margin-bottom: 32px; align-items: start; }
    @media (max-width: 900px) { .hero-grid { grid-template-columns: 1fr; } }
    .hero-left { display: flex; flex-direction: column; gap: 6px; }
    .hero-right { display: flex; flex-direction: column; gap: 0; }
    .hero-panel-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 4px; }
    .required-star { color: #ef4444; }

    /* ── Sidebar blocks ── */
    .sidebar-block { padding: 12px 14px; border: 1px solid #f0f0f5; border-radius: 8px; margin-bottom: 10px; background: #fafafa; }
    .field-label { display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; margin-bottom: 4px; }
    .field-input { width: 100%; box-sizing: border-box; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 10px; font-size: 13px; color: #374151; }
    .field-error { font-size: 12px; color: #ef4444; margin-top: 4px; }

    /* ── Featured image zone ── */
    .hero-image-zone {
      position: relative; height: 260px; border-radius: 10px; overflow: hidden;
      cursor: pointer; border: 2px dashed #d1d5db; transition: border-color 0.2s, box-shadow 0.2s;
    }
    .hero-image-zone:hover { border-color: #ff6b6b; }
    .hero-image-zone--error { border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.15); animation: shake 0.3s ease; }
    .hero-image-zone--filled { border: none; }
    @keyframes shake { 0%,100%{ transform: translateX(0); } 25%{ transform: translateX(-4px); } 75%{ transform: translateX(4px); } }
    .pmst-featured-blur { position: absolute; inset: 0; background-size: cover; background-position: center; filter: blur(20px); transform: scale(1.1); }
    .pmst-featured-center { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; z-index: 2; }
    .pmst-featured-center img { max-height: 95%; max-width: 95%; object-fit: contain; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
    .hero-upload-prompt { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #9ca3af; }
    .upload-prompt-title { font-size: 14px; font-weight: 500; color: #6b7280; }
    .upload-prompt-sub { font-size: 12px; }
    .hero-swap-btn { position: absolute; bottom: 10px; right: 44px; z-index: 10; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 6px; padding: 4px 10px; font-size: 12px; cursor: pointer; }
    .hero-swap-btn:hover { background: rgba(0,0,0,0.85); }
    .hero-clear-btn { position: absolute; top: 8px; right: 8px; z-index: 10; background: #ef4444; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .hero-error-badge { position: absolute; bottom: 8px; left: 8px; background: #ef4444; color: white; font-size: 11px; padding: 3px 8px; border-radius: 4px; z-index: 10; }

    /* ── SEO inside sidebar ── */
    .seo-toggle-btn { width: 100%; display: flex; align-items: center; gap: 6px; background: transparent; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 10px; font-size: 12px; color: #6b7280; cursor: pointer; }
    .seo-toggle-btn:hover { background: #f3f4f6; color: #374151; }
    .seo-body { margin-top: 10px; display: flex; flex-direction: column; gap: 2px; }
    .seo-preview { background: #f8f8ff; border: 1px solid #e8e8f0; border-radius: 6px; padding: 8px 10px; margin-top: 10px; }
    .seo-preview-url { font-size: 11px; color: #1a73e8; margin: 0 0 2px; }
    .seo-preview-title { font-size: 13px; color: #1a0dab; margin: 0 0 2px; font-weight: 500; }
    .seo-preview-desc { font-size: 11px; color: #545454; margin: 0; }

    /* ── Live preview title / meta ── */
    .pmst-title { font-size: 32px; font-weight: bold; margin-bottom: 10px; color: #4a4a6a; text-transform: uppercase; }
    .pmst-title--placeholder { color: #d1d5db; font-style: italic; }
    .pmst-meta { color: #6b7280; margin-bottom: 20px; }
    .slug-badge { font-size: 12px; color: #6366f1; background: #eef2ff; display: inline-block; padding: 2px 10px; border-radius: 20px; margin-bottom: 10px; }

    /* ── Content editor (Quill) ── */
    .pmst-content-editor { display: block; width: 100%; }
    .pmst-content-editor :global(.ql-toolbar) { border-radius: 8px 8px 0 0 !important; border-color: #e5e7eb !important; }
    .pmst-content-editor :global(.ql-container) { border-radius: 0 0 8px 8px !important; border-color: #e5e7eb !important; font-size: 14px; line-height: 1.6; color: #4a4a6a; }

    /* ── Gallery section ── */
    .gallery-section { margin-top: 30px; }
    .section-label { font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.04em; }
    .section-label-sub { font-weight: 400; color: #9ca3af; text-transform: none; letter-spacing: 0; }

    /* ── Gallery upload zone ── */
    .gallery-upload-zone {
      border: 2px dashed #d1d5db; border-radius: 10px; padding: 24px;
      text-align: center; cursor: pointer; transition: border-color 0.2s;
      margin-bottom: 20px;
    }
    .gallery-upload-zone:hover { border-color: #ff6b6b; }

    /* ── Gallery images grid ── */
    .gallery-images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
    }
    .gallery-image-item {
      position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden;
    }
    .gallery-image-item img { width: 100%; height: 100%; object-fit: cover; }
    .gallery-image-remove {
      position: absolute; top: 4px; right: 4px;
      background: #ef4444; color: white; border: none; border-radius: 50%;
      width: 20px; height: 20px; font-size: 10px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .gallery-image-caption {
      position: absolute; bottom: 0; left: 0; right: 0;
      background: rgba(255,255,255,0.95); border: none;
      padding: 4px 8px; font-size: 11px;
    }

    /* ── Util ── */
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
    .animate-spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class SubmitGalleryComponent implements OnInit {
  private galleryService = inject(GalleryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  editId = signal<string | null>(null);
  isLoadingEdit = signal(false);

  readonly isAdmin = computed(() => this.authService.isAdmin());
  readonly today = new Date();

  formData = {
    title: '',
    description: '',
    seoFocusKeyword: '',
    seoDescription: '',
  };

  featuredImageFile: File | null = null;
  featuredImagePreview = signal<string>('');
  galleryImages = signal<GalleryImageUpload[]>([]);

  isSubmitting = signal(false);
  submitAttempted = signal(false);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');
  generatedSlug = signal<string>('');
  seoOpen = signal(false);

  private _seoPreviewTitle = signal('Gallery Title - GALLERY | PMST US-Nepal');
  private _seoPreviewDesc = signal('Example description here...');
  readonly seoPreviewTitle = computed(() => this._seoPreviewTitle());
  readonly seoPreviewDesc = computed(() => this._seoPreviewDesc());

  readonly quillModules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote'],
      ['clean']
    ]
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId.set(id);
      this.isLoadingEdit.set(true);
      this.galleryService.getGalleryById(id).subscribe({
        next: (gallery) => {
          this.formData.title = gallery.title;
          this.formData.description = gallery.description || '';
          this.formData.seoFocusKeyword = gallery.seoFocusKeyword || '';
          this.formData.seoDescription = gallery.seoDescription || '';
          if (gallery.featuredImage) this.featuredImagePreview.set(gallery.featuredImage);
          if (gallery.images && gallery.images.length > 0) {
            const imgs: GalleryImageUpload[] = gallery.images.map(img => ({
              id: img.id,
              file: null as any,
              preview: img.imageUrl,
              caption: img.caption || ''
            }));
            this.galleryImages.set(imgs);
          }
          this.generatedSlug.set(gallery.slug || '');
          this.updateSeoPreview();
          this.isLoadingEdit.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoadingEdit.set(false);
          this.errorMessage.set('Failed to load gallery for editing.');
          this.cdr.markForCheck();
        }
      });
    }
  }

  onTitleChange(value: string): void {
    this.generatedSlug.set(this.toSlug(value));
    this.updateSeoPreview();
    this.cdr.markForCheck();
  }

  updateSeoPreview(): void {
    const title = this.formData.title || 'Gallery Title';
    this._seoPreviewTitle.set(`${title} - GALLERY | PMST US-Nepal`);
    this._seoPreviewDesc.set(this.formData.seoDescription || 'Example description here...');
  }

  onFeaturedImageChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.featuredImageFile = file;
    const reader = new FileReader();
    reader.onload = e => {
      this.featuredImagePreview.set(e.target?.result as string);
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  clearFeaturedImage(): void {
    this.featuredImageFile = null;
    this.featuredImagePreview.set('');
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

  onGalleryFilesSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      this.handleFiles(Array.from(files));
    }
  }

  handleFiles(files: File[]): void {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    // Check max limit
    if (this.galleryImages().length + imageFiles.length > 35) {
      this.errorMessage.set('Maximum 35 images allowed. Please remove some images first.');
      return;
    }

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: GalleryImageUpload = {
          id: Math.random().toString(36).substring(2, 9),
          file: file,
          preview: e.target?.result as string,
          caption: ''
        };
        this.galleryImages.update(images => [...images, newImage]);
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    });
  }

  removeGalleryImage(index: number): void {
    this.galleryImages.update(images => images.filter((_, i) => i !== index));
  }

  isContentEmpty(content: string): boolean {
    return !content || content === '<p><br></p>' || content.trim() === '';
  }

  private toSlug(str: string): string {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }

  private buildPayload(status: 'draft' | 'pending' | 'published'): CreateGalleryPayload {
    return {
      title: this.formData.title,
      slug: this.generatedSlug() || this.toSlug(this.formData.title),
      description: this.isContentEmpty(this.formData.description) ? '' : this.formData.description,
      featuredImage: this.featuredImagePreview() || undefined,
      images: this.galleryImages().map(img => img.preview),
      seoFocusKeyword: this.formData.seoFocusKeyword || undefined,
      seoDescription: this.formData.seoDescription || undefined,
      status,
    };
  }

  onSubmit(): void {
    this.submitAttempted.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    // Validation
    if (!this.featuredImagePreview()) {
      this.errorMessage.set('Featured image is required.');
      return;
    }
    if (this.isContentEmpty(this.formData.description)) {
      this.errorMessage.set('Gallery info is required.');
      return;
    }
    if (this.galleryImages().length < 6) {
      this.errorMessage.set(`Minimum 6 images required. Currently: ${this.galleryImages().length}`);
      return;
    }

    this.isSubmitting.set(true);
    const submitStatus = this.authService.isAdmin() ? 'published' : 'pending';
    const id = this.editId();
    const call$ = id
      ? this.galleryService.updateGallery(id, this.buildPayload(submitStatus))
      : this.galleryService.createGallery(this.buildPayload(submitStatus));
    call$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set(
          id
            ? 'Gallery updated successfully!'
            : (this.authService.isAdmin()
              ? 'Gallery published successfully!'
              : 'Gallery submitted for review! You will be notified once it is approved.')
        );
        setTimeout(() => this.router.navigate(['/dashboard']), 3000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.error?.message || 'Submission failed. Please try again.');
      }
    });
  }

  saveDraft(): void {
    this.successMessage.set('');
    this.errorMessage.set('');
    this.isSubmitting.set(true);
    const id = this.editId();
    const call$ = id
      ? this.galleryService.updateGallery(id, this.buildPayload('draft'))
      : this.galleryService.createGallery(this.buildPayload('draft'));
    call$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('Draft saved successfully.');
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.error?.message || 'Failed to save draft. Please try again.');
      }
    });
  }
}
