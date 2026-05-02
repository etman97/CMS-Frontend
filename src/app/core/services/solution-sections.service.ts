import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ImageChoice = 'OneImage' | 'TwoImages';

export interface SolutionSectionDto {
    id: number;
    solutionCardId: number;
    titleEn: string;
    paragraphEn: string;
    titleAr: string;
    paragraphAr: string;
    imageChoice: ImageChoice;
    imageUrl1: string | null;
    imageUrl2: string | null;
    displayOrder: number;
}

export interface UpsertSolutionSectionItem {
    id: number;
    titleEn: string;
    paragraphEn: string;
    titleAr: string;
    paragraphAr: string;
    imageChoice: ImageChoice;
    imageUrl1: string | null;
    imageUrl2: string | null;
    displayOrder: number;
}

@Injectable({ providedIn: 'root' })
export class SolutionSectionsService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/solution-sections`;

    getByCardId(cardId: number): Observable<SolutionSectionDto[]> {
        return this.http.get<SolutionSectionDto[]>(`${this.apiUrl}/${cardId}`);
    }

    save(cardId: number, items: UpsertSolutionSectionItem[]): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${cardId}`, items);
    }
}
