import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ContactPageDto {
    isActive: boolean;
    introDescriptionEn: string;
    introDescriptionAr: string;
    phone: string;
    email: string;
    address: string;
    locationUrl: string;
    heroImageUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class ContactPageService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/contact-page`;

    get(): Observable<ContactPageDto | null> {
        return this.http.get<ContactPageDto | null>(this.apiUrl);
    }

    save(dto: ContactPageDto): Observable<void> {
        return this.http.put<void>(this.apiUrl, dto);
    }
}
