import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from './http-client.service';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../user.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  constructor(private httpClient: HttpClientService) { }

  getTasks(): Observable<{ tasks: Task[] }> {
    return this.httpClient.get<{ tasks: Task[] }>('/route/tasks');
  }

  getTask(taskId: number): Observable<{ task: Task }> {
    return this.httpClient.get<{ task: Task }>(`/route/tasks/${taskId}`);
  }

  createTask(taskData: CreateTaskRequest): Observable<{ task: Task }> {
    return this.httpClient.post<{ task: Task }>('/route/tasks', taskData);
  }

  updateTask(taskId: number, taskData: UpdateTaskRequest): Observable<{ task: Task }> {
    return this.httpClient.put<{ task: Task }>(`/route/tasks/${taskId}`, taskData);
  }

  deleteTask(taskId: number): Observable<{ message: string }> {
    return this.httpClient.delete<{ message: string }>(`/route/tasks/${taskId}`);
  }

  getTaskComments(taskId: number): Observable<{ comments: Comment[] }> {
    return this.httpClient.get<{ comments: Comment[] }>(`/route/tasks/${taskId}/comments`);
  }

  // Status Media
  uploadFieldMedia(taskId: number, fieldName: string, files: FileList): Observable<{ uploaded_files: any[], errors?: string[] }> {
    const formData = new FormData();
    formData.append('task_id', taskId.toString());
    formData.append('field_name', fieldName);

    for (let i = 0; i < files.length; i++) {
      formData.append('media[]', files[i]);
    }

    return this.httpClient.postFormData<{ uploaded_files: any[], errors?: string[] }>('/route/upload-field-media', formData);
  }

  getTaskFieldMedia(taskId: number): Observable<{ field_media: any[] }> {
    return this.httpClient.get<{ field_media: any[] }>(`/route/tasks/${taskId}/field-media`);
  }

  deleteFieldMedia(mediaId: number): Observable<{ message: string }> {
    return this.httpClient.delete<{ message: string }>(`/route/field-media/${mediaId}`);
  }

  // Helper method to get media URL for field media
  getFieldMediaUrl(filePath: string): string {
    if (!filePath) return '';
    const fileName = filePath.split('/').pop() || filePath;
    return `http://localhost/uploads/${fileName}`;
  }
}
