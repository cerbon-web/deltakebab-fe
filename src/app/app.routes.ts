import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./landing/landing.component').then(m => m.LandingComponent), pathMatch: 'full' },
  { path: 'landing', loadComponent: () => import('./landing/landing.component').then(m => m.LandingComponent) },
  { path: 'about', loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent) },
  { path: 'orders', loadComponent: () => import('./pages/orders-list/orders-list.component').then(m => m.OrdersListComponent) },
  { path: 'why-us', loadComponent: () => import('./pages/why-us/why-us.component').then(m => m.WhyUsComponent) },
  { path: 'contact', loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent) },
  { path: 'orders/:id', loadComponent: () => import('./orders/order-tracking/order-tracking.component').then(m => m.OrderTrackingComponent) },
  { path: 'admin', loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent) },
  { path: '**', redirectTo: '' }
];
