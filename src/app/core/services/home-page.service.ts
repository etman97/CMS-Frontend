import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface HomePageDto {
    isActive: boolean;
    heroTitleEn: string;
    heroContentEn: string;
    primaryButtonTextEn: string;
    secondaryButtonTextEn: string;
    heroTitleAr: string;
    heroContentAr: string;
    primaryButtonTextAr: string;
    secondaryButtonTextAr: string;
    heroImageUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class HomePageService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/home-page`;

    get(): Observable<HomePageDto | null> {
        return this.http.get<HomePageDto | null>(this.apiUrl);
    }

    save(dto: HomePageDto): Observable<void> {
        return this.http.put<void>(this.apiUrl, dto);
    }
}
