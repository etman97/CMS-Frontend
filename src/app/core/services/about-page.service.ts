import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TeamMemberDto {
    id: number;
    nameEn: string;
    jobTitleEn: string;
    briefEn: string;
    nameAr: string;
    jobTitleAr: string;
    briefAr: string;
    imageUrl: string | null;
    displayOrder: number;
}

export interface AboutPageDto {
    isActive: boolean;
    aboutUsContentEn: string;
    subContentEn: string;
    whyUsContentEn: string;
    numbersSubtitleEn: string;
    missionContentEn: string;
    visionContentEn: string;
    leadershipContentEn: string;
    aboutUsContentAr: string;
    whyUsContentAr: string;
    missionContentAr: string;
    visionContentAr: string;
    leadershipContentAr: string;
    numberOfEmployees: number;
    numberOfProducts: number;
    numberOfClients: number;
    numberOfPartners: number;
    heroImageUrl: string | null;
    missionImageUrl: string | null;
    visionImageUrl: string | null;
    leadershipImageUrl: string | null;
    teamMembers: TeamMemberDto[];
}

@Injectable({ providedIn: 'root' })
export class AboutPageService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/about-page`;

    get(): Observable<AboutPageDto | null> {
        return this.http.get<AboutPageDto | null>(this.apiUrl);
    }

    save(dto: AboutPageDto): Observable<void> {
        return this.http.put<void>(this.apiUrl, dto);
    }
}
