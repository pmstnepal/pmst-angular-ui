import { Component, signal, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TicketingService } from '../../core/services/ticketing.service';
import { TicketingEvent, TicketCategory, CategoryRequest, AccessType, CheckinStrategy } from '../../core/models/ticketing.model';

interface CategoryForm {
  name: string;
  description: string;
  priceDollars: number;
  maxTickets: number | null;
  bounded: boolean;
  accessRestricted: boolean;
  accessType: AccessType;
  checkinStrategy: CheckinStrategy;
}

const EMPTY_CAT: CategoryForm = {
  name: '', description: '', priceDollars: 0, maxTickets: null, bounded: true,
  accessRestricted: false, accessType: 'INHERIT', checkinStrategy: 'ONCE_PER_EVENT'
};

@Component({
  selector: 'pmst-ticketing-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="py-8">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Ticketing Dashboard</h1>
            <p class="text-gray-500 text-sm mt-1">Sales overview &amp; ticket-category (pricing tier) management.</p>
          </div>
          <a routerLink="/admin/events" class="text-sm text-indigo-600 hover:underline">← Event management</a>
        </div>

        <!-- Mock stat cards (until Phase 2 payments/reservations exist) -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
          @for (s of mockStats; track s.label) {
            <div class="bg-white rounded-lg shadow p-5">
              <h3 class="text-xs font-medium text-gray-500 mb-1">{{ s.label }}</h3>
              <p class="text-2xl font-bold" [class]="s.color">{{ s.value }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ s.note }}</p>
            </div>
          }
        </div>
        <p class="text-xs text-amber-600 mb-6">* Sales figures are sample data — live once payments/reservations (Phase 2) are built.</p>

        @if (message()) {
          <div class="mb-4 px-4 py-3 rounded-lg text-sm"
               [class]="messageType() === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'">
            {{ message() }}
          </div>
        }

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Event list -->
          <div class="bg-white rounded-lg shadow lg:col-span-1">
            <div class="p-4 border-b font-semibold text-gray-800">Events</div>
            @if (loadingEvents()) {
              <div class="p-6 text-center text-gray-400 text-sm">Loading…</div>
            } @else if (events().length === 0) {
              <div class="p-6 text-center text-gray-500 text-sm">No events yet.</div>
            } @else {
              <ul class="divide-y max-h-[28rem] overflow-y-auto">
                @for (e of events(); track e.id) {
                  <li>
                    <button (click)="selectEvent(e)"
                      class="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                      [class.bg-indigo-50]="selectedEvent()?.id === e.id">
                      <div class="font-medium text-sm text-gray-900">{{ e.title }}</div>
                      <div class="text-xs text-gray-400">{{ e.status }}</div>
                    </button>
                  </li>
                }
              </ul>
            }
          </div>

          <!-- Categories for selected event -->
          <div class="bg-white rounded-lg shadow lg:col-span-2">
            @if (!selectedEvent()) {
              <div class="p-10 text-center text-gray-400 text-sm">Select an event to manage its ticket categories.</div>
            } @else {
              <div class="p-4 border-b flex items-center justify-between">
                <div class="font-semibold text-gray-800">
                  Ticket Categories — <span class="text-indigo-600">{{ selectedEvent()!.title }}</span>
                </div>
                <button (click)="openCreate()" class="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-medium">
                  + Add tier
                </button>
              </div>

              @if (loadingCats()) {
                <div class="p-8 text-center text-gray-400 text-sm">Loading categories…</div>
              } @else if (categories().length === 0) {
                <div class="p-8 text-center text-gray-500 text-sm">No categories yet. Add a pricing tier.</div>
              } @else {
                <table class="w-full text-sm">
                  <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th class="text-left px-4 py-2">Name</th>
                      <th class="text-right px-4 py-2">Price</th>
                      <th class="text-right px-4 py-2 hidden sm:table-cell">Max</th>
                      <th class="text-left px-4 py-2 hidden md:table-cell">Type</th>
                      <th class="text-right px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y">
                    @for (c of categories(); track c.id) {
                      <tr class="hover:bg-gray-50">
                        <td class="px-4 py-2">
                          <div class="font-medium text-gray-900">{{ c.name }}</div>
                          @if (c.accessRestricted) { <span class="text-xs text-purple-600">access-restricted</span> }
                        </td>
                        <td class="px-4 py-2 text-right font-medium">{{ c.priceCts === 0 ? 'Free' : (c.priceCts / 100 | currency:c.currencyCode) }}</td>
                        <td class="px-4 py-2 text-right hidden sm:table-cell text-gray-600">{{ c.maxTickets ?? '∞' }}</td>
                        <td class="px-4 py-2 hidden md:table-cell text-gray-600 text-xs">{{ c.accessType }}</td>
                        <td class="px-4 py-2 text-right">
                          <button (click)="openEdit(c)" class="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 text-gray-700 mr-1">Edit</button>
                          <button (click)="deleteCat(c)" class="px-2 py-1 text-xs rounded bg-red-50 hover:bg-red-100 text-red-600">Delete</button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            }
          </div>
        </div>
      </div>

      <!-- Category modal -->
      @if (formOpen()) {
        <div class="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto py-10 px-4">
          <div class="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div class="p-5 border-b flex items-center justify-between">
              <h2 class="text-lg font-semibold">{{ editingId() ? 'Edit Category' : 'New Category' }}</h2>
              <button (click)="closeForm()" class="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div class="p-5 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input [(ngModel)]="form.name" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Early Bird">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input [(ngModel)]="form.description" class="w-full border rounded-lg px-3 py-2 text-sm">
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Price (USD)</label>
                  <input type="number" min="0" step="0.01" [(ngModel)]="form.priceDollars" class="w-full border rounded-lg px-3 py-2 text-sm">
                  <p class="text-xs text-gray-400 mt-1">0 = free</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Max tickets</label>
                  <input type="number" min="0" [(ngModel)]="form.maxTickets" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="blank = unbounded">
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Access type</label>
                  <select [(ngModel)]="form.accessType" class="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="INHERIT">Inherit</option>
                    <option value="IN_PERSON">In person</option>
                    <option value="ONLINE">Online</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
                  <select [(ngModel)]="form.checkinStrategy" class="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="ONCE_PER_EVENT">Once per event</option>
                    <option value="ONCE_PER_DAY">Once per day</option>
                  </select>
                </div>
              </div>
              <div class="flex gap-6">
                <label class="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" [(ngModel)]="form.bounded"> Bounded
                </label>
                <label class="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" [(ngModel)]="form.accessRestricted"> Access-restricted
                </label>
              </div>
            </div>
            <div class="p-5 border-t flex justify-end gap-3">
              <button (click)="closeForm()" class="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">Cancel</button>
              <button (click)="saveCat()" [disabled]="saving() || !form.name.trim()"
                class="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
                {{ saving() ? 'Saving…' : (editingId() ? 'Save' : 'Create') }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class TicketingDashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private ticketing = inject(TicketingService);

  readonly isAdmin = computed(() => this.auth.isAdmin());

  // Sample stats — replaced by real data once Phase 2 (payments) exists.
  mockStats = [
    { label: 'Tickets Sold', value: '1,284', note: 'across all events', color: 'text-indigo-600' },
    { label: 'Revenue', value: '$42,850', note: 'gross (sample)', color: 'text-green-600' },
    { label: 'Checked In', value: '63%', note: 'of sold tickets', color: 'text-blue-600' },
    { label: 'Refunds', value: '$1,120', note: '27 requests', color: 'text-red-600' }
  ];

  events = signal<TicketingEvent[]>([]);
  categories = signal<TicketCategory[]>([]);
  selectedEvent = signal<TicketingEvent | null>(null);
  loadingEvents = signal(false);
  loadingCats = signal(false);
  saving = signal(false);
  message = signal('');
  messageType = signal<'error' | 'success'>('success');

  formOpen = signal(false);
  editingId = signal<number | null>(null);
  form: CategoryForm = { ...EMPTY_CAT };

  ngOnInit(): void {
    this.loadingEvents.set(true);
    const req$ = this.isAdmin() ? this.ticketing.listAll() : this.ticketing.listMine();
    req$.subscribe({
      next: page => {
        this.events.set(page.content ?? []);
        this.loadingEvents.set(false);
        if (this.events().length) this.selectEvent(this.events()[0]);
      },
      error: err => { this.loadingEvents.set(false); this.fail(err); }
    });
  }

  selectEvent(e: TicketingEvent): void {
    this.selectedEvent.set(e);
    this.loadCategories();
  }

  loadCategories(): void {
    const e = this.selectedEvent();
    if (!e) return;
    this.loadingCats.set(true);
    this.ticketing.listCategories(e.id).subscribe({
      next: cats => { this.categories.set(cats ?? []); this.loadingCats.set(false); },
      error: err => { this.loadingCats.set(false); this.fail(err); }
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form = { ...EMPTY_CAT };
    this.formOpen.set(true);
  }

  openEdit(c: TicketCategory): void {
    this.editingId.set(c.id);
    this.form = {
      name: c.name,
      description: c.description ?? '',
      priceDollars: c.priceCts / 100,
      maxTickets: c.maxTickets ?? null,
      bounded: c.bounded,
      accessRestricted: c.accessRestricted,
      accessType: c.accessType,
      checkinStrategy: c.checkinStrategy
    };
    this.formOpen.set(true);
  }

  closeForm(): void { this.formOpen.set(false); }

  saveCat(): void {
    const e = this.selectedEvent();
    if (!e) return;
    const payload: CategoryRequest = {
      name: this.form.name.trim(),
      description: this.form.description || undefined,
      priceCts: Math.max(0, Math.round((Number(this.form.priceDollars) || 0) * 100)),
      currencyCode: e.currencyCode || 'USD',
      maxTickets: this.form.maxTickets != null && `${this.form.maxTickets}` !== '' ? Number(this.form.maxTickets) : null,
      bounded: this.form.bounded,
      accessRestricted: this.form.accessRestricted,
      accessType: this.form.accessType,
      checkinStrategy: this.form.checkinStrategy
    };
    this.saving.set(true);
    const id = this.editingId();
    const req$ = id
      ? this.ticketing.updateCategory(e.id, id, payload)
      : this.ticketing.createCategory(e.id, payload);
    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.ok(id ? 'Category updated.' : 'Category added.');
        this.loadCategories();
      },
      error: err => { this.saving.set(false); this.fail(err); }
    });
  }

  deleteCat(c: TicketCategory): void {
    const e = this.selectedEvent();
    if (!e || !window.confirm(`Delete category “${c.name}”?`)) return;
    this.ticketing.deleteCategory(e.id, c.id).subscribe({
      next: () => { this.ok('Category deleted.'); this.loadCategories(); },
      error: err => this.fail(err)
    });
  }

  private ok(msg: string): void { this.messageType.set('success'); this.message.set(msg); this.clearSoon(); }
  private fail(err: any): void {
    this.messageType.set('error');
    this.message.set(err?.error?.message || err?.message || 'Something went wrong.');
    this.clearSoon();
  }
  private clearSoon(): void { setTimeout(() => this.message.set(''), 5000); }
}
