import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ContactPageDto {
    isActive: boolean;
    introDescriptionEn: string;
    introDescriptionAr: string;
    phone: string;
    email: string;
    address: string;
    locationUrl: string;
    facebookUrl: string | null;
    linkedInUrl: string | null;
    heroImageUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class ContactPageService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/contact-page`;
    private cachedData: ContactPageDto | null | undefined;
    private inflightRequest$: Observable<ContactPageDto | null> | null = null;

    private readonly _data = signal<ContactPageDto | null>(null);
    private readonly _isLoading = signal(false);
    private readonly _error = signal<string | null>(null);
    private readonly _hasLoaded = signal(false);

    readonly data = this._data.asReadonly();
    readonly isLoading = this._isLoading.asReadonly();
    readonly error = this._error.asReadonly();
    readonly hasLoaded = this._hasLoaded.asReadonly();

    load(forceRefresh = false): Observable<void> {
        if (!forceRefresh && this._hasLoaded()) {
            return of(undefined);
        }
        if (this._isLoading() && !forceRefresh) {
            return (this.inflightRequest$ ?? this.get(forceRefresh)).pipe(
                map(() => undefined),
                catchError(() => of(undefined))
            );
        }
        this._isLoading.set(true);
        this._error.set(null);
        return this.get(forceRefresh).pipe(
            catchError(() => {
                this._error.set('Failed to load contact page data.');
                return of(null as ContactPageDto | null);
            }),
            finalize(() => this._isLoading.set(false)),
            map(() => undefined)
        );
    }

    get(forceRefresh = false): Observable<ContactPageDto | null> {
        if (!forceRefresh && this.cachedData !== undefined) {
            return of(this.cachedData);
        }

        if (!forceRefresh && this.inflightRequest$) {
            return this.inflightRequest$;
        }

        const request$ = this.http.get<ContactPageDto | null>(this.apiUrl).pipe(
            tap((data) => this.setCache(data)),
            finalize(() => {
                this.inflightRequest$ = null;
            }),
            shareReplay(1)
        );

        this.inflightRequest$ = request$;
        return request$;
    }

    save(dto: ContactPageDto): Observable<void> {
        return this.http.put<void>(this.apiUrl, dto).pipe(
            tap(() => this.setCache(dto))
        );
    }

    invalidateCache(): void {
        this.cachedData = undefined;
        this.inflightRequest$ = null;
        this._data.set(null);
        this._hasLoaded.set(false);
        this._error.set(null);
    }

    private setCache(data: ContactPageDto | null): void {
        this.cachedData = data;
        this._data.set(data);
        this._hasLoaded.set(true);
    }
}
