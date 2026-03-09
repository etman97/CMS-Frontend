import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
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
        redirectTo: 'dashboard'
    }
];
