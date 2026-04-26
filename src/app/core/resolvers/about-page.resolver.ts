import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AboutPageDto, AboutPageService } from '../services/about-page.service';

export const aboutPageResolver: ResolveFn<AboutPageDto | null> = () => {
    const aboutPageService = inject(AboutPageService);

    return aboutPageService.get().pipe(
        catchError(() => of(null))
    );
};
