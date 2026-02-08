import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { Observable } from 'rxjs';

export interface StatusMedia {
  id: number;
  original_name: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  url: string;
  uploaded_at: string;
}

@Injectable({ providedIn: 'root' })
export class StatusMediaService {
  constructor(private http: HttpClientService) { }

  getMedia(taskId: number, fieldName: string): Observable<{ media: StatusMedia[] }> {
    return this.http.get<{ media: StatusMedia[] }>('/route/status-media', {
      task_id: taskId,
      field_name: fieldName
    });
  }

  uploadMedia(taskId: number, fieldName: string, files: FileList): Observable<any> {
    const formData = new FormData();
    formData.append('task_id', taskId.toString());
    formData.append('field_name', fieldName);
    for (let i = 0; i < files.length; i++) {
      formData.append('media[]', files[i]);
    }
    return this.http.postFormData('/route/upload-status-media', formData);
  }

  getMediaUrl(filePath: string): string {
    if (!filePath) return '';
    const fileName = filePath.split('/').pop() || '';
    return `https://aliceblue-jaguar-943425.hostingersite.com/uploads/${fileName}`;
  }

  isImage(fileType: string): boolean {
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType.toLowerCase());
  }

  isVideo(fileType: string): boolean {
    return ['mp4', 'mov', 'avi', 'webm'].includes(fileType.toLowerCase());
  }
}
