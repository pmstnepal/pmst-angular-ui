import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'pmst-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="sticky top-0 z-50 bg-white shadow-sm">
      <div class="container mx-auto px-4">
        <nav class="flex items-center justify-between h-16">
          <!-- Logo -->
          <a routerLink="/" class="flex items-center space-x-2">
            <span class="text-2xl font-bold text-indigo-600">PMST</span>
            <span class="hidden sm:block text-sm text-gray-600">US-Nepal</span>
          </a>

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center space-x-1">
            <a routerLink="/" routerLinkActive="text-indigo-600 bg-indigo-50" [routerLinkActiveOptions]="{exact: true}" class="px-3 py-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-50 transition-colors font-medium">Home</a>
            
            <!-- SPOTLIGHT with dropdown -->
            <div class="relative group">
              <button class="px-3 py-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-50 transition-colors font-medium flex items-center">
                Spotlight
                <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              <div class="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <a routerLink="/spotlight" class="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 first:rounded-t-lg">Entertainments</a>
                <a routerLink="/news" class="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 last:rounded-b-lg">News</a>
              </div>
            </div>
            
            <a routerLink="/news" routerLinkActive="text-indigo-600 bg-indigo-50" class="px-3 py-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-50 transition-colors font-medium">News</a>
            <a routerLink="/showcase" routerLinkActive="text-indigo-600 bg-indigo-50" class="px-3 py-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-50 transition-colors font-medium">Showcase</a>
          </div>

          <!-- Auth Buttons -->
          <div class="hidden md:flex items-center space-x-3">
            <a routerLink="/login" class="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md transition-colors">Sign In</a>
            <a routerLink="/register" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">Join Now</a>
          </div>

          <!-- Mobile Menu Button -->
          <button 
            (click)="toggleMobileMenu()"
            class="md:hidden p-2 text-gray-700 hover:text-indigo-600"
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
          <div class="md:hidden py-4 border-t border-gray-200">
            <div class="flex flex-col space-y-2">
              <a routerLink="/" (click)="closeMobileMenu()" class="px-3 py-2 text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md font-medium">Home</a>
              <div class="px-3 py-2">
                <span class="font-medium text-gray-700">Spotlight</span>
                <div class="ml-4 mt-1 space-y-1">
                  <a routerLink="/spotlight" (click)="closeMobileMenu()" class="block py-1 text-gray-600 hover:text-indigo-600">Entertainments</a>
                  <a routerLink="/news" (click)="closeMobileMenu()" class="block py-1 text-gray-600 hover:text-indigo-600">News</a>
                </div>
              </div>
              <a routerLink="/news" (click)="closeMobileMenu()" class="px-3 py-2 text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md font-medium">News</a>
              <a routerLink="/showcase" (click)="closeMobileMenu()" class="px-3 py-2 text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md font-medium">Showcase</a>
              <hr class="my-2">
              <a routerLink="/login" (click)="closeMobileMenu()" class="px-3 py-2 text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md">Sign In</a>
              <a routerLink="/register" (click)="closeMobileMenu()" class="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Join Now</a>
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
