import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'pmst-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="sticky top-0 z-50 shadow-lg" style="background:#1a1a2e;">
      <div class="container mx-auto px-4">
        <nav class="flex items-center justify-between h-16">
          <!-- Logo -->
          <a routerLink="/" class="flex items-center space-x-2">
            <span class="text-2xl font-extrabold text-white tracking-wide">PMST</span>
            <span class="text-sm font-semibold text-red-400 uppercase tracking-widest">US-Nepal</span>
          </a>

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center space-x-1">
            <a routerLink="/" routerLinkActive="text-red-400" [routerLinkActiveOptions]="{exact: true}"
               class="px-3 py-2 text-gray-200 hover:text-red-400 transition-colors font-medium uppercase text-sm tracking-wide">Home</a>

            <!-- Spotlight dropdown -->
            <div class="relative group">
              <button class="px-3 py-2 text-gray-200 hover:text-red-400 transition-colors font-medium uppercase text-sm tracking-wide flex items-center">
                Spotlight
                <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              <div class="absolute top-full left-0 mt-0 w-48 rounded-b-lg shadow-xl border-t-2 border-red-500 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50" style="background:#1a1a2e;">
                <a routerLink="/spotlight" class="block px-4 py-3 text-gray-300 hover:text-red-400 hover:bg-white/5 text-sm">Entertainments</a>
                <a routerLink="/news" class="block px-4 py-3 text-gray-300 hover:text-red-400 hover:bg-white/5 text-sm rounded-b-lg">News</a>
              </div>
            </div>

            <a routerLink="/news" routerLinkActive="text-red-400"
               class="px-3 py-2 text-gray-200 hover:text-red-400 transition-colors font-medium uppercase text-sm tracking-wide">News</a>
            <a routerLink="/showcase" routerLinkActive="text-red-400"
               class="px-3 py-2 text-gray-200 hover:text-red-400 transition-colors font-medium uppercase text-sm tracking-wide">Gallery</a>
            <a routerLink="/events" routerLinkActive="text-red-400"
               class="px-3 py-2 text-gray-200 hover:text-red-400 transition-colors font-medium uppercase text-sm tracking-wide">Events</a>
          </div>

          <!-- Auth Buttons -->
          <div class="hidden md:flex items-center space-x-3">
            <a routerLink="/login" class="text-gray-300 hover:text-red-400 px-3 py-2 transition-colors text-sm font-medium">Sign In</a>
            <a routerLink="/register" class="text-white px-5 py-2 rounded font-semibold text-sm uppercase tracking-wide transition-colors" style="background:#c0392b;" onmouseover="this.style.background='#a93226'" onmouseout="this.style.background='#c0392b'">Join Now</a>
          </div>

          <!-- Mobile Menu Button -->
          <button
            (click)="toggleMobileMenu()"
            class="md:hidden p-2 text-gray-300 hover:text-red-400"
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
              <a routerLink="/" (click)="closeMobileMenu()" class="px-3 py-2 text-gray-200 hover:text-red-400 rounded font-medium uppercase text-sm">Home</a>
              <a routerLink="/spotlight" (click)="closeMobileMenu()" class="px-3 py-2 text-gray-200 hover:text-red-400 rounded text-sm">Spotlight — Entertainments</a>
              <a routerLink="/news" (click)="closeMobileMenu()" class="px-3 py-2 text-gray-200 hover:text-red-400 rounded font-medium uppercase text-sm">News</a>
              <a routerLink="/showcase" (click)="closeMobileMenu()" class="px-3 py-2 text-gray-200 hover:text-red-400 rounded font-medium uppercase text-sm">Gallery</a>
              <a routerLink="/events" (click)="closeMobileMenu()" class="px-3 py-2 text-gray-200 hover:text-red-400 rounded font-medium uppercase text-sm">Events</a>
              <hr class="my-2 border-white/10">
              <a routerLink="/login" (click)="closeMobileMenu()" class="px-3 py-2 text-gray-300 hover:text-red-400 rounded text-sm">Sign In</a>
              <a routerLink="/register" (click)="closeMobileMenu()" class="px-3 py-2 text-white rounded font-semibold text-sm uppercase" style="background:#c0392b;">Join Now</a>
            </div>
          </div>
        }
      </div>
    </header>
  `,
  styles: [``]
})
export class HeaderComponent {
  isMobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(value => !value);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}
