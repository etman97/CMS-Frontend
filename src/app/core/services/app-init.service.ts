import { Injectable, inject, signal } from '@angular/core';
import { forkJoin, timer, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { HomePageService } from './home-page.service';
import { AboutPageService } from './about-page.service';
import { ContactPageService } from './contact-page.service';
import { PageStatusService } from './page-status.service';
import { PartnersPageService } from './partners-page.service';
import { ServicesPageService } from './services-page.service';
import { SolutionsPageService } from './solutions-page.service';
import { SolutionSectionsService } from './solution-sections.service';

@Injectable({ providedIn: 'root' })
export class AppInitService {
    private readonly homeService = inject(HomePageService);
    private readonly aboutService = inject(AboutPageService);
    private readonly contactService = inject(ContactPageService);
    private readonly pageStatusService = inject(PageStatusService);
    private readonly partnersService = inject(PartnersPageService);
    private readonly servicesService = inject(ServicesPageService);
    private readonly solutionsService = inject(SolutionsPageService);
    private readonly solutionSectionsService = inject(SolutionSectionsService);

    private completedSteps = 0;
    private readonly totalSteps = 8;
    private initialized = false;

    private readonly _progress = signal(5);
    private readonly _isDone = signal(false);
    private readonly _isFading = signal(false);
    private readonly _statusText = signal('Connecting to servers...');

    readonly progress = this._progress.asReadonly();
    readonly isDone = this._isDone.asReadonly();
    readonly isFading = this._isFading.asReadonly();
    readonly statusText = this._statusText.asReadonly();

    private onStepComplete(text: string): void {
        this.completedSteps++;
        const progress = 5 + Math.round((this.completedSteps / this.totalSteps) * 85);
        this._progress.set(progress);
        this._statusText.set(text);
    }

    init(): void {
        if (this.initialized) return;
        this.initialized = true;

        const home$ = this.homeService.load().pipe(
            tap(() => this.onStepComplete('Home content loaded')),
            catchError(() => { this.onStepComplete('Home content loaded'); return of(null); })
        );

        const about$ = this.aboutService.load().pipe(
            tap(() => this.onStepComplete('Team & about page ready')),
            catchError(() => { this.onStepComplete('Team & about page ready'); return of(null); })
        );

        const contact$ = this.contactService.load().pipe(
            tap(() => this.onStepComplete('Contact information loaded')),
            catchError(() => { this.onStepComplete('Contact information loaded'); return of(null); })
        );

        const status$ = this.pageStatusService.load().pipe(
            tap(() => this.onStepComplete('Page configuration ready')),
            catchError(() => { this.onStepComplete('Page configuration ready'); return of(null); })
        );

        const partners$ = this.partnersService.load().pipe(
            tap(() => this.onStepComplete('Partners loaded')),
            catchError(() => { this.onStepComplete('Partners loaded'); return of(null); })
        );

        const services$ = this.servicesService.load().pipe(
            tap(() => this.onStepComplete('Services loaded')),
            catchError(() => { this.onStepComplete('Services loaded'); return of(null); })
        );

        const solutions$ = this.solutionsService.load().pipe(
            tap(() => this.onStepComplete('Solutions loaded')),
            catchError(() => { this.onStepComplete('Solutions loaded'); return of(null); })
        );

        const solutionSections$ = solutions$.pipe(
            switchMap(() => {
                const data = this.solutionsService.data();
                const cardIds = data?.solutionCards.map((card) => card.id) ?? [];
                if (!cardIds.length) {
                    this.onStepComplete('Solution details loaded');
                    return of([]);
                }

                return this.solutionSectionsService.prefetchByCardIds(cardIds).pipe(
                    tap(() => this.onStepComplete('Solution details loaded')),
                    catchError(() => { this.onStepComplete('Solution details loaded'); return of([]); })
                );
            })
        );

        // Minimum 2.4s display time so the experience always feels intentional
        forkJoin([home$, about$, contact$, status$, partners$, services$, solutionSections$, timer(2400)]).subscribe({
            next: () => this.finish(),
            error: () => this.finish()
        });
    }

    private finish(): void {
        this._progress.set(100);
        this._statusText.set('Welcome!');
        setTimeout(() => {
            this._isFading.set(true);
            setTimeout(() => this._isDone.set(true), 750);
        }, 350);
    }
}
