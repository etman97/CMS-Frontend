import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PartnersPageDto, PartnersPageService } from '../services/partners-page.service';

export const partnersPageResolver: ResolveFn<PartnersPageDto | null> = () => {
    const partnersPageService = inject(PartnersPageService);

    return partnersPageService.get().pipe(
        catchError(() => of(null))
    );
};
