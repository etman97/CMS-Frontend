import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ServicesPageDto, ServicesPageService } from '../services/services-page.service';

export const servicesPageResolver: ResolveFn<ServicesPageDto | null> = () => {
    const servicesPageService = inject(ServicesPageService);

    return servicesPageService.get().pipe(
        catchError(() => of(null))
    );
};
