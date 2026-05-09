import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'news',
    loadComponent: () => import('./features/news/news-list.component').then(m => m.NewsListComponent)
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
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'profile/:username',
    loadComponent: () => import('./features/user/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
