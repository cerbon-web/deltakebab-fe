import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./landing/landing.component').then(m => m.LandingComponent), pathMatch: 'full' },
  { path: 'landing', loadComponent: () => import('./landing/landing.component').then(m => m.LandingComponent) },
  { path: 'about', loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent) },
  { path: 'menu', loadComponent: () => import('./pages/menu-highlights/menu-highlights.component').then(m => m.MenuHighlightsComponent) },
  { path: 'why-us', loadComponent: () => import('./pages/why-us/why-us.component').then(m => m.WhyUsComponent) },
  { path: 'contact', loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent) },
  { path: '**', redirectTo: '' }
];
