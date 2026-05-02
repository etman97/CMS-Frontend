import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export type PublicPageKey = 'home' | 'about' | 'partners' | 'solutions' | 'services' | 'contact';
export type PublicPageStatusMap = Record<PublicPageKey, boolean>;

@Injectable({ providedIn: 'root' })
export class PageStatusService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/pages/status`;

    private cachedStatuses: PublicPageStatusMap | undefined;
    private inflightRequest$: Observable<PublicPageStatusMap> | null = null;

    private readonly _statuses = signal<PublicPageStatusMap | null>(null);
    private readonly _isLoading = signal(false);
    private readonly _hasLoaded = signal(false);

    readonly statuses = this._statuses.asReadonly();
    readonly isLoading = this._isLoading.asReadonly();
    readonly hasLoaded = this._hasLoaded.asReadonly();

    load(forceRefresh = false): Observable<void> {
        if (!forceRefresh && this._hasLoaded()) {
            return of(undefined);
        }
        if (this._isLoading() && !forceRefresh) {
            return (this.inflightRequest$ ?? this.getStatuses(forceRefresh)).pipe(
                map(() => undefined),
                catchError(() => of(undefined))
            );
        }
        this._isLoading.set(true);
        return this.getStatuses(forceRefresh).pipe(
            finalize(() => this._isLoading.set(false)),
            map(() => undefined)
        );
    }

    getStatuses(forceRefresh = false): Observable<PublicPageStatusMap> {
        if (!forceRefresh && this.cachedStatuses) {
            return of(this.cachedStatuses);
        }

        if (!forceRefresh && this.inflightRequest$) {
            return this.inflightRequest$;
        }

        const request$ = this.http.get<unknown>(this.apiUrl).pipe(
            map((response) => this.normalizeResponse(response)),
            tap((statuses) => this.setStatuses(statuses)),
            catchError(() => of(this.defaultStatuses())),
            finalize(() => {
                this.inflightRequest$ = null;
            }),
            shareReplay(1)
        );

        this.inflightRequest$ = request$;
        return request$;
    }

    private setStatuses(statuses: PublicPageStatusMap): void {
        this.cachedStatuses = statuses;
        this._statuses.set(statuses);
        this._hasLoaded.set(true);
    }

    private defaultStatuses(): PublicPageStatusMap {
        return {
            home: true,
            about: true,
            partners: true,
            solutions: true,
            services: true,
            contact: true
        };
    }

    private normalizeResponse(response: unknown): PublicPageStatusMap {
        const statuses = this.defaultStatuses();
        const rows = this.extractRows(response);

        for (const row of rows) {
            if (!row || typeof row !== 'object') {
                continue;
            }

            const record = row as Record<string, unknown>;
            const candidateKeys = [
                record['key'],
                record['pageKey'],
                record['page'],
                record['pageName'],
                record['slug'],
                record['route'],
                record['path'],
                record['url']
            ];

            const resolvedKey = candidateKeys
                .map((value) => this.resolvePageKey(value))
                .find((value): value is PublicPageKey => value !== null);

            if (!resolvedKey) {
                continue;
            }

            statuses[resolvedKey] = this.resolveActive(record);
        }

        return statuses;
    }

    private extractRows(response: unknown): unknown[] {
        if (Array.isArray(response)) {
            return response;
        }

        if (!response || typeof response !== 'object') {
            return [];
        }

        const record = response as Record<string, unknown>;
        const nestedCandidates = ['data', 'items', 'pages', 'statuses', 'result'];
        for (const field of nestedCandidates) {
            const nested = record[field];
            if (Array.isArray(nested)) {
                return nested;
            }
            if (nested && typeof nested === 'object') {
                const nestedRecord = nested as Record<string, unknown>;
                if (Array.isArray(nestedRecord['items'])) return nestedRecord['items'] as unknown[];
                if (Array.isArray(nestedRecord['pages'])) return nestedRecord['pages'] as unknown[];
                if (Array.isArray(nestedRecord['statuses'])) return nestedRecord['statuses'] as unknown[];
            }
        }

        const directRows: unknown[] = [];
        for (const [key, value] of Object.entries(record)) {
            const resolvedKey = this.resolvePageKey(key);
            if (!resolvedKey) {
                continue;
            }
            directRows.push({ key, isActive: value });
        }
        return directRows;
    }

    private resolvePageKey(value: unknown): PublicPageKey | null {
        if (typeof value !== 'string') {
            return null;
        }

        const normalized = value.toLowerCase().replace(/[^a-z]/g, '');

        if (normalized === 'home') return 'home';
        if (normalized === 'about' || normalized === 'aboutus') return 'about';
        if (normalized === 'partners' || normalized === 'partner' || normalized === 'ourpartners') return 'partners';
        if (normalized === 'solutions' || normalized === 'solution') return 'solutions';
        if (normalized === 'services' || normalized === 'service') return 'services';
        if (normalized === 'contact' || normalized === 'contactus') return 'contact';

        return null;
    }

    private resolveActive(record: Record<string, unknown>): boolean {
        const candidates = [record['isActive'], record['active'], record['enabled'], record['status']];
        const value = candidates.find((candidate) => candidate !== undefined);

        if (typeof value === 'boolean') {
            return value;
        }

        if (typeof value === 'number') {
            return value !== 0;
        }

        if (typeof value === 'string') {
            const normalized = value.toLowerCase().trim();
            if (normalized === 'active' || normalized === 'enabled' || normalized === 'true' || normalized === '1') {
                return true;
            }
            if (normalized === 'inactive' || normalized === 'disabled' || normalized === 'false' || normalized === '0') {
                return false;
            }
        }

        return true;
    }
}
