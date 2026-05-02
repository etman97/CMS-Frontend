import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SolutionsPageDto, SolutionsPageService } from '../services/solutions-page.service';

export const solutionsPageResolver: ResolveFn<SolutionsPageDto | null> = () => {
    const solutionsPageService = inject(SolutionsPageService);

    return solutionsPageService.get().pipe(
        catchError(() => of(null))
    );
};
