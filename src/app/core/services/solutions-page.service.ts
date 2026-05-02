import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SolutionCardDto {
    id: number;
    groupNameEn: string;
    briefEn: string;
    groupNameAr: string;
    briefAr: string;
    imageUrl: string | null;
    displayOrder: number;
}

export interface SolutionsPageDto {
    isActive: boolean;
    heroImageUrl: string | null;
    heroTextEn: string;
    heroTextAr: string;
    solutionCards: SolutionCardDto[];
}

@Injectable({ providedIn: 'root' })
export class SolutionsPageService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/solutions-page`;
    private readonly cacheTtlMs = 5 * 60 * 1000;

    private cachedData: SolutionsPageDto | null | undefined;
    private cacheTimestamp = 0;
    private inFlightRequest$: Observable<SolutionsPageDto | null> | null = null;

    get(options?: { forceRefresh?: boolean }): Observable<SolutionsPageDto | null> {
        if (!options?.forceRefresh && this.hasFreshCache()) {
            return of(this.cachedData ?? null);
        }

        if (!options?.forceRefresh && this.inFlightRequest$) {
            return this.inFlightRequest$;
        }

        this.inFlightRequest$ = this.http.get<SolutionsPageDto | null>(this.apiUrl).pipe(
            tap((data) => this.setCache(data)),
            finalize(() => { this.inFlightRequest$ = null; }),
            shareReplay(1)
        );

        return this.inFlightRequest$;
    }

    save(dto: SolutionsPageDto): Observable<void> {
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

    private setCache(data: SolutionsPageDto | null): void {
        this.cachedData = data;
        this.cacheTimestamp = Date.now();
    }
}
