import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';
import { homePageResolver } from './core/resolvers/home-page.resolver';
import { aboutPageResolver } from './core/resolvers/about-page.resolver';
import { contactPageResolver } from './core/resolvers/contact-page.resolver';
import { partnersPageResolver } from './core/resolvers/partners-page.resolver';
import { servicesPageResolver } from './core/resolvers/services-page.resolver';
import { solutionsPageResolver } from './core/resolvers/solutions-page.resolver';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./layout/public-layout/public-layout.component').then(m => m.PublicLayoutComponent),
        children: [
            {
                path: '',
                pathMatch: 'full',
                loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
                resolve: {
                    homePageData: homePageResolver
                }
            },
            {
                path: 'about',
                loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent),
                resolve: {
                    aboutPageData: aboutPageResolver
                }
            },
            {
                path: 'solutions',
                loadComponent: () => import('./features/solutions/solutions.component').then(m => m.SolutionsComponent),
                resolve: { solutionsPageData: solutionsPageResolver }
            },
            {
                path: 'services',
                loadComponent: () => import('./features/services/services.component').then(m => m.ServicesComponent),
                resolve: { servicesPageData: servicesPageResolver }
            },
            {
                path: 'partners',
                loadComponent: () => import('./features/partners/partners.component').then(m => m.PartnersComponent),
                resolve: { partnersPageData: partnersPageResolver }
            },
            {
                path: 'contact',
                loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent),
                resolve: {
                    contactPageData: contactPageResolver
                }
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
            },
            {
                path: 'dashboard/home',
                loadComponent: () => import('./features/dashboard/pages/dashboard-home/dashboard-home.component').then(m => m.DashboardHomeComponent)
            },
            {
                path: 'dashboard/about-us',
                loadComponent: () => import('./features/dashboard/pages/dashboard-about-us/dashboard-about-us.component').then(m => m.DashboardAboutUsComponent)
            },
            {
                path: 'dashboard/solutions',
                loadComponent: () => import('./features/dashboard/pages/dashboard-solutions/dashboard-solutions.component').then(m => m.DashboardSolutionsComponent)
            },
            {
                path: 'dashboard/solutions/access/:cardId',
                loadComponent: () => import('./features/dashboard/pages/dashboard-solutions-access/dashboard-solutions-access.component').then(m => m.DashboardSolutionsAccessComponent)
            },
            {
                path: 'dashboard/services',
                loadComponent: () => import('./features/dashboard/pages/dashboard-services/dashboard-services.component').then(m => m.DashboardServicesComponent)
            },
            {
                path: 'dashboard/partners',
                loadComponent: () => import('./features/dashboard/pages/dashboard-partners/dashboard-partners.component').then(m => m.DashboardPartnersComponent)
            },
            {
                path: 'dashboard/contact-us',
                loadComponent: () => import('./features/dashboard/pages/dashboard-contact-us/dashboard-contact-us.component').then(m => m.DashboardContactUsComponent)
            }
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
];
