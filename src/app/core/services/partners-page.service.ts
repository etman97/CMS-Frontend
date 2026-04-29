import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface PartnerLogoDto {
    id: number;
    logoImageUrl: string | null;
    displayOrder: number;
}

export interface PartnersPageDto {
    isActive: boolean;
    heroImageUrl: string | null;
    subtitleEn: string;
    subtitleAr: string;
    partnerLogos: PartnerLogoDto[];
}

@Injectable({ providedIn: 'root' })
export class PartnersPageService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/partners-page`;
    private readonly cacheTtlMs = 5 * 60 * 1000;

    private cachedData: PartnersPageDto | null | undefined;
    private cacheTimestamp = 0;
    private inFlightRequest$: Observable<PartnersPageDto | null> | null = null;

    get(options?: { forceRefresh?: boolean }): Observable<PartnersPageDto | null> {
        if (!options?.forceRefresh && this.hasFreshCache()) {
            return of(this.cachedData ?? null);
        }

        if (!options?.forceRefresh && this.inFlightRequest$) {
            return this.inFlightRequest$;
        }

        this.inFlightRequest$ = this.http.get<PartnersPageDto | null>(this.apiUrl).pipe(
            tap((data) => this.setCache(data)),
            finalize(() => { this.inFlightRequest$ = null; }),
            shareReplay(1)
        );

        return this.inFlightRequest$;
    }

    save(dto: PartnersPageDto): Observable<void> {
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

    private setCache(data: PartnersPageDto | null): void {
        this.cachedData = data;
        this.cacheTimestamp = Date.now();
    }
}
