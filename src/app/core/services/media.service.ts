import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UploadResponse {
    url: string;
}

@Injectable({ providedIn: 'root' })
export class MediaService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/media`;

    upload(file: File, folder = 'cms'): Observable<UploadResponse> {
        const form = new FormData();
        form.append('file', file);
        return this.http.post<UploadResponse>(`${this.apiUrl}/upload?folder=${folder}`, form);
    }

    delete(url: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}?url=${encodeURIComponent(url)}`);
    }
}
