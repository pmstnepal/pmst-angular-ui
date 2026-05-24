import { Component, signal, OnInit, inject, PLATFORM_ID, HostListener, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'pmst-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="pmst-header sticky top-0 z-50 shadow-lg"
            [class.pmst-header-scrolled]="isScrolled()"
            [class.pmst-header-normal]="!isScrolled()">
      <div class="container mx-auto px-4 h-full">
        <nav class="flex items-center justify-between h-full">
          <!-- Logo -->
          <a routerLink="/" class="flex items-center">
            <img src="/assets/images/logo/pmst-logo.png"
                 alt="PMST US-Nepal"
                 class="pmst-logo"
                 [class.pmst-logo-scrolled]="isScrolled()"
                 [class.pmst-logo-normal]="!isScrolled()">
          </a>

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center space-x-1">
            <a routerLink="/" routerLinkActive="pmst-nav-active" [routerLinkActiveOptions]="{exact: true}"
               class="pmst-nav-link" [class.pmst-nav-link-scrolled]="isScrolled()">Home</a>
            <a routerLink="/spotlight" routerLinkActive="pmst-nav-active"
               class="pmst-nav-link" [class.pmst-nav-link-scrolled]="isScrolled()">Spotlight</a>
            <a routerLink="/showcase" routerLinkActive="pmst-nav-active"
               class="pmst-nav-link" [class.pmst-nav-link-scrolled]="isScrolled()">Gallery</a>
            <a routerLink="/events" routerLinkActive="pmst-nav-active"
               class="pmst-nav-link" [class.pmst-nav-link-scrolled]="isScrolled()">Events</a>
          </div>

          <!-- Auth Buttons -->
          <div class="hidden md:flex items-center space-x-3">
            @if (!authenticated()) {
              <a routerLink="/login"
                 class="pmst-auth-link" [class.pmst-auth-link-scrolled]="isScrolled()">Sign In</a>
              <a routerLink="/register"
                 class="pmst-btn" [class.pmst-btn-scrolled]="isScrolled()">Join Now</a>
            } @else {
              <div class="flex items-center space-x-3">
                <a routerLink="/dashboard" class="pmst-user-link">
                  @if (currentUser()?.avatarUrl) {
                    <img [src]="currentUser()?.avatarUrl" [alt]="currentUser()?.displayName || currentUser()?.username" class="pmst-avatar">
                  } @else {
                    <div class="pmst-avatar-placeholder">
                      {{ (currentUser()?.displayName || currentUser()?.username || 'U').charAt(0).toUpperCase() }}
                    </div>
                  }
                  <span class="pmst-username" [class.pmst-username-scrolled]="isScrolled()">
                    {{ currentUser()?.displayName || currentUser()?.username }}
                  </span>
                </a>
                <button (click)="logout()" class="pmst-logout-btn">Logout</button>
              </div>
            }
          </div>

          <!-- Mobile Menu Button -->
          <button
            (click)="toggleMobileMenu()"
            class="md:hidden p-2 pmst-menu-btn"
            aria-label="Toggle menu"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              @if (isMobileMenuOpen()) {
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              } @else {
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              }
            </svg>
          </button>
        </nav>

        <!-- Mobile Menu -->
        @if (isMobileMenuOpen()) {
          <div class="md:hidden py-4 border-t border-white/10">
            <div class="flex flex-col space-y-1">
              <a routerLink="/" (click)="closeMobileMenu()" class="pmst-mobile-link pmst-mobile-nav-link">Home</a>
              <a routerLink="/spotlight" (click)="closeMobileMenu()" class="pmst-mobile-link pmst-mobile-nav-link">Spotlight</a>
              <a routerLink="/showcase" (click)="closeMobileMenu()" class="pmst-mobile-link pmst-mobile-nav-link">Gallery</a>
              <a routerLink="/events" (click)="closeMobileMenu()" class="pmst-mobile-link pmst-mobile-nav-link">Events</a>
              <hr class="my-2 border-white/10">
              @if (!authenticated()) {
                <a routerLink="/login" (click)="closeMobileMenu()" class="pmst-mobile-link">Sign In</a>
                <a routerLink="/register" (click)="closeMobileMenu()" class="pmst-mobile-link pmst-mobile-btn">Join Now</a>
              } @else {
                <a routerLink="/dashboard" (click)="closeMobileMenu()" class="pmst-mobile-link">
                  {{ currentUser()?.displayName || currentUser()?.username }}
                </a>
                <button (click)="logout(); closeMobileMenu()" class="pmst-mobile-link pmst-mobile-logout-btn">Logout</button>
              }
            </div>
          </div>
        }
      </div>
    </header>
  `,
  styles: [`
    .pmst-header {
      background: #1a1a2e;
      will-change: height;
      transition: height 0.25s ease;
    }
    .pmst-header-normal {
      height: 6.5rem;
    }
    .pmst-header-scrolled {
      height: 3.5rem;
    }
    .pmst-logo {
      width: auto;
      object-fit: contain;
      will-change: height;
      transition: height 0.25s ease;
    }
    .pmst-logo-normal {
      height: 5rem;
    }
    .pmst-logo-scrolled {
      height: 2rem;
    }
    .pmst-nav-link {
      color: #d1d5db;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      transition: color 0.2s, font-size 0.25s, padding 0.25s;
      padding: 0.75rem 0.875rem;
      font-size: 0.875rem;
    }
    .pmst-nav-link.pmst-nav-link-scrolled {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }
    .pmst-nav-link:hover, .pmst-nav-active {
      color: #fe5252;
    }
    .pmst-auth-link {
      color: #f3f4f6;
      font-weight: 500;
      transition: color 0.2s, font-size 0.25s, padding 0.25s;
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
    }
    .pmst-auth-link.pmst-auth-link-scrolled {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }
    .pmst-auth-link:hover { color: #ff6b6b; }
    .pmst-btn {
      color: white;
      border-radius: 0.375rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #fe5252;
      transition: background 0.2s, font-size 0.25s, padding 0.25s;
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
    }
    .pmst-btn.pmst-btn-scrolled {
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
    }
    .pmst-btn:hover { background: #ff6b6b; }
    .pmst-user-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border-radius: 0.5rem;
      transition: background 0.3s;
    }
    .pmst-user-link:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    .pmst-avatar {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      object-fit: cover;
    }
    .pmst-avatar-placeholder {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background: linear-gradient(to bottom right, #ef4444, #b91c1c);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
    }
    .pmst-username {
      color: #d1d5db;
      font-weight: 500;
      font-size: 0.875rem;
      transition: font-size 0.25s;
    }
    .pmst-username.pmst-username-scrolled {
      font-size: 0.75rem;
    }
    .pmst-logout-btn {
      color: #d1d5db;
      padding: 0.25rem 0.5rem;
      transition: color 0.3s;
      font-size: 0.875rem;
      font-weight: 500;
    }
    .pmst-logout-btn:hover {
      color: #fe5252;
    }
    .pmst-menu-btn {
      color: #d1d5db;
    }
    .pmst-menu-btn:hover {
      color: #fe5252;
    }
    .pmst-mobile-link {
      padding: 0.5rem 0.75rem;
      color: #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }
    .pmst-mobile-link:hover { color: #fe5252; }
    .pmst-mobile-nav-link { font-weight: 500; text-transform: uppercase; }
    .pmst-mobile-btn {
      color: white;
      font-weight: 600;
      text-transform: uppercase;
      background: #fe5252;
    }
    .pmst-mobile-logout-btn { text-align: left; }
  `]
})
export class HeaderComponent implements OnInit {
  isMobileMenuOpen = signal(false);
  isScrolled = signal(false);
  
  private platformId = inject(PLATFORM_ID);
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly authenticated = computed(() => this.authService.authenticated());
  readonly currentUser = computed(() => this.authService.user());

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Check initial scroll position
      this.isScrolled.set(window.scrollY > 150);
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      const scrollY = window.scrollY;
      const current = this.isScrolled();
      if (!current && scrollY > 80) {
        this.isScrolled.set(true);
      } else if (current && scrollY < 60) {
        this.isScrolled.set(false);
      }
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(value => !value);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
  }
}
