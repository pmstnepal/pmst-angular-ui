import { Component, signal, computed, ChangeDetectionStrategy, inject, ElementRef, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { QuillModule } from 'ngx-quill';
import { ArticleService } from '../../core/services/article.service';
import { AuthService } from '../../core/services/auth.service';

const CATEGORIES = [
  { label: 'Entertainment', value: 'entertainment' },
  { label: 'Nepali News', value: 'nepali-news' },
  { label: 'Sports', value: 'sports' },
];

@Component({
  selector: 'pmst-submit-content',
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
         MAIN EDITOR CONTAINER
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
        <span class="topbar-crumb">{{ editId() ? 'Edit Article' : 'New Article' }}</span>
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
          placeholder="Article Title..."
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

        <!-- RIGHT: YouTube + meta fields stacked -->
        <div class="hero-right">

          <!-- YouTube -->
          <div class="sidebar-block">
            <div class="hero-panel-label">YouTube Link <span class="optional-tag">Optional</span></div>
            <div class="yt-input-row">
              <svg class="yt-icon" viewBox="0 0 24 24" fill="#FF0000">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <input type="url" [(ngModel)]="formData.youtubeLink" name="youtube_link"
                (ngModelChange)="onYoutubeLinkChange($event)"
                placeholder="https://www.youtube.com/watch?v=..." class="yt-input">
              @if (formData.youtubeLink) {
                <button type="button" class="yt-clear" (click)="formData.youtubeLink=''; onYoutubeLinkChange('')">✕</button>
              }
            </div>
            @if (youtubeError()) { <p class="yt-error">{{ youtubeError() }}</p> }
            @if (safeYoutubeUrl()) {
              <p class="yt-hint yt-hint--active">✓ YouTube video will show in the post hero. Featured image is still used for thumbnails &amp; social sharing.</p>
            } @else {
              <p class="yt-hint">If added, YouTube replaces featured image in the post hero. Image is still used for SEO &amp; social sharing.</p>
            }
          </div>

          <!-- Category -->
          <div class="sidebar-block">
            <label class="field-label">Category <span class="required-star">*</span></label>
            <select [(ngModel)]="formData.category" name="category" (ngModelChange)="updateSeoPreview()" class="field-select">
              <option value="" disabled>Select category...</option>
              @for (cat of categories; track cat.value) {
                <option [value]="cat.value">{{ cat.label }}</option>
              }
            </select>
          </div>

          <!-- Excerpt -->
          <div class="sidebar-block">
            <label class="field-label">Excerpt</label>
            <textarea [(ngModel)]="formData.excerpt" name="excerpt" rows="2"
              maxlength="150" class="field-textarea"
              placeholder="Brief summary (150 chars max)"></textarea>
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
                  class="field-input" placeholder="e.g. Nepali entertainment news">
                <label class="field-label" style="margin-top:8px">Meta Description</label>
                <input type="text" [(ngModel)]="formData.seoDescription" name="seo_desc"
                  (ngModelChange)="updateSeoPreview()" maxlength="160"
                  class="field-input" placeholder="160 chars max">
                <div class="seo-preview">
                  <p class="seo-preview-url">pmstusnepal.com › news › {{ generatedSlug() || 'your-slug' }}</p>
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
        <h1 class="pmst-title">{{ formData.title }}</h1>
      } @else {
        <h1 class="pmst-title pmst-title--placeholder">Your Title Here</h1>
      }
      @if (generatedSlug()) {
        <div class="slug-badge">🔗 /news/{{ generatedSlug() }}</div>
      }
      <div class="pmst-meta">By PMST US-Nepal &nbsp;|&nbsp; {{ today | date:'mediumDate' }}</div>

      <!-- Post content (full width Quill) -->
      <div class="content-editor-wrap">
        <p class="editor-field-hint">Post Content <span class="required-star">*</span></p>
        <quill-editor
          [(ngModel)]="formData.content"
          name="post_content"
          [modules]="quillModules"
          [styles]="{minHeight: '300px'}"
          placeholder="Write your article here..."
          class="pmst-content-editor"
        ></quill-editor>
        @if (submitAttempted() && isContentEmpty(formData.content)) {
          <p class="field-error">Content is required.</p>
        }
      </div>

      <!-- Social Embed -->
      <div class="embed-section">
        <button type="button" class="embed-toggle" (click)="embedOpen.set(!embedOpen())">
          📱 Social Media Embed
          <span class="embed-toggle-arrow">{{ embedOpen() ? '▲' : '▼' }}</span>
        </button>
        @if (embedOpen()) {
          <div class="embed-body">
            <p class="embed-hint">Paste an Instagram, TikTok, or Twitter embed code below.</p>
            <textarea [(ngModel)]="formData.embedCode" name="embed_code" rows="4"
              class="embed-textarea"
              placeholder="<blockquote class=&quot;instagram-media&quot; ..."></textarea>
          </div>
        }
      </div>

      <!-- ══ Gallery (below social embed) ══ -->
      <div class="gallery-section">
        <div class="section-label">Gallery Images <span class="section-label-sub">(up to 6)</span></div>
        <div class="gallery-thumb-grid">
          @for (preview of galleryPreviews(); track $index) {
            <div class="gallery-thumb-item">
              @if (preview) {
                <img [src]="preview" alt="Gallery {{ $index + 1 }}" class="gallery-thumb-img">
                <button type="button" class="gallery-thumb-remove" (click)="removeGalleryImage($index)">✕</button>
              } @else if ($index < 6) {
                <button type="button" class="gallery-thumb-add" (click)="triggerGalleryInput($index)">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:18px;height:18px">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                </button>
              }
              <input type="file" accept="image/*" class="sr-only"
                [attr.data-index]="$index"
                (change)="onGalleryImageChange($event, $index)">
            </div>
          }
        </div>
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
    .optional-tag { font-size: 10px; font-weight: 400; background: #f3f4f6; color: #9ca3af; padding: 1px 6px; border-radius: 4px; margin-left: 4px; }

    /* ── Sidebar blocks ── */
    .sidebar-block { padding: 12px 14px; border: 1px solid #f0f0f5; border-radius: 8px; margin-bottom: 10px; background: #fafafa; }
    .field-label { display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; margin-bottom: 4px; }
    .field-select { width: 100%; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 10px; font-size: 13px; color: #374151; background: #fff; }
    .field-textarea { width: 100%; box-sizing: border-box; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 10px; font-size: 13px; color: #374151; resize: vertical; }
    .field-input { width: 100%; box-sizing: border-box; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 10px; font-size: 13px; color: #374151; }

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

    /* ── YouTube input ── */
    .yt-input-row { display: flex; align-items: center; gap: 8px; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 10px; background: #fff; }
    .yt-icon { width: 18px; height: 18px; flex-shrink: 0; }
    .yt-input { flex: 1; border: none; background: transparent; font-size: 13px; outline: none; color: #374151; min-width: 0; }
    .yt-clear { background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 13px; }
    .yt-clear:hover { color: #ef4444; }
    .yt-error { font-size: 11px; color: #ef4444; margin: 4px 0 0; }
    .yt-hint { font-size: 11px; color: #9ca3af; line-height: 1.4; margin: 6px 0 0; }
    .yt-hint--active { color: #059669; font-weight: 500; }

    /* ── SEO inside sidebar ── */
    .seo-toggle-btn { width: 100%; display: flex; align-items: center; gap: 6px; background: transparent; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 10px; font-size: 12px; color: #6b7280; cursor: pointer; }
    .seo-toggle-btn:hover { background: #f3f4f6; color: #374151; }
    .seo-body { margin-top: 10px; display: flex; flex-direction: column; gap: 2px; }
    .seo-preview { background: #f8f8ff; border: 1px solid #e8e8f0; border-radius: 6px; padding: 8px 10px; margin-top: 10px; }
    .seo-preview-url { font-size: 11px; color: #1a73e8; margin: 0 0 2px; }
    .seo-preview-title { font-size: 13px; color: #1a0dab; margin: 0 0 2px; font-weight: 500; }
    .seo-preview-desc { font-size: 11px; color: #545454; margin: 0; }

    /* ── Gallery section (below embed) ── */
    .gallery-section { margin-top: 24px; }
    .section-label { font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.04em; }
    .section-label-sub { font-weight: 400; color: #9ca3af; text-transform: none; letter-spacing: 0; }
    .gallery-thumb-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .gallery-thumb-item { position: relative; width: 72px; height: 72px; border-radius: 8px; overflow: hidden; }
    .gallery-thumb-img { width: 100%; height: 100%; object-fit: cover; }
    .gallery-thumb-remove { position: absolute; top: 3px; right: 3px; background: rgba(239,68,68,0.9); color: white; border: none; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; }
    .gallery-thumb-add { width: 72px; height: 72px; background: #f9fafb; border: 1.5px dashed #d1d5db; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #9ca3af; }
    .gallery-thumb-add:hover { background: #f3f4f6; border-color: #9ca3af; color: #6b7280; }

    /* ── Preview divider ── */
    .preview-divider { text-align: center; font-size: 11px; color: #9ca3af; letter-spacing: 0.1em; text-transform: uppercase; border-top: 1px dashed #e5e7eb; padding-top: 12px; margin-bottom: 20px; }

    /* ── Live preview title / meta ── */
    .pmst-title { font-size: 32px; font-weight: bold; margin-bottom: 10px; color: #4a4a6a; }
    .pmst-title--placeholder { color: #d1d5db; font-style: italic; }
    .pmst-meta { color: #6b7280; margin-bottom: 20px; }
    .slug-badge { font-size: 12px; color: #6366f1; background: #eef2ff; display: inline-block; padding: 2px 10px; border-radius: 20px; margin-bottom: 10px; }

    /* ── Content editor ── */
    .content-editor-wrap { margin-bottom: 30px; width: 100%; }
    .editor-field-hint { font-size: 12px; color: #9ca3af; margin-bottom: 6px; }
    quill-editor { display: block; width: 100%; }
    .pmst-content-editor { display: block; width: 100%; }
    .pmst-content-editor :global(.ql-toolbar) { border-radius: 8px 8px 0 0 !important; border-color: #e5e7eb !important; }
    .pmst-content-editor :global(.ql-container) { border-radius: 0 0 8px 8px !important; border-color: #e5e7eb !important; font-size: 16px; line-height: 1.8; color: #4a4a6a; }
    .field-error { font-size: 12px; color: #ef4444; margin-top: 4px; }

    /* ── Embed section ── */
    .embed-section { margin: 30px 0; }
    .embed-toggle { display: flex; align-items: center; gap: 8px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 16px; font-size: 14px; color: #374151; cursor: pointer; width: 100%; }
    .embed-toggle:hover { background: #e5e7eb; }
    .embed-toggle-arrow { margin-left: auto; }
    .embed-body { margin-top: 8px; padding: 16px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; }
    .embed-hint { font-size: 12px; color: #9ca3af; margin-bottom: 8px; }
    .embed-textarea { width: 100%; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 6px; font-family: monospace; font-size: 13px; resize: vertical; box-sizing: border-box; }




    /* ── Util ── */
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
    .animate-spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class SubmitContentComponent implements OnInit {
  private articleService = inject(ArticleService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);
  private elRef = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);

  editId = signal<string | null>(null);
  isLoadingEdit = signal(false);

  readonly isAdmin = computed(() => this.authService.isAdmin());
  readonly categories = CATEGORIES;
  readonly today = new Date();

  formData = {
    title: '',
    excerpt: '',
    content: '',
    category: '',
    youtubeLink: '',
    embedCode: '',
    seoFocusKeyword: '',
    seoDescription: '',
  };

  featuredImagePreview = signal<string>('');
  featuredImageFile: File | null = null;

  galleryFiles: (File | null)[] = [null];
  galleryPreviews = signal<string[]>(['']);

  isSubmitting = signal(false);
  submitAttempted = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  generatedSlug = signal('');
  seoOpen = signal(false);
  embedOpen = signal(false);
  youtubeError = signal('');

  private _safeYoutubeUrl = signal<SafeResourceUrl | null>(null);
  readonly safeYoutubeUrl = computed(() => this._safeYoutubeUrl());

  private _seoPreviewTitle = signal('Post Title - SPOTLIGHT | PMST US-Nepal');
  private _seoPreviewDesc = signal('Example description here...');
  readonly seoPreviewTitle = computed(() => this._seoPreviewTitle());
  readonly seoPreviewDesc = computed(() => this._seoPreviewDesc());
  readonly galleryGridClass = computed(() => 'pmst-gallery-grid pmst-gallery-count-' + (this.galleryPreviews().filter(p => !!p).length || 1));

  readonly quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'link'],
      ['clean']
    ]
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId.set(id);
      this.isLoadingEdit.set(true);
      this.articleService.getArticleById(id).subscribe({
        next: (article) => {
          this.formData.title = article.title;
          this.formData.excerpt = article.excerpt;
          this.formData.content = article.content || '';
          this.formData.category = article.category;
          this.formData.youtubeLink = article.youtubeLink || '';
          this.formData.embedCode = article.embedCode || '';
          this.formData.seoFocusKeyword = article.seoFocusKeyword || '';
          this.formData.seoDescription = article.seoDescription || '';
          if (article.featuredImage) this.featuredImagePreview.set(article.featuredImage);
          const imgs = article.galleryImages;
          if (imgs) {
            const arr: string[] = Array.isArray(imgs) ? imgs as string[] : JSON.parse(imgs as string);
            this.galleryPreviews.set([...arr, '']);
            this.galleryFiles = arr.map(() => null as File | null).concat([null]);
          }
          this.generatedSlug.set(article.slug || '');
          this.updateSeoPreview();
          this.isLoadingEdit.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoadingEdit.set(false);
          this.errorMessage.set('Failed to load article for editing.');
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

  onYoutubeLinkChange(url: string): void {
    this.youtubeError.set('');
    if (!url) { this._safeYoutubeUrl.set(null); return; }
    const embedUrl = this.toYoutubeEmbed(url);
    if (embedUrl) {
      this._safeYoutubeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl));
    } else {
      this._safeYoutubeUrl.set(null);
      if (url.length > 10) this.youtubeError.set('Please enter a valid YouTube URL.');
    }
  }

  updateSeoPreview(): void {
    const title = this.formData.title || 'Post Title';
    const cat = this.categories.find(c => c.value === this.formData.category)?.label || 'SPOTLIGHT';
    this._seoPreviewTitle.set(`${title} - ${cat.toUpperCase()} | PMST US-Nepal`);
    this._seoPreviewDesc.set(this.formData.seoDescription || 'Example description here...');
  }

  triggerGalleryInput(index: number): void {
    const input = this.elRef.nativeElement.querySelector(`input[data-index="${index}"]`) as HTMLInputElement;
    input?.click();
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

  onGalleryImageChange(event: Event, index: number): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const files = [...this.galleryFiles];
    files[index] = file;
    this.galleryFiles = files;
    const reader = new FileReader();
    reader.onload = e => {
      const previews = [...this.galleryPreviews()];
      previews[index] = e.target?.result as string;
      if (previews.filter(Boolean).length < 6 && index === previews.length - 1) {
        previews.push('');
        this.galleryFiles = [...this.galleryFiles, null];
      }
      this.galleryPreviews.set(previews);
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  removeGalleryImage(index: number): void {
    const previews = [...this.galleryPreviews()];
    const files = [...this.galleryFiles];
    previews.splice(index, 1);
    files.splice(index, 1);
    if (previews.length === 0 || previews[previews.length - 1] !== '') {
      previews.push('');
      files.push(null);
    }
    this.galleryFiles = files;
    this.galleryPreviews.set(previews);
  }

  isContentEmpty(content: string): boolean {
    return !content || content === '<p><br></p>' || content.trim() === '';
  }

  private toSlug(str: string): string {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }

  private toYoutubeEmbed(url: string): string {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : '';
  }

  private buildPayload(status: 'draft' | 'pending' | 'published') {
    return {
      title: this.formData.title,
      slug: this.generatedSlug() || this.toSlug(this.formData.title),
      excerpt: this.formData.excerpt,
      content: this.isContentEmpty(this.formData.content) ? '' : this.formData.content,
      category: this.formData.category,
      youtubeLink: this.formData.youtubeLink || undefined,
      embedCode: this.formData.embedCode || undefined,
      featuredImage: this.featuredImagePreview() || undefined,
      galleryImages: this.galleryPreviews().filter(Boolean).length
        ? JSON.stringify(this.galleryPreviews().filter(Boolean))
        : undefined,
      seoFocusKeyword: this.formData.seoFocusKeyword || undefined,
      seoDescription: this.formData.seoDescription || undefined,
      status,
    };
  }

  onSubmit(): void {
    this.submitAttempted.set(true);
    if (!this.featuredImagePreview()) {
      this.errorMessage.set('Featured image is required.');
      return;
    }
    if (this.isContentEmpty(this.formData.content)) {
      this.errorMessage.set('Post content is required.');
      return;
    }
    this.errorMessage.set('');
    this.isSubmitting.set(true);
    const submitStatus = this.authService.isAdmin() ? 'published' : 'pending';
    const id = this.editId();
    const call$ = id
      ? this.articleService.updateArticle(id, this.buildPayload(submitStatus))
      : this.articleService.createArticle(this.buildPayload(submitStatus));
    call$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set(
          id
            ? 'Article updated successfully!'
            : (this.authService.isAdmin()
              ? 'Article published successfully!'
              : 'Article submitted for review! You will be notified once it is approved.')
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
    this.errorMessage.set('');
    this.isSubmitting.set(true);
    const id = this.editId();
    const call$ = id
      ? this.articleService.updateArticle(id, this.buildPayload('draft'))
      : this.articleService.createArticle(this.buildPayload('draft'));
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
