import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'pmst-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home-page">
      <!-- Hero Section -->
      <section class="hero bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-20 md:py-32">
        <div class="container mx-auto px-4 text-center">
          <h1 class="text-4xl md:text-6xl font-bold mb-6">PMST US-Nepal</h1>
          <p class="text-xl md:text-2xl mb-8 text-indigo-100">Premium Model Showcase and Talent Platform</p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a routerLink="/showcase" class="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Explore Showcase
            </a>
            <a routerLink="/register" class="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
              Join Community
            </a>
          </div>
        </div>
      </section>

      <!-- News Section -->
      <section class="py-16 bg-gray-50">
        <div class="container mx-auto px-4">
          <div class="flex justify-between items-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900">Latest News</h2>
            <a routerLink="/news" class="text-indigo-600 font-semibold hover:text-indigo-700">View All →</a>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            @for (i of [1, 2, 3]; track i) {
              <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div class="h-48 bg-gray-200"></div>
                <div class="p-4">
                  <span class="text-sm text-indigo-600 font-medium">News</span>
                  <h3 class="text-lg font-semibold mt-2 text-gray-900">Featured Article {{ i }}</h3>
                  <p class="text-gray-600 mt-2 text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Showcase Section -->
      <section class="py-16">
        <div class="container mx-auto px-4">
          <div class="flex justify-between items-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900">Featured Models</h2>
            <a routerLink="/showcase" class="text-indigo-600 font-semibold hover:text-indigo-700">View All →</a>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            @for (i of [1, 2, 3, 4]; track i) {
              <div class="relative group overflow-hidden rounded-lg aspect-[3/4]">
                <div class="w-full h-full bg-gradient-to-b from-gray-300 to-gray-400"></div>
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <div class="text-white">
                    <h3 class="font-semibold">Model {{ i }}</h3>
                    <p class="text-sm text-gray-300">Fashion • Runway</p>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Video Section -->
      <section class="py-16 bg-gray-900 text-white">
        <div class="container mx-auto px-4">
          <div class="flex justify-between items-center mb-8">
            <h2 class="text-3xl font-bold">Latest Videos</h2>
            <a href="#" class="text-indigo-400 font-semibold hover:text-indigo-300">View Playlist →</a>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            @for (i of [1, 2]; track i) {
              <div class="relative aspect-video bg-gray-800 rounded-lg overflow-hidden group">
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <h3 class="font-semibold">Featured Video {{ i }}</h3>
                  <p class="text-sm text-gray-300">2.5K views • 3 days ago</p>
                </div>
              </div>
            }
          </div>
        </div>
      </section>
      <!-- CTA Section - Gallery Submission -->
      <section class="py-16 bg-gradient-to-r from-pink-600 to-purple-600 text-white">
        <div class="container mx-auto px-4 text-center">
          <h2 class="text-3xl md:text-4xl font-bold mb-4">Submit Your Photo Collection</h2>
          <p class="text-lg text-pink-100 mb-8 max-w-2xl mx-auto">
            Showcase your photography and creative work. Create galleries and share your talent with the PMST community.
          </p>
          <a routerLink="/submit/gallery" class="inline-block bg-white text-pink-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Submit Gallery
          </a>
        </div>
      </section>

      <!-- CTA Section - Content Writer -->
      <section class="py-16 bg-indigo-900 text-white">
        <div class="container mx-auto px-4 text-center">
          <h2 class="text-3xl md:text-4xl font-bold mb-4">Become a Voice In Nepali News & Entertainment</h2>
          <p class="text-lg text-indigo-200 mb-8 max-w-2xl mx-auto">
            Love writing about the latest Nepali news, movies, music, celebrities, and entertainment trends? 
            Join us as a content writer and share exclusive updates with our audience!
          </p>
          <a routerLink="/submit/article" class="inline-block bg-white text-indigo-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Apply for Contributor Role
          </a>
        </div>
      </section>
    </div>
  `,
  styles: [``]
})
export class HomeComponent {
  latestNews = signal([
    {
      id: 1,
      title: 'Supreme Court Denies Release: Rabi Lamichhane Remains in Jail',
      category: 'News',
      excerpt: 'Latest updates on the ongoing legal proceedings and court decisions.',
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400'
    },
    {
      id: 2,
      title: 'Meet and Greet with Pradeep Khadka held in America',
      category: 'Entertainment',
      excerpt: 'Presented by 4 Bhai Entertainment, the program with Nepali film superstar concluded in Gaithersburg, Maryland.',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400'
    },
    {
      id: 3,
      title: 'Abha Dhungana\'s Debut Confirmed Through Kashyap',
      category: 'Fashion',
      excerpt: 'New talents emerging in Nepali cinema with promising debut announcements.',
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400'
    }
  ]);

  featuredModels = signal([
    { id: 1, name: 'Punam Bhandari', category: 'Fashion', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400' },
    { id: 2, name: 'Rajshri', category: 'Runway', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400' },
    { id: 3, name: 'Abha Dhungana', category: 'Fashion', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400' },
    { id: 4, name: 'Featured Model', category: 'Events', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400' }
  ]);
}
