import { Component, signal, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TicketingService } from '../../core/services/ticketing.service';
import { TicketingEvent, EventRequest, EventStatus, EventFormat } from '../../core/models/ticketing.model';

interface EventForm {
  title: string;
  description: string;
  format: EventFormat;
  venueName: string;
  location: string;
  timezone: string;
  startsAt: string; // datetime-local
  endsAt: string;   // datetime-local
  currencyCode: string;
  organizer: string;
  imageUrl: string;
}

const EMPTY_FORM: EventForm = {
  title: '', description: '', format: 'IN_PERSON', venueName: '', location: '',
  timezone: 'America/New_York', startsAt: '', endsAt: '', currencyCode: 'USD',
  organizer: '', imageUrl: ''
};

@Component({
  selector: 'pmst-event-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="py-8">
      <div class="container mx-auto px-4">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Event Management</h1>
            <p class="text-gray-500 text-sm mt-1">
              {{ isAdmin() ? 'Full access — create, edit, approve, publish.' : 'Create & edit your events; publishing needs admin approval.' }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <a routerLink="/admin/ticketing" class="text-sm text-indigo-600 hover:underline">Ticketing dashboard →</a>
            <button (click)="openCreate()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
              + New Event
            </button>
          </div>
        </div>

        <!-- Messages -->
        @if (message()) {
          <div class="mb-4 px-4 py-3 rounded-lg text-sm"
               [class]="messageType() === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'">
            {{ message() }}
          </div>
        }

        <!-- Status filter (admin only) -->
        @if (isAdmin()) {
          <div class="flex flex-wrap gap-2 mb-4">
            @for (f of statusFilters; track f.value) {
              <button (click)="setFilter(f.value)"
                class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                [class]="activeFilter() === f.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
                {{ f.label }}
              </button>
            }
          </div>
        }

        <!-- Table -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
          @if (loading()) {
            <div class="p-10 text-center text-gray-400">Loading events…</div>
          } @else if (events().length === 0) {
            <div class="p-10 text-center text-gray-500">No events found. Click “New Event” to create one.</div>
          } @else {
            <table class="w-full text-sm">
              <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th class="text-left px-4 py-3">Title</th>
                  <th class="text-left px-4 py-3">Status</th>
                  <th class="text-left px-4 py-3 hidden md:table-cell">Format</th>
                  <th class="text-left px-4 py-3 hidden lg:table-cell">Starts</th>
                  <th class="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                @for (e of events(); track e.id) {
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3">
                      <div class="font-medium text-gray-900">{{ e.title }}</div>
                      <div class="text-xs text-gray-400">/{{ e.slug }}</div>
                    </td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-0.5 rounded-full text-xs font-semibold" [class]="statusClass(e.status)">
                        {{ statusLabel(e.status) }}
                      </span>
                    </td>
                    <td class="px-4 py-3 hidden md:table-cell text-gray-600">{{ e.format }}</td>
                    <td class="px-4 py-3 hidden lg:table-cell text-gray-600">
                      {{ e.startsAt ? (e.startsAt | date:'MMM d, y, h:mm a') : '—' }}
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center justify-end gap-1.5 flex-wrap">
                        <button (click)="openEdit(e)" class="px-2.5 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 text-gray-700">Edit</button>

                        <!-- Creator: submit draft/rejected for approval -->
                        @if (canSubmit(e)) {
                          <button (click)="doAction('submit', e)" class="px-2.5 py-1 text-xs rounded bg-blue-100 hover:bg-blue-200 text-blue-700">Submit</button>
                        }

                        <!-- Admin: approve / reject pending -->
                        @if (isAdmin() && e.status === 'PENDING_APPROVAL') {
                          <button (click)="doAction('approve', e)" class="px-2.5 py-1 text-xs rounded bg-green-100 hover:bg-green-200 text-green-700">Approve</button>
                          <button (click)="doReject(e)" class="px-2.5 py-1 text-xs rounded bg-orange-100 hover:bg-orange-200 text-orange-700">Reject</button>
                        }

                        <!-- Admin: direct publish -->
                        @if (isAdmin() && e.status !== 'PUBLISHED') {
                          <button (click)="doAction('publish', e)" class="px-2.5 py-1 text-xs rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700">Publish</button>
                        }

                        <button (click)="doDelete(e)" class="px-2.5 py-1 text-xs rounded bg-red-50 hover:bg-red-100 text-red-600">Delete</button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </div>

      <!-- Create/Edit modal -->
      @if (formOpen()) {
        <div class="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto py-10 px-4">
          <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div class="p-5 border-b flex items-center justify-between">
              <h2 class="text-lg font-semibold">{{ editingId() ? 'Edit Event' : 'New Event' }}</h2>
              <button (click)="closeForm()" class="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div class="p-5 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input [(ngModel)]="form.title" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Event title">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea [(ngModel)]="form.description" rows="3" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Short description"></textarea>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Format</label>
                  <select [(ngModel)]="form.format" class="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="IN_PERSON">In person</option>
                    <option value="ONLINE">Online</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <input [(ngModel)]="form.currencyCode" maxlength="3" class="w-full border rounded-lg px-3 py-2 text-sm uppercase" placeholder="USD">
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                  <input [(ngModel)]="form.venueName" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Venue name">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input [(ngModel)]="form.location" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="City, State">
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Starts at</label>
                  <input type="datetime-local" [(ngModel)]="form.startsAt" class="w-full border rounded-lg px-3 py-2 text-sm">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Ends at</label>
                  <input type="datetime-local" [(ngModel)]="form.endsAt" class="w-full border rounded-lg px-3 py-2 text-sm">
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <input [(ngModel)]="form.timezone" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="America/New_York">
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Organizer</label>
                  <input [(ngModel)]="form.organizer" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="PMST US-Nepal">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input [(ngModel)]="form.imageUrl" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://...">
                </div>
              </div>
            </div>
            <div class="p-5 border-t flex justify-end gap-3">
              <button (click)="closeForm()" class="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">Cancel</button>
              <button (click)="save()" [disabled]="saving() || !form.title.trim()"
                class="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
                {{ saving() ? 'Saving…' : (editingId() ? 'Save changes' : 'Create draft') }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class EventManagementComponent implements OnInit {
  private auth = inject(AuthService);
  private ticketing = inject(TicketingService);

  readonly isAdmin = computed(() => this.auth.isAdmin());

  events = signal<TicketingEvent[]>([]);
  loading = signal(false);
  saving = signal(false);
  message = signal('');
  messageType = signal<'error' | 'success'>('success');

  activeFilter = signal<EventStatus | 'ALL'>('ALL');
  statusFilters: { label: string; value: EventStatus | 'ALL' }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Pending', value: 'PENDING_APPROVAL' },
    { label: 'Published', value: 'PUBLISHED' },
    { label: 'Rejected', value: 'REJECTED' }
  ];

  formOpen = signal(false);
  editingId = signal<number | null>(null);
  form: EventForm = { ...EMPTY_FORM };

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    const filter = this.activeFilter();
    const req$ = this.isAdmin()
      ? this.ticketing.listAll(filter === 'ALL' ? undefined : filter)
      : this.ticketing.listMine();
    req$.subscribe({
      next: page => { this.events.set(page.content ?? []); this.loading.set(false); },
      error: err => { this.loading.set(false); this.fail(err); }
    });
  }

  setFilter(f: EventStatus | 'ALL'): void {
    this.activeFilter.set(f);
    this.reload();
  }

  // ---- Form ---------------------------------------------------------------

  openCreate(): void {
    this.editingId.set(null);
    this.form = { ...EMPTY_FORM };
    this.formOpen.set(true);
  }

  openEdit(e: TicketingEvent): void {
    this.editingId.set(e.id);
    this.form = {
      title: e.title,
      description: e.description ?? '',
      format: e.format,
      venueName: e.venueName ?? '',
      location: e.location ?? '',
      timezone: e.timezone ?? 'America/New_York',
      startsAt: this.toLocalInput(e.startsAt),
      endsAt: this.toLocalInput(e.endsAt),
      currencyCode: e.currencyCode ?? 'USD',
      organizer: e.organizer ?? '',
      imageUrl: e.imageUrl ?? ''
    };
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  save(): void {
    const payload: EventRequest = {
      title: this.form.title.trim(),
      description: this.form.description || undefined,
      format: this.form.format,
      venueName: this.form.venueName || undefined,
      location: this.form.location || undefined,
      timezone: this.form.timezone || undefined,
      startsAt: this.toIso(this.form.startsAt),
      endsAt: this.toIso(this.form.endsAt),
      currencyCode: (this.form.currencyCode || 'USD').toUpperCase(),
      organizer: this.form.organizer || undefined,
      imageUrl: this.form.imageUrl || undefined
    };
    this.saving.set(true);
    const id = this.editingId();
    const req$ = id ? this.ticketing.updateEvent(id, payload) : this.ticketing.createEvent(payload);
    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.ok(id ? 'Event updated.' : 'Draft created.');
        this.reload();
      },
      error: err => { this.saving.set(false); this.fail(err); }
    });
  }

  // ---- Workflow actions ---------------------------------------------------

  canSubmit(e: TicketingEvent): boolean {
    return e.status === 'DRAFT' || e.status === 'REJECTED';
  }

  doAction(action: 'submit' | 'approve' | 'publish', e: TicketingEvent): void {
    const map = {
      submit: () => this.ticketing.submit(e.id),
      approve: () => this.ticketing.approve(e.id),
      publish: () => this.ticketing.publish(e.id)
    };
    map[action]().subscribe({
      next: () => { this.ok(`Event ${action}${action.endsWith('t') ? 'ted' : 'd'}.`); this.reload(); },
      error: err => this.fail(err)
    });
  }

  doReject(e: TicketingEvent): void {
    const reason = window.prompt('Reason for rejection?')?.trim();
    if (!reason) return;
    this.ticketing.reject(e.id, reason).subscribe({
      next: () => { this.ok('Event rejected.'); this.reload(); },
      error: err => this.fail(err)
    });
  }

  doDelete(e: TicketingEvent): void {
    if (!window.confirm(`Delete “${e.title}”? This cannot be undone.`)) return;
    this.ticketing.deleteEvent(e.id).subscribe({
      next: () => { this.ok('Event deleted.'); this.reload(); },
      error: err => this.fail(err)
    });
  }

  // ---- UI helpers ---------------------------------------------------------

  statusLabel(s: EventStatus): string {
    return s === 'PENDING_APPROVAL' ? 'Pending' : s.charAt(0) + s.slice(1).toLowerCase();
  }

  statusClass(s: EventStatus): string {
    switch (s) {
      case 'PUBLISHED': return 'bg-green-100 text-green-700';
      case 'PENDING_APPROVAL': return 'bg-yellow-100 text-yellow-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'ARCHIVED': return 'bg-gray-200 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  private ok(msg: string): void { this.messageType.set('success'); this.message.set(msg); this.clearSoon(); }
  private fail(err: any): void {
    this.messageType.set('error');
    this.message.set(err?.error?.message || err?.message || 'Something went wrong.');
    this.clearSoon();
  }
  private clearSoon(): void { setTimeout(() => this.message.set(''), 5000); }

  /** ISO string -> value usable by <input type="datetime-local"> (local time, no seconds). */
  private toLocalInput(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /** datetime-local value -> ISO string (or undefined when empty). */
  private toIso(local: string): string | undefined {
    if (!local) return undefined;
    const d = new Date(local);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }
}
