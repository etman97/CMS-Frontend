import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ServiceSectionDto {
    id: number;
    titleEn: string;
    descriptionEn: string;
    titleAr: string;
    descriptionAr: string;
    imageUrl: string | null;
    displayOrder: number;
}

export interface ServicesPageDto {
    isActive: boolean;
    introTitleEn: string;
    introDescriptionEn: string;
    introTitleAr: string;
    introDescriptionAr: string;
    heroImageUrl: string | null;
    sections: ServiceSectionDto[];
}

@Injectable({ providedIn: 'root' })
export class ServicesPageService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/services-page`;

    get(): Observable<ServicesPageDto | null> {
        return this.http.get<ServicesPageDto | null>(this.apiUrl);
    }

    save(dto: ServicesPageDto): Observable<void> {
        return this.http.put<void>(this.apiUrl, dto);
    }
}
