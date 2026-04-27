import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../core/auth/auth.service';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ButtonModule],
    templateUrl: './layout.component.html',
    styleUrl: './layout.component.scss'
})
export class LayoutComponent {
    sidebarCollapsed = false;
    isMobileSidebarOpen = false;

    constructor(public authService: AuthService) { }

    toggleSidebar(): void {
        if (typeof window !== 'undefined' && window.innerWidth <= 992) {
            this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
            return;
        }
        this.sidebarCollapsed = !this.sidebarCollapsed;
    }

    closeMobileSidebar(): void {
        this.isMobileSidebarOpen = false;
    }

    onNavItemClick(): void {
        if (typeof window !== 'undefined' && window.innerWidth <= 992) {
            this.closeMobileSidebar();
        }
    }

    logout(): void {
        this.authService.logout();
    }

    get currentUser() {
        return this.authService.currentUser();
    }

    get userInitials(): string {
        const user = this.currentUser;
        if (!user) return 'U';
        return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
    }
}
