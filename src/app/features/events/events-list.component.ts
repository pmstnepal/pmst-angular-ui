import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TicketingService } from '../../core/services/ticketing.service';
import { TicketingEvent } from '../../core/models/ticketing.model';

// Local interface for event display (avoids conflict with global Event type)
interface EventItem {
  id: number;
  title: string;
  slug: string;
  description: string;
  location: string;
  eventDate: string;
  endDate?: string;
  featuredImage: string;
  ticketPrice: number | null;
  organizer: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

@Component({
  selector: 'pmst-events-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Template implementation follows OnPush change detection strategy -->
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

        <!-- Loading -->
        @if (loading()) {
          <div class="text-center py-16 text-gray-500">
            <p class="text-lg">Loading events…</p>
          </div>
        }

        <!-- Events Grid -->
        @if (!loading()) {
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

                  <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-500">By {{ event.organizer }}</span>
                    @if (event.status === 'completed') {
                      <button class="px-4 py-1.5 bg-gray-300 text-white text-sm rounded-full opacity-50" disabled>Ended</button>
                    } @else {
                      <a [routerLink]="['/events', event.slug]" class="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-full hover:bg-indigo-700 transition-colors inline-block">
                        Register
                      </a>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }

        @if (!loading() && filteredEvents().length === 0) {
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
  private ticketing = inject(TicketingService);

  filters = ['All', 'Upcoming', 'Ongoing', 'Completed'];
  activeFilter = signal('All');
  loading = signal(true);

  events = signal<EventItem[]>([]);
  filteredEvents = computed(() => {
    const filter = this.activeFilter();
    const all = this.events();
    if (filter === 'All') {
      return all;
    }
    return all.filter(e => e.status === filter.toLowerCase());
  });

  constructor() {
    this.ticketing.listPublished().subscribe({
      next: page => {
        this.events.set((page.content ?? []).map(e => this.toEventItem(e)));
        this.loading.set(false);
      },
      error: () => {
        this.events.set([]);
        this.loading.set(false);
      }
    });
  }

  private toEventItem(e: TicketingEvent): EventItem {
    return {
      id: e.id,
      title: e.title,
      slug: e.slug,
      description: e.description || '',
      location: e.location || 'Location TBD',
      eventDate: e.startsAt || '',
      endDate: e.endsAt,
      featuredImage: e.imageUrl || '',
      ticketPrice: e.priceFromCts !== null && e.priceFromCts !== undefined ? e.priceFromCts / 100 : null,
      organizer: e.organizer || 'PMST US-Nepal',
      status: this.deriveStatus(e.startsAt, e.endsAt)
    };
  }

  private deriveStatus(startsAt?: string, endsAt?: string): 'upcoming' | 'ongoing' | 'completed' {
    const now = new Date().getTime();
    const start = startsAt ? new Date(startsAt).getTime() : Number.MAX_SAFE_INTEGER;
    const end = endsAt ? new Date(endsAt).getTime() : Number.MAX_SAFE_INTEGER;

    if (end < now) {
      return 'completed';
    }
    if (start <= now && end >= now) {
      return 'ongoing';
    }
    return 'upcoming';
  }
}
