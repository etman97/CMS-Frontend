import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HomePageDto, HomePageService } from '../services/home-page.service';

export const homePageResolver: ResolveFn<HomePageDto | null> = () => {
    const homePageService = inject(HomePageService);

    return homePageService.get().pipe(
        catchError(() => of(null))
    );
};
