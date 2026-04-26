import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface TeamMemberDto {
    id: number;
    nameEn: string;
    jobTitleEn: string;
    briefEn: string;
    nameAr: string;
    jobTitleAr: string;
    briefAr: string;
    imageUrl: string | null;
    displayOrder: number;
}

export interface AboutPageDto {
    isActive: boolean;
    aboutUsContentEn: string;
    subContentEn: string;
    whyUsContentEn: string;
    numbersSubtitleEn: string;
    missionContentEn: string;
    visionContentEn: string;
    leadershipContentEn: string;
    aboutUsContentAr: string;
    subContentAr: string;
    whyUsContentAr: string;
    numbersSubtitleAr: string;
    missionContentAr: string;
    visionContentAr: string;
    leadershipContentAr: string;
    numberOfEmployees: number;
    numberOfProducts: number;
    numberOfClients: number;
    numberOfPartners: number;
    heroImageUrl: string | null;
    missionImageUrl: string | null;
    visionImageUrl: string | null;
    leadershipImageUrl: string | null;
    teamMembers: TeamMemberDto[];
}

@Injectable({ providedIn: 'root' })
export class AboutPageService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/about-page`;
    private readonly cacheTtlMs = 5 * 60 * 1000;

    private cachedData: AboutPageDto | null | undefined;
    private cacheTimestamp = 0;
    private inFlightRequest$: Observable<AboutPageDto | null> | null = null;

    get(options?: { forceRefresh?: boolean }): Observable<AboutPageDto | null> {
        if (!options?.forceRefresh && this.hasFreshCache()) {
            return of(this.cachedData ?? null);
        }

        if (!options?.forceRefresh && this.inFlightRequest$) {
            return this.inFlightRequest$;
        }

        this.inFlightRequest$ = this.http.get<AboutPageDto | null>(this.apiUrl).pipe(
            tap((data) => this.setCache(data)),
            finalize(() => {
                this.inFlightRequest$ = null;
            }),
            shareReplay(1)
        );

        return this.inFlightRequest$;
    }

    save(dto: AboutPageDto): Observable<void> {
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

    private setCache(data: AboutPageDto | null): void {
        this.cachedData = data;
        this.cacheTimestamp = Date.now();
    }
}
