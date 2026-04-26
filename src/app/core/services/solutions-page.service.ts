import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SolutionCardDto {
    id: number;
    titleEn: string;
    contentEn: string;
    titleAr: string;
    contentAr: string;
    imageUrl: string | null;
    displayOrder: number;
}

export interface SolutionsPageDto {
    isActive: boolean;
    introContentEn: string;
    introContentAr: string;
    heroImageUrl: string | null;
    cards: SolutionCardDto[];
}

@Injectable({ providedIn: 'root' })
export class SolutionsPageService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/solutions-page`;

    get(): Observable<SolutionsPageDto | null> {
        return this.http.get<SolutionsPageDto | null>(this.apiUrl);
    }

    save(dto: SolutionsPageDto): Observable<void> {
        return this.http.put<void>(this.apiUrl, dto);
    }
}
