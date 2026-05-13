import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, RegisterRequest, UpdatePasswordRequest } from '../../../../core/auth/auth.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

type ActiveTab = 'add-user' | 'update-password';

@Component({
    selector: 'app-dashboard-users',
    standalone: true,
    imports: [FormsModule, ToastModule],
    providers: [MessageService],
    templateUrl: './dashboard-users.component.html',
    styleUrl: './dashboard-users.component.scss'
})
export class DashboardUsersComponent {
    private readonly authService = inject(AuthService);
    private readonly messageService = inject(MessageService);

    activeTab: ActiveTab = 'add-user';

    // ── Add User fields ──
    firstName = '';
    lastName = '';
    email = '';
    password = '';
    confirmPassword = '';
    showPassword = false;
    showConfirmPassword = false;
    loading = signal(false);
    attemptedSubmit = false;

    // ── Update Password fields ──
    upEmail = '';
    upNewPassword = '';
    upConfirmPassword = '';
    upShowPassword = false;
    upShowConfirmPassword = false;
    upLoading = signal(false);
    upAttemptedSubmit = false;

    private readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // ── Tab switching ──
    switchTab(tab: ActiveTab): void {
        this.activeTab = tab;
    }

    // ── Add User validation ──
    get firstNameInvalid(): boolean {
        return this.attemptedSubmit && !this.firstName.trim();
    }

    get lastNameInvalid(): boolean {
        return this.attemptedSubmit && !this.lastName.trim();
    }

    get emailInvalid(): boolean {
        return this.attemptedSubmit && !this.email.trim();
    }

    get emailPatternInvalid(): boolean {
        return this.attemptedSubmit && !!this.email.trim() && !this.emailPattern.test(this.email.trim());
    }

    get passwordInvalid(): boolean {
        return this.attemptedSubmit && !this.password;
    }

    get passwordTooShort(): boolean {
        return this.attemptedSubmit && !!this.password && this.password.length < 6;
    }

    get confirmPasswordInvalid(): boolean {
        return this.attemptedSubmit && !this.confirmPassword;
    }

    get passwordsMismatch(): boolean {
        return this.attemptedSubmit && !!this.confirmPassword && this.password !== this.confirmPassword;
    }

    get canSubmit(): boolean {
        return !this.loading()
            && !!this.firstName.trim()
            && !!this.lastName.trim()
            && !!this.email.trim()
            && this.emailPattern.test(this.email.trim())
            && !!this.password
            && this.password.length >= 6
            && this.password === this.confirmPassword;
    }

    // ── Update Password validation ──
    get upEmailInvalid(): boolean {
        return this.upAttemptedSubmit && !this.upEmail.trim();
    }

    get upEmailPatternInvalid(): boolean {
        return this.upAttemptedSubmit && !!this.upEmail.trim() && !this.emailPattern.test(this.upEmail.trim());
    }

    get upPasswordInvalid(): boolean {
        return this.upAttemptedSubmit && !this.upNewPassword;
    }

    get upPasswordTooShort(): boolean {
        return this.upAttemptedSubmit && !!this.upNewPassword && this.upNewPassword.length < 6;
    }

    get upConfirmInvalid(): boolean {
        return this.upAttemptedSubmit && !this.upConfirmPassword;
    }

    get upPasswordsMismatch(): boolean {
        return this.upAttemptedSubmit && !!this.upConfirmPassword && this.upNewPassword !== this.upConfirmPassword;
    }

    get canSubmitPasswordUpdate(): boolean {
        return !this.upLoading()
            && !!this.upEmail.trim()
            && this.emailPattern.test(this.upEmail.trim())
            && !!this.upNewPassword
            && this.upNewPassword.length >= 6
            && this.upNewPassword === this.upConfirmPassword;
    }

    // ── Add User actions ──
    togglePassword(): void {
        this.showPassword = !this.showPassword;
    }

    toggleConfirmPassword(): void {
        this.showConfirmPassword = !this.showConfirmPassword;
    }

    onSubmit(): void {
        this.attemptedSubmit = true;
        if (!this.canSubmit) return;

        this.loading.set(true);

        const request: RegisterRequest = {
            email: this.email.trim(),
            password: this.password,
            firstName: this.firstName.trim(),
            lastName: this.lastName.trim()
        };

        this.authService.registerUser(request).subscribe({
            next: (response) => {
                this.loading.set(false);
                if (response.succeeded) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'User Created',
                        detail: `User ${request.firstName} ${request.lastName} (${request.email}) has been created successfully.`
                    });
                    this.resetAddForm();
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: response.errors?.[0] || 'Registration failed.'
                    });
                }
            },
            error: (err) => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.error?.errors?.[0] || 'An error occurred. Please try again.'
                });
            }
        });
    }

    // ── Update Password actions ──
    upTogglePassword(): void {
        this.upShowPassword = !this.upShowPassword;
    }

    upToggleConfirmPassword(): void {
        this.upShowConfirmPassword = !this.upShowConfirmPassword;
    }

    onUpdatePassword(): void {
        this.upAttemptedSubmit = true;
        if (!this.canSubmitPasswordUpdate) return;

        this.upLoading.set(true);

        const request: UpdatePasswordRequest = {
            email: this.upEmail.trim(),
            newPassword: this.upNewPassword
        };

        this.authService.updatePassword(request).subscribe({
            next: (response) => {
                this.upLoading.set(false);
                if (response.succeeded) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Password Updated',
                        detail: `Password for ${request.email} has been updated successfully.`
                    });
                    this.resetPasswordForm();
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: response.errors?.[0] || 'Password update failed.'
                    });
                }
            },
            error: (err) => {
                this.upLoading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.error?.errors?.[0] || 'An error occurred. Please try again.'
                });
            }
        });
    }

    // ── Reset helpers ──
    private resetAddForm(): void {
        this.firstName = '';
        this.lastName = '';
        this.email = '';
        this.password = '';
        this.confirmPassword = '';
        this.attemptedSubmit = false;
    }

    private resetPasswordForm(): void {
        this.upEmail = '';
        this.upNewPassword = '';
        this.upConfirmPassword = '';
        this.upAttemptedSubmit = false;
    }
}
