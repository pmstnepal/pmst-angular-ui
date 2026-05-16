import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  eventDate: string;
  endDate?: string;
  featuredImage: string;
  ticketPrice: number | null;
  maxAttendees: number;
  registeredCount: number;
  organizer: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

@Component({
  selector: 'pmst-events-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="events-page py-8">
      <div class="container mx-auto px-4">
        <!-- Header -->
        <div class="text-center mb-10">
          <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Events</h1>
          <p class="text-gray-600 max-w-2xl mx-auto">Discover upcoming events, cultural celebrations, and community gatherings organized by PMST US-Nepal.</p>
        </div>

        <!-- Filter Tabs -->
        <div class="flex justify-center gap-2 mb-8">
          @for (filter of filters; track filter) {
            <button
              (click)="activeFilter.set(filter)"
              class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
              [class]="activeFilter() === filter ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            >
              {{ filter }}
            </button>
          }
        </div>

        <!-- Events Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (event of filteredEvents(); track event.id) {
            <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <!-- Image -->
              <div class="relative aspect-video bg-gray-200">
                @if (event.featuredImage) {
                  <img [src]="event.featuredImage" [alt]="event.title" class="w-full h-full object-cover">
                } @else {
                  <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                    <svg class="w-16 h-16 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                }
                <!-- Status Badge -->
                <span class="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold"
                  [class]="event.status === 'upcoming' ? 'bg-green-100 text-green-700' : event.status === 'ongoing' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'">
                  {{ event.status | titlecase }}
                </span>
                @if (event.ticketPrice !== null) {
                  <span class="absolute top-3 right-3 bg-white/90 text-gray-800 px-2 py-1 rounded-full text-xs font-bold">
                    {{ event.ticketPrice === 0 ? 'Free' : '$' + event.ticketPrice }}
                  </span>
                }
              </div>

              <!-- Content -->
              <div class="p-5">
                <div class="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  {{ event.eventDate | date:'EEEE, MMM d, yyyy' }}
                </div>
                <h3 class="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{{ event.title }}</h3>
                <p class="text-sm text-gray-600 mb-3 line-clamp-2">{{ event.description }}</p>
                <div class="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  {{ event.location }}
                </div>

                <!-- Registration Bar -->
                <div class="mb-3">
                  <div class="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{{ event.registeredCount }} registered</span>
                    <span>{{ event.maxAttendees }} spots</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-1.5">
                    <div class="bg-indigo-600 h-1.5 rounded-full transition-all" [style.width]="(event.registeredCount / event.maxAttendees * 100) + '%'"></div>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-500">By {{ event.organizer }}</span>
                  <button class="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-full hover:bg-indigo-700 transition-colors"
                    [disabled]="event.status === 'completed'"
                    [class.opacity-50]="event.status === 'completed'"
                  >
                    {{ event.status === 'completed' ? 'Ended' : 'Register' }}
                  </button>
                </div>
              </div>
            </div>
          }
        </div>

        @if (filteredEvents().length === 0) {
          <div class="text-center py-16 text-gray-500">
            <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <p class="text-lg font-medium">No events found</p>
            <p class="text-sm">Check back later for new events.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  `]
})
export class EventsListComponent {
  filters = ['All', 'Upcoming', 'Ongoing', 'Completed'];
  activeFilter = signal('All');

  events = signal<Event[]>([
    {
      id: '1', title: 'Biskaa Jatraa 2025: Cultural Highlights & Kids Fashion Show',
      slug: 'biskaa-jatraa-2025', description: 'Celebrate Nepali culture with traditional performances and a kids fashion show featuring young talent from the community.',
      location: 'Maryland, USA', eventDate: '2025-06-15', featuredImage: '', ticketPrice: 0, maxAttendees: 200, registeredCount: 145,
      organizer: 'PMST US-Nepal', status: 'upcoming'
    },
    {
      id: '2', title: 'NAIFF 2025: Nepal America International Film Festival',
      slug: 'naiff-2025', description: '31 global films showcasing Nepali and South Asian cinema. Red carpet, panels, and filmmaker meetups.',
      location: 'Maryland, USA', eventDate: '2025-06-20', endDate: '2025-06-22', featuredImage: '', ticketPrice: 25, maxAttendees: 500, registeredCount: 320,
      organizer: 'NAIFF Organization', status: 'upcoming'
    },
    {
      id: '3', title: 'Nepali Community Photography Workshop',
      slug: 'photo-workshop', description: 'Learn photography fundamentals and portfolio building with professional photographers from the Nepali community.',
      location: 'New York, USA', eventDate: '2025-07-10', featuredImage: '', ticketPrice: 15, maxAttendees: 50, registeredCount: 38,
      organizer: 'PMST US-Nepal', status: 'upcoming'
    },
    {
      id: '4', title: 'Kathmandu PABSON Inter School Dance Competition',
      slug: 'pabson-dance', description: 'Annual inter-school dance competition featuring talented students from PABSON schools across Kathmandu.',
      location: 'Kathmandu, Nepal', eventDate: '2025-04-20', featuredImage: '', ticketPrice: null, maxAttendees: 300, registeredCount: 300,
      organizer: 'PABSON', status: 'completed'
    },
  ]);

  filteredEvents = signal<Event[]>([]);

  constructor() {
    this.updateFiltered();
  }

  private updateFiltered() {
    const filter = this.activeFilter();
    const all = this.events();
    if (filter === 'All') {
      this.filteredEvents.set(all);
    } else {
      this.filteredEvents.set(all.filter(e => e.status === filter.toLowerCase()));
    }
  }

  ngDoCheck() {
    this.updateFiltered();
  }
}
