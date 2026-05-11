import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export type ImageChoice = 'OneImage' | 'TwoImages';

export interface SolutionSectionDto {
    id: number;
    solutionCardId: number;
    titleEn: string;
    paragraphEn: string;
    titleAr: string;
    paragraphAr: string;
    imageChoice: ImageChoice;
    imageUrl1: string | null;
    imageUrl2: string | null;
    displayOrder: number;
}

export interface UpsertSolutionSectionItem {
    id: number;
    titleEn: string;
    paragraphEn: string;
    titleAr: string;
    paragraphAr: string;
    imageChoice: ImageChoice;
    imageUrl1: string | null;
    imageUrl2: string | null;
    displayOrder: number;
}

@Injectable({ providedIn: 'root' })
export class SolutionSectionsService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/solution-sections`;
    private readonly cacheTtlMs = 5 * 60 * 1000;

    private readonly cachedData = new Map<number, { data: SolutionSectionDto[]; timestamp: number }>();
    private readonly inFlightRequests = new Map<number, Observable<SolutionSectionDto[]>>();

    getByCardId(cardId: number, options?: { forceRefresh?: boolean }): Observable<SolutionSectionDto[]> {
        if (!options?.forceRefresh && this.hasFreshCache(cardId)) {
            return of(this.cachedData.get(cardId)?.data ?? []);
        }

        const inFlightRequest$ = this.inFlightRequests.get(cardId);
        if (!options?.forceRefresh && inFlightRequest$) {
            return inFlightRequest$;
        }

        const request$ = this.http.get<SolutionSectionDto[]>(`${this.apiUrl}/${cardId}`).pipe(
            tap((data) => this.setCache(cardId, data)),
            finalize(() => this.inFlightRequests.delete(cardId)),
            shareReplay(1)
        );

        this.inFlightRequests.set(cardId, request$);
        return request$;
    }

    prefetchByCardIds(cardIds: number[]): Observable<SolutionSectionDto[][]> {
        const uniqueCardIds = [...new Set(cardIds)].filter((id) => Number.isFinite(id));
        if (!uniqueCardIds.length) {
            return of([]);
        }

        return forkJoin(uniqueCardIds.map((cardId) => this.getByCardId(cardId)));
    }

    save(cardId: number, items: UpsertSolutionSectionItem[]): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${cardId}`, items).pipe(
            tap(() => this.invalidateCard(cardId))
        );
    }

    invalidateCard(cardId: number): void {
        this.cachedData.delete(cardId);
        this.inFlightRequests.delete(cardId);
    }

    private hasFreshCache(cardId: number): boolean {
        const cached = this.cachedData.get(cardId);
        return !!cached && (Date.now() - cached.timestamp) < this.cacheTtlMs;
    }

    private setCache(cardId: number, data: SolutionSectionDto[]): void {
        this.cachedData.set(cardId, { data, timestamp: Date.now() });
    }
}
