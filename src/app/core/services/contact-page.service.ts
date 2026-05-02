import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';
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

    get(forceRefresh = false): Observable<ContactPageDto | null> {
        if (!forceRefresh && this.cachedData !== undefined) {
            return of(this.cachedData);
        }

        if (!forceRefresh && this.inflightRequest$) {
            return this.inflightRequest$;
        }

        const request$ = this.http.get<ContactPageDto | null>(this.apiUrl).pipe(
            tap((data) => {
                this.cachedData = data;
            }),
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
            tap(() => {
                this.cachedData = dto;
            })
        );
    }

    invalidateCache(): void {
        this.cachedData = undefined;
        this.inflightRequest$ = null;
    }
}
