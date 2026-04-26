import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PartnerDto {
    id: number;
    imageUrl: string;
    displayOrder: number;
}

export interface PartnersPageDto {
    isActive: boolean;
    introTitleEn: string;
    introDescriptionEn: string;
    introTitleAr: string;
    introDescriptionAr: string;
    heroImageUrl: string | null;
    partners: PartnerDto[];
}

@Injectable({ providedIn: 'root' })
export class PartnersPageService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/partners-page`;

    get(): Observable<PartnersPageDto | null> {
        return this.http.get<PartnersPageDto | null>(this.apiUrl);
    }

    save(dto: PartnersPageDto): Observable<void> {
        return this.http.put<void>(this.apiUrl, dto);
    }
}
