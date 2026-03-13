import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, LoginRequest } from '../../../core/auth/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
    email = '';
    password = '';
    showPassword = false;
    loading = signal(false);
    errorMessage = signal('');

    constructor(private authService: AuthService, private router: Router) { }

    togglePassword(): void {
        this.showPassword = !this.showPassword;
    }

    onSubmit(): void {
        if (!this.email || !this.password) {
            this.errorMessage.set('Please fill in all fields.');
            return;
        }

        this.loading.set(true);
        this.errorMessage.set('');

        const request: LoginRequest = {
            email: this.email,
            password: this.password
        };

        this.authService.login(request).subscribe({
            next: (response) => {
                this.loading.set(false);
                if (response.succeeded) {
                    this.router.navigate(['/dashboard']);
                } else {
                    this.errorMessage.set(response.errors?.[0] || 'Login failed.');
                }
            },
            error: (err) => {
                this.loading.set(false);
                this.errorMessage.set(err.error?.errors?.[0] || 'An error occurred. Please try again.');
            }
        });
    }
}
