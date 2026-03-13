import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, RegisterRequest } from '../../../core/auth/auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './register.component.html',
    styleUrl: './register.component.scss'
})
export class RegisterComponent {
    firstName = '';
    lastName = '';
    email = '';
    password = '';
    confirmPassword = '';
    showPassword = false;
    showConfirmPassword = false;
    loading = signal(false);
    errorMessage = signal('');

    constructor(private authService: AuthService, private router: Router) { }

    togglePassword(): void {
        this.showPassword = !this.showPassword;
    }

    toggleConfirmPassword(): void {
        this.showConfirmPassword = !this.showConfirmPassword;
    }

    onSubmit(): void {
        if (!this.firstName || !this.lastName || !this.email || !this.password) {
            this.errorMessage.set('Please fill in all fields.');
            return;
        }

        if (this.password !== this.confirmPassword) {
            this.errorMessage.set('Passwords do not match.');
            return;
        }

        if (this.password.length < 6) {
            this.errorMessage.set('Password must be at least 6 characters.');
            return;
        }

        this.loading.set(true);
        this.errorMessage.set('');

        const request: RegisterRequest = {
            email: this.email,
            password: this.password,
            firstName: this.firstName,
            lastName: this.lastName
        };

        this.authService.register(request).subscribe({
            next: (response) => {
                this.loading.set(false);
                if (response.succeeded) {
                    this.router.navigate(['/dashboard']);
                } else {
                    this.errorMessage.set(response.errors?.[0] || 'Registration failed.');
                }
            },
            error: (err) => {
                this.loading.set(false);
                this.errorMessage.set(err.error?.errors?.[0] || 'An error occurred. Please try again.');
            }
        });
    }
}
