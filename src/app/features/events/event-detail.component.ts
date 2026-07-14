import { Component, signal, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TicketingService } from '../../core/services/ticketing.service';
import { AuthService } from '../../core/services/auth.service';
import { TicketingEvent, TicketCategory, ReservationResponse } from '../../core/models/ticketing.model';

@Component({
  selector: 'pmst-event-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="py-8">
      <div class="container mx-auto px-4 max-w-4xl">
        @if (loading()) {
          <div class="text-center py-16 text-gray-500">Loading event…</div>
        } @else {
          @if (event(); as e) {
            <div class="bg-white rounded-xl shadow-md overflow-hidden">
              <div class="relative aspect-video bg-gray-200">
                @if (e.imageUrl) {
                  <img [src]="e.imageUrl" [alt]="e.title" class="w-full h-full object-cover">
                } @else {
                  <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                    <svg class="w-20 h-20 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                }
              </div>
              <div class="p-6 md:p-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-4">{{ e.title }}</h1>
                <p class="text-gray-600 mb-6">{{ e.description }}</p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 mb-8">
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <span>{{ e.startsAt | date:'EEEE, MMM d, y, h:mm a' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    <span>{{ e.location || 'Location TBD' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="font-medium">Format:</span>
                    <span>{{ e.format }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="font-medium">Organizer:</span>
                    <span>{{ e.organizer || 'PMST US-Nepal' }}</span>
                  </div>
                </div>

                @if (message()) {
                  <div class="mb-6 px-4 py-3 rounded-lg text-sm"
                    [class]="messageType() === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'">
                    {{ message() }}
                  </div>
                }

                @if (reservation(); as res) {
                  <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                    <h2 class="text-lg font-semibold text-green-800 mb-2">Registration confirmed!</h2>
                    <p class="text-sm text-green-700 mb-4">Your ticket{{ res.tickets.length > 1 ? 's' : '' }} have been issued.</p>
                    <div class="space-y-3">
                      @for (ticket of res.tickets; track ticket.id) {
                        <div class="bg-white rounded-lg p-4 border border-green-100">
                          <div class="text-sm text-gray-500">{{ ticket.categoryName }}</div>
                          <div class="font-mono text-sm text-gray-900 break-all">{{ ticket.qrCode }}</div>
                        </div>
                      }
                    </div>
                  </div>
                } @else {
                  <h2 class="text-xl font-semibold text-gray-900 mb-4">Register</h2>
                  @if (freeCategories().length > 0) {
                    <div class="space-y-4">
                      @for (cat of freeCategories(); track cat.id) {
                        <div class="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div class="font-medium">{{ cat.name }}</div>
                            <div class="text-sm text-gray-500">{{ cat.description || 'Free admission' }}</div>
                          </div>
                          <div class="flex items-center gap-3">
                            <select [ngModel]="quantities()[cat.id]" (change)="updateQuantity(cat.id, $any($event).target.value)" class="border rounded-lg px-2 py-1 text-sm">
                              @for (n of [0,1,2,3,4,5]; track n) {
                                <option [value]="n">{{ n }}</option>
                              }
                            </select>
                          </div>
                        </div>
                      }
                      <button (click)="register()" [disabled]="registering() || totalQuantity() === 0"
                        class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium">
                        {{ registering() ? 'Registering…' : 'Register for free' }}
                      </button>
                    </div>
                  } @else {
                    <p class="text-gray-500">No free tickets are currently available for this event.</p>
                  }
                  @if (!isAuthenticated()) {
                    <p class="text-sm text-gray-500 mt-4">
                      <a routerLink="/login" class="text-indigo-600 hover:underline">Log in</a> to register.
                    </p>
                  }
                }
              </div>
            </div>
          } @else {
            <div class="text-center py-16 text-gray-500">Event not found.</div>
          }
        }
      </div>
    </div>
  `
})
export class EventDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ticketing = inject(TicketingService);
  private auth = inject(AuthService);

  event = signal<TicketingEvent | null>(null);
  categories = signal<TicketCategory[]>([]);
  loading = signal(true);
  registering = signal(false);
  message = signal('');
  messageType = signal<'success' | 'error'>('success');
  reservation = signal<ReservationResponse | null>(null);
  quantities = signal<Record<number, number>>({});

  isAuthenticated = computed(() => this.auth.authenticated());

  freeCategories = computed(() => this.categories().filter(c => c.priceCts === 0 && !c.accessRestricted));
  totalQuantity = computed(() => this.freeCategories().reduce((sum, c) => sum + (this.quantities()[c.id] || 0), 0));

  constructor() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.loading.set(false);
      return;
    }
    this.ticketing.getEventBySlug(slug).subscribe({
      next: e => {
        this.event.set(e);
        this.loading.set(false);
        this.loadCategories(e.id);
      },
      error: () => { this.loading.set(false); }
    });
  }

  private loadCategories(eventId: number): void {
    this.ticketing.listCategories(eventId).subscribe({
      next: cats => {
        this.categories.set(cats);
        const initial: Record<number, number> = {};
        for (const c of cats) initial[c.id] = 0;
        this.quantities.set(initial);
      }
    });
  }

  updateQuantity(categoryId: number, value: number | string): void {
    const q = typeof value === 'string' ? parseInt(value, 10) : value;
    this.quantities.update(map => ({ ...map, [categoryId]: isNaN(q) ? 0 : q }));
  }

  register(): void {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    const e = this.event();
    if (!e) return;

    const items = this.freeCategories()
      .filter(c => (this.quantities()[c.id] || 0) > 0)
      .map(c => ({ categoryId: c.id, quantity: this.quantities()[c.id] }));

    if (items.length === 0) return;

    const user = this.auth.user();
    const buyerEmail = user?.email || '';
    const buyerName = user?.displayName || user?.username || '';

    this.registering.set(true);
    this.message.set('');

    this.ticketing.createReservation(e.id, { buyerEmail, buyerName, items }).subscribe({
      next: res => {
        this.reservation.set(res);
        this.registering.set(false);
      },
      error: err => {
        this.registering.set(false);
        this.messageType.set('error');
        this.message.set(err?.error?.message || err?.message || 'Registration failed.');
      }
    });
  }
}
