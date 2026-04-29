import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ServiceItemDto {
    id: number;
    groupNameEn: string;
    briefEn: string;
    groupNameAr: string;
    briefAr: string;
    imageUrl: string | null;
    displayOrder: number;
}

export interface ServicesPageDto {
    isActive: boolean;
    heroImageUrl: string | null;
    heroTextEn: string;
    heroTextAr: string;
    serviceItems: ServiceItemDto[];
}

@Injectable({ providedIn: 'root' })
export class ServicesPageService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/services-page`;
    private readonly cacheTtlMs = 5 * 60 * 1000;

    private cachedData: ServicesPageDto | null | undefined;
    private cacheTimestamp = 0;
    private inFlightRequest$: Observable<ServicesPageDto | null> | null = null;

    get(options?: { forceRefresh?: boolean }): Observable<ServicesPageDto | null> {
        if (!options?.forceRefresh && this.hasFreshCache()) {
            return of(this.cachedData ?? null);
        }

        if (!options?.forceRefresh && this.inFlightRequest$) {
            return this.inFlightRequest$;
        }

        this.inFlightRequest$ = this.http.get<ServicesPageDto | null>(this.apiUrl).pipe(
            tap((data) => this.setCache(data)),
            finalize(() => { this.inFlightRequest$ = null; }),
            shareReplay(1)
        );

        return this.inFlightRequest$;
    }

    save(dto: ServicesPageDto): Observable<void> {
        return this.http.put<void>(this.apiUrl, dto).pipe(
            tap(() => this.setCache(dto))
        );
    }

    invalidateCache(): void {
        this.cachedData = undefined;
        this.cacheTimestamp = 0;
        this.inFlightRequest$ = null;
    }

    private hasFreshCache(): boolean {
        return this.cachedData !== undefined && (Date.now() - this.cacheTimestamp) < this.cacheTtlMs;
    }

    private setCache(data: ServicesPageDto | null): void {
        this.cachedData = data;
        this.cacheTimestamp = Date.now();
    }
}
