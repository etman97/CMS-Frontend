import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
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
    missionTitleEn: string;
    missionContentEn: string;
    visionTitleEn: string;
    visionContentEn: string;
    leadershipTitleEn: string;
    leadershipContentEn: string;
    aboutUsContentAr: string;
    subContentAr: string;
    whyUsContentAr: string;
    numbersSubtitleAr: string;
    missionTitleAr: string;
    missionContentAr: string;
    visionTitleAr: string;
    visionContentAr: string;
    leadershipTitleAr: string;
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

    private readonly _data = signal<AboutPageDto | null>(null);
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
            return (this.inFlightRequest$ ?? this.get({ forceRefresh })).pipe(
                map(() => undefined),
                catchError(() => of(undefined))
            );
        }
        this._isLoading.set(true);
        this._error.set(null);
        return this.get({ forceRefresh }).pipe(
            catchError(() => {
                this._error.set('Failed to load about page data.');
                return of(null as AboutPageDto | null);
            }),
            finalize(() => this._isLoading.set(false)),
            map(() => undefined)
        );
    }

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
        this._data.set(null);
        this._hasLoaded.set(false);
        this._error.set(null);
    }

    private hasFreshCache(): boolean {
        return this.cachedData !== undefined && (Date.now() - this.cacheTimestamp) < this.cacheTtlMs;
    }

    private setCache(data: AboutPageDto | null): void {
        this.cachedData = data;
        this.cacheTimestamp = Date.now();
        this._data.set(data);
        this._hasLoaded.set(true);
    }
}
