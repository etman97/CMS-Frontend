import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ContactPageDto, ContactPageService } from '../services/contact-page.service';

export const contactPageResolver: ResolveFn<ContactPageDto | null> = () => {
    const contactPageService = inject(ContactPageService);

    return contactPageService.get().pipe(
        catchError(() => of(null))
    );
};
