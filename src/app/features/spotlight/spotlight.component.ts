import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'pmst-spotlight',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="spotlight py-8">
      <div class="container mx-auto px-4">
        <!-- Hero Section -->
        <div class="text-center mb-12">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Spotlight</h1>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">Your gateway to Nepali entertainment, news, and creativity</p>
        </div>

        <!-- Category Tabs -->
        <div class="flex justify-center mb-8">
          <div class="inline-flex bg-gray-100 rounded-lg p-1">
            <button 
              (click)="setCategory('all')"
              [class.bg-white]="activeCategory() === 'all'"
              [class.shadow]="activeCategory() === 'all'"
              class="px-4 py-2 rounded-md text-sm font-medium transition-all"
            >
              All
            </button>
            <button 
              (click)="setCategory('entertainment')"
              [class.bg-white]="activeCategory() === 'entertainment'"
              [class.shadow]="activeCategory() === 'entertainment'"
              class="px-4 py-2 rounded-md text-sm font-medium transition-all"
            >
              Entertainment
            </button>
            <button 
              (click)="setCategory('news')"
              [class.bg-white]="activeCategory() === 'news'"
              [class.shadow]="activeCategory() === 'news'"
              class="px-4 py-2 rounded-md text-sm font-medium transition-all"
            >
              News
            </button>
            <button 
              (click)="setCategory('fashion')"
              [class.bg-white]="activeCategory() === 'fashion'"
              [class.shadow]="activeCategory() === 'fashion'"
              class="px-4 py-2 rounded-md text-sm font-medium transition-all"
            >
              Fashion
            </button>
          </div>
        </div>

        <!-- Content Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (item of filteredItems(); track item.id) {
            <article class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              @if (item.image) {
                <div class="relative h-48 overflow-hidden">
                  <img [src]="item.image" [alt]="item.title" class="w-full h-full object-cover hover:scale-105 transition-transform duration-500">
                  <span class="absolute top-4 left-4 px-3 py-1 bg-indigo-600 text-white text-xs rounded-full">
                    {{ item.category }}
                  </span>
                </div>
              }
              <div class="p-6">
                <h3 class="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                  <a [routerLink]="['/news', item.slug]" class="hover:text-indigo-600 transition-colors">
                    {{ item.title }}
                  </a>
                </h3>
                <p class="text-gray-600 text-sm mb-4 line-clamp-3">{{ item.excerpt }}</p>
                <div class="flex items-center justify-between text-sm text-gray-500">
                  <span>{{ item.author }}</span>
                  <span>{{ item.date }}</span>
                </div>
              </div>
            </article>
          }
        </div>

        <!-- Load More -->
        <div class="text-center mt-12">
          <button 
            (click)="loadMore()"
            class="px-8 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Load More
          </button>
        </div>

        <!-- CTA Section -->
        <div class="mt-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 class="text-3xl font-bold mb-4">Become a Contributor</h2>
          <p class="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">
            Love writing about Nepali movies, music, celebrities, and entertainment trends? 
            Join us as a content writer and share exclusive updates with our audience!
          </p>
          <a 
            routerLink="/submit/article" 
            class="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
          >
            Apply for Contributor Role
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [``]
})
export class SpotlightComponent {
  activeCategory = signal('all');

  items = signal([
    {
      id: 1,
      title: 'Meet and Greet with Pradeep Khadka held in America',
      excerpt: 'Presented by 4 Bhai Entertainment, the program with Nepali film superstar Pradeep Khadka has concluded in Gaithersburg, Maryland.',
      category: 'entertainment',
      author: 'PMST US-Nepal',
      date: '2 days ago',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
      slug: 'meet-and-greet-pradeep-khadka'
    },
    {
      id: 2,
      title: 'Abha Dhungana\'s debut confirmed through Kashyap',
      excerpt: 'Abha Dhungana\'s debut confirmed through Kashyap, Ridwi Khatri also selected from audition.',
      category: 'entertainment',
      author: 'Fashion Editor',
      date: '3 days ago',
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
      slug: 'abha-dhungana-debut-kashyap'
    },
    {
      id: 3,
      title: 'Rajshri, the new heroine in \'Jadau\'',
      excerpt: 'Rajshri has been cast as the new heroine in the upcoming Nepali film \'Jadau\'.',
      category: 'entertainment',
      author: 'Film Reporter',
      date: '4 days ago',
      image: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400',
      slug: 'rajshri-heroine-jadau'
    },
    {
      id: 4,
      title: 'Pradeep Bhattarai Replaces Manoj Gajurel in Comedy Darbar',
      excerpt: 'Pradeep Bhattarai has been announced as the new host of Comedy Darbar.',
      category: 'entertainment',
      author: 'Entertainment Desk',
      date: '5 days ago',
      image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=400',
      slug: 'pradeep-bhattarai-comedy-darbar'
    },
    {
      id: 5,
      title: 'INFA Awards 2025: Top Five Nominees Honored',
      excerpt: 'The top five nominees for INFA Awards 2025 were honored in a ceremony in Kathmandu.',
      category: 'news',
      author: 'News Reporter',
      date: '1 week ago',
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400',
      slug: 'infa-awards-2025-nominees'
    },
    {
      id: 6,
      title: 'Biskaa Jatraa 2025: Cultural Highlights',
      excerpt: 'Highlights from Biskaa Jatraa 2025 featuring cultural performances and kids fashion show.',
      category: 'fashion',
      author: 'Event Reporter',
      date: '1 week ago',
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400',
      slug: 'biskaa-jatraa-2025-highlights'
    }
  ]);

  filteredItems = () => {
    const category = this.activeCategory();
    if (category === 'all') {
      return this.items();
    }
    return this.items().filter(item => item.category === category);
  };

  setCategory(category: string): void {
    this.activeCategory.set(category);
  }

  loadMore(): void {
    // Simulate loading more items
    const newItems = [
      {
        id: 7,
        title: 'New Nepali Movie Release Announcement',
        excerpt: 'A major Nepali film studio announces their upcoming releases for 2025.',
        category: 'news',
        author: 'Film Critic',
        date: '2 weeks ago',
        image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400',
        slug: 'nepali-movie-release-2025'
      },
      {
        id: 8,
        title: 'Fashion Week Nepal 2025 Recap',
        excerpt: 'Complete recap of the biggest fashion event in Nepal featuring top designers.',
        category: 'fashion',
        author: 'Fashion Editor',
        date: '2 weeks ago',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        slug: 'fashion-week-nepal-2025'
      }
    ];
    this.items.update(items => [...items, ...newItems]);
  }
}
