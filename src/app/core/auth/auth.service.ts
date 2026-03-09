import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthResponse {
    succeeded: boolean;
    token?: string;
    refreshToken?: string;
    tokenExpiry?: string;
    user?: UserDto;
    errors?: string[];
}

export interface UserDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly apiUrl = `${environment.apiUrl}/auth`;

    private _currentUser = signal<UserDto | null>(null);
    private _token = signal<string | null>(null);

    currentUser = this._currentUser.asReadonly();
    token = this._token.asReadonly();
    isAuthenticated = computed(() => !!this._token());

    constructor(private http: HttpClient, private router: Router) {
        this.loadStoredAuth();
    }

    login(request: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
            tap(response => {
                if (response.succeeded) {
                    this.storeAuth(response);
                }
            })
        );
    }

    register(request: RegisterRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
            tap(response => {
                if (response.succeeded) {
                    this.storeAuth(response);
                }
            })
        );
    }

    logout(): void {
        const token = this._token();
        if (token) {
            this.http.post(`${this.apiUrl}/logout`, {}).subscribe({ error: () => { } });
        }
        this.clearAuth();
        this.router.navigate(['/auth/login']);
    }

    refreshToken(): Observable<AuthResponse> {
        const token = this._token();
        const refreshToken = localStorage.getItem('cms_refresh_token');
        if (!token || !refreshToken) {
            this.clearAuth();
            return of({ succeeded: false, errors: ['No tokens available'] });
        }
        return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, { token, refreshToken }).pipe(
            tap(response => {
                if (response.succeeded) {
                    this.storeAuth(response);
                } else {
                    this.clearAuth();
                }
            }),
            catchError(() => {
                this.clearAuth();
                return of({ succeeded: false, errors: ['Token refresh failed'] });
            })
        );
    }

    getToken(): string | null {
        return this._token();
    }

    private storeAuth(response: AuthResponse): void {
        if (response.token) {
            localStorage.setItem('cms_token', response.token);
            this._token.set(response.token);
        }
        if (response.refreshToken) {
            localStorage.setItem('cms_refresh_token', response.refreshToken);
        }
        if (response.user) {
            localStorage.setItem('cms_user', JSON.stringify(response.user));
            this._currentUser.set(response.user);
        }
    }

    private clearAuth(): void {
        localStorage.removeItem('cms_token');
        localStorage.removeItem('cms_refresh_token');
        localStorage.removeItem('cms_user');
        this._token.set(null);
        this._currentUser.set(null);
    }

    private loadStoredAuth(): void {
        const token = localStorage.getItem('cms_token');
        const userJson = localStorage.getItem('cms_user');
        if (token && userJson) {
            this._token.set(token);
            try {
                this._currentUser.set(JSON.parse(userJson));
            } catch {
                this.clearAuth();
            }
        }
    }
}
