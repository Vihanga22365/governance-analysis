import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfigService } from './api-config.service';

@Injectable({
  providedIn: 'root',
})
export class DocumentUploadService {
  constructor(private http: HttpClient, private apiConfig: ApiConfigService) {}

  uploadDocuments(sessionId: string, files: File[]): Observable<any> {
    const url = this.apiConfig.getDocumentUploadUrl(sessionId);
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file, file.name);
    });

    return this.http.post(url, formData);
  }
}
