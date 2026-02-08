// comment.service.ts - Updated Version
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from './http-client.service';
import { Comment, CreateCommentRequest, MediaFile } from '../user.model';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  constructor(private httpClient: HttpClientService) { }

  getComments(taskId: number): Observable<{ comments: Comment[] }> {
    return this.httpClient.get<{ comments: Comment[] }>('/route/comments', { task_id: taskId });
  }

  createComment(commentData: CreateCommentRequest): Observable<{ comment: Comment }> {
    return this.httpClient.post<{ comment: Comment }>('/route/comments', commentData);
  }
  uploadMedia(commentId: number, files: FileList): Observable<{ uploaded_files: any[], errors?: string[] }> {
    const formData = new FormData();
    formData.append('comment_id', commentId.toString());

    for (let i = 0; i < files.length; i++) {
      formData.append('media[]', files[i]);
    }

    return this.httpClient.postFormData<{ uploaded_files: any[], errors?: string[] }>('/route/upload', formData);
  }

  // New method to get all comments across all tasks
  getAllComments(): Observable<{ comments: Comment[] }> {
    return this.httpClient.get<{ comments: Comment[] }>('/route/comments/all');
  }

  // Method to get comments for multiple tasks (for project attachments)
  getCommentsForTasks(taskIds: number[]): Observable<{ comments: Comment[] }> {
    return this.httpClient.post<{ comments: Comment[] }>('/route/comments/multiple', { task_ids: taskIds });
  }

 
  // Helper method to get media URL
  getMediaUrl(filePath: string): string {
    if (!filePath) return '';
    const fileName = filePath.split('/').pop() || filePath;
    return `https://aliceblue-jaguar-943425.hostingersite.com/uploads/${fileName}`;
  }

  // Helper method to check if file is image
  isImageFile(fileType: string): boolean {
    if (!fileType) return false;
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(fileType.toLowerCase());
  }

  // Helper method to check if file is video
  isVideoFile(fileType: string): boolean {
    if (!fileType) return false;
    return ['mp4', 'mov', 'avi', 'webm', 'mkv', 'wmv', 'flv'].includes(fileType.toLowerCase());
  }

  // Helper method to format file size
  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  // Add a new method for project document uploads
  uploadProjectDocument(projectId: number, files: FileList): Observable<{ uploaded_files: any[], errors?: string[] }> {
    const formData = new FormData();
    formData.append('target_type', 'project_document');
    formData.append('project_id', projectId.toString());

    for (let i = 0; i < files.length; i++) {
      formData.append('media[]', files[i]);
    }

    return this.httpClient.postFormData<{ uploaded_files: any[], errors?: string[] }>('/route/upload', formData);
  }

  // status media

}

