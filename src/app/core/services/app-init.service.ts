import { Injectable, inject, signal } from '@angular/core';
import { forkJoin, timer, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HomePageService } from './home-page.service';
import { AboutPageService } from './about-page.service';
import { ContactPageService } from './contact-page.service';
import { PageStatusService } from './page-status.service';

@Injectable({ providedIn: 'root' })
export class AppInitService {
    private readonly homeService = inject(HomePageService);
    private readonly aboutService = inject(AboutPageService);
    private readonly contactService = inject(ContactPageService);
    private readonly pageStatusService = inject(PageStatusService);

    private completedSteps = 0;
    private readonly totalSteps = 4;
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

        const home$ = this.homeService.get().pipe(
            tap(() => this.onStepComplete('Home content loaded')),
            catchError(() => { this.onStepComplete('Home content loaded'); return of(null); })
        );

        const about$ = this.aboutService.get().pipe(
            tap(() => this.onStepComplete('Team & about page ready')),
            catchError(() => { this.onStepComplete('Team & about page ready'); return of(null); })
        );

        const contact$ = this.contactService.get().pipe(
            tap(() => this.onStepComplete('Contact information loaded')),
            catchError(() => { this.onStepComplete('Contact information loaded'); return of(null); })
        );

        const status$ = this.pageStatusService.getStatuses().pipe(
            tap(() => this.onStepComplete('Page configuration ready')),
            catchError(() => { this.onStepComplete('Page configuration ready'); return of(null); })
        );

        // Minimum 2.4s display time so the experience always feels intentional
        forkJoin([home$, about$, contact$, status$, timer(2400)]).subscribe({
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
