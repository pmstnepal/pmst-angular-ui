import { Routes } from '@angular/router';
import { authGuard, adminGuard, moderatorGuard, redirectIfAuthenticated } from './core/guards/auth.guard';
import { eventsEnabledGuard } from './core/guards/events-enabled.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'news/:slug',
    loadComponent: () => import('./features/news/news-detail.component').then(m => m.NewsDetailComponent)
  },
  {
    path: 'showcase',
    loadComponent: () => import('./features/showcase/showcase-list.component').then(m => m.ShowcaseListComponent)
  },
  {
    path: 'showcase/:id',
    loadComponent: () => import('./features/showcase/showcase-detail.component').then(m => m.ShowcaseDetailComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
    canActivate: [redirectIfAuthenticated]
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent),
    canActivate: [redirectIfAuthenticated]
  },
  {
    path: 'profile/:username',
    loadComponent: () => import('./features/user/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/user/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'submit/article',
    loadComponent: () => import('./features/user/submit-content.component').then(m => m.SubmitContentComponent),
    canActivate: [authGuard]
  },
  {
    path: 'submit/article/edit/:id',
    loadComponent: () => import('./features/user/submit-content.component').then(m => m.SubmitContentComponent),
    canActivate: [authGuard]
  },
  {
    path: 'submit/gallery',
    loadComponent: () => import('./features/user/submit-gallery.component').then(m => m.SubmitGalleryComponent),
    canActivate: [authGuard]
  },
  {
    path: 'submit/gallery/edit/:id',
    loadComponent: () => import('./features/user/submit-gallery.component').then(m => m.SubmitGalleryComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [adminGuard]
  },
  {
    // Event management — admin + moderator (creators). Publish/approve gated in-component.
    path: 'admin/events',
    loadComponent: () => import('./features/admin/event-management.component').then(m => m.EventManagementComponent),
    canActivate: [moderatorGuard]
  },
  {
    // Ticketing dashboard — sales overview + ticket-category management.
    path: 'admin/ticketing',
    loadComponent: () => import('./features/admin/ticketing-dashboard.component').then(m => m.TicketingDashboardComponent),
    canActivate: [moderatorGuard]
  },
  {
    path: 'spotlight',
    loadComponent: () => import('./features/spotlight/spotlight.component').then(m => m.SpotlightComponent)
  },
  {
    path: 'events/:slug',
    loadComponent: () => import('./features/events/event-detail.component').then(m => m.EventDetailComponent),
    canActivate: [eventsEnabledGuard]
  },
  {
    path: 'events',
    loadComponent: () => import('./features/events/events-list.component').then(m => m.EventsListComponent),
    pathMatch: 'full',
    canActivate: [eventsEnabledGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
