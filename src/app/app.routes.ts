import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./layout/public-layout/public-layout.component').then(m => m.PublicLayoutComponent),
        children: [
            {
                path: '',
                pathMatch: 'full',
                loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
            },
            {
                path: 'about',
                loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent)
            },
            {
                path: 'solutions',
                loadComponent: () => import('./features/solutions/solutions.component').then(m => m.SolutionsComponent)
            },
            {
                path: 'services',
                loadComponent: () => import('./features/services/services.component').then(m => m.ServicesComponent)
            },
            {
                path: 'partners',
                loadComponent: () => import('./features/partners/partners.component').then(m => m.PartnersComponent)
            },
            {
                path: 'contact',
                loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent)
            }
        ]
    },
    {
        path: 'auth',
        canActivate: [guestGuard],
        children: [
            {
                path: 'login',
                loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
            },
            {
                path: 'register',
                loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
            },
            {
                path: '',
                redirectTo: 'login',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
            }
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
];
