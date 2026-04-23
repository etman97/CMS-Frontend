import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
    constructor(public authService: AuthService) { }

    get userName(): string {
        const user = this.authService.currentUser();
        return user ? `${user.firstName} ${user.lastName}` : 'User';
    }

    statCards = [
        { title: 'Total Pages', value: 0, icon: 'bi bi-file-earmark-text', color: '#2D2E83', bgColor: 'rgba(45, 46, 131, 0.12)' },
        { title: 'Media Files', value: 0, icon: 'bi bi-image', color: '#7C7AB8', bgColor: 'rgba(124, 122, 184, 0.12)' },
        { title: 'Total Users', value: 1, icon: 'bi bi-people', color: '#2D2E83', bgColor: 'rgba(45, 46, 131, 0.12)' },
        { title: 'Published', value: 0, icon: 'bi bi-check-circle', color: '#7C7AB8', bgColor: 'rgba(124, 122, 184, 0.12)' }
    ];

    recentActivity = [
        { action: 'Account created', time: 'Just now', icon: 'bi bi-person-plus', color: '#2D2E83' },
        { action: 'Logged in to dashboard', time: 'Just now', icon: 'bi bi-box-arrow-in-right', color: '#7C7AB8' }
    ];

    websiteSections = [
        { name: 'Home', icon: 'bi bi-house-door' },
        { name: 'About Us', icon: 'bi bi-info-circle' },
        { name: 'Solutions', icon: 'bi bi-diagram-3' },
        { name: 'Services', icon: 'bi bi-briefcase' },
        { name: 'Partners', icon: 'bi bi-people' },
        { name: 'Contact Us', icon: 'bi bi-envelope' }
    ];
}
