import { Component, computed } from '@angular/core';
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
        { title: 'Total Pages', value: 0, icon: 'pi pi-file', color: '#667eea', bgColor: 'rgba(102, 126, 234, 0.12)' },
        { title: 'Media Files', value: 0, icon: 'pi pi-image', color: '#f093fb', bgColor: 'rgba(240, 147, 251, 0.12)' },
        { title: 'Total Users', value: 1, icon: 'pi pi-users', color: '#4facfe', bgColor: 'rgba(79, 172, 254, 0.12)' },
        { title: 'Published', value: 0, icon: 'pi pi-check-circle', color: '#43e97b', bgColor: 'rgba(67, 233, 123, 0.12)' }
    ];

    recentActivity = [
        { action: 'Account created', time: 'Just now', icon: 'pi pi-user-plus', color: '#667eea' },
        { action: 'Logged in to dashboard', time: 'Just now', icon: 'pi pi-sign-in', color: '#43e97b' }
    ];
}
