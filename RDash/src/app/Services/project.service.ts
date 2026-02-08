// project.service.ts - Updated with proper document handling
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from './http-client.service';
import {
  ProjectsResponse,
  Project,
  CreateProjectRequest,
  Task,
  StateCityResponse,
  ProjectDocument,
  StateCityRow
} from '../user.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private baseUrl = 'https://aliceblue-jaguar-943425.hostingersite.com'; // Your server URL

  constructor(private httpClient: HttpClientService) { }

  getProjects(): Observable<ProjectsResponse> {
    return this.httpClient.get<ProjectsResponse>('/route/projects');
  }

  getProject(projectId: number): Observable<{ project: Project }> {
    return this.httpClient.get<{ project: Project }>(`/route/projects/${projectId}`);
  }

  createProject(projectData: CreateProjectRequest): Observable<{ project: Project }> {
    return this.httpClient.post<{ project: Project }>('/route/projects', projectData);
  }

  updateProject(projectId: number, projectData: Partial<CreateProjectRequest>): Observable<{ project: Project }> {
    return this.httpClient.put<{ project: Project }>(`/route/projects/${projectId}`, projectData);
  }

  deleteProject(projectId: number): Observable<{ message: string }> {
    return this.httpClient.delete<{ message: string }>(`/route/projects/${projectId}`);
  }

  assignUserToProject(projectId: number, userData: { user_id: number; role?: string }): Observable<{ message: string }> {
    return this.httpClient.post<{ message: string }>(`/route/projects/${projectId}/assign-user`, userData);
  }

  getProjectTasks(projectId: number): Observable<{ tasks: Task[] }> {
    return this.httpClient.get<{ tasks: Task[] }>(`/route/projects/${projectId}/tasks`);
  }

  removeUserFromProject(projectId: number, userId: number): Observable<{ message: string }> {
    return this.httpClient.delete<{ message: string }>(`/route/projects/${projectId}/users/${userId}`);
  }



  // FIXED: Upload document for existing project
  uploadProjectDocument(projectId: number, file: File): Observable<{ document: ProjectDocument }> {
    const formData = new FormData();
    formData.append('document', file);

    return this.httpClient.post<{ document: ProjectDocument }>(
      `/route/upload-document?project_id=${projectId}`,
      formData
    );
  }

  // NEW: Get project documents
  getProjectDocuments(projectId: number): Observable<{ documents: ProjectDocument[] }> {
    return this.httpClient.get<{ documents: ProjectDocument[] }>(`/route/projects/${projectId}/documents`);
  }

  // NEW: Delete project document
  deleteProjectDocument(documentId: number): Observable<{ message: string }> {
    return this.httpClient.delete<{ message: string }>(`/route/documents/${documentId}`);
  }

  // FIXED: Get proper document URL
  getDocumentUrl(filePath: string): string {
    if (!filePath) return '';

    // If filePath is already a full URL, return as-is
    if (filePath.startsWith('http')) {
      return filePath;
    }

    // Extract filename from path
    const fileName = filePath.split('/').pop() || filePath;
    return `${this.baseUrl}/uploads/${fileName}`;
  }

  // Helper method to get file extension
  getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  // Helper method to check if file is document
  isDocumentFile(fileType: string): boolean {
    if (!fileType) return false;
    return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(fileType.toLowerCase());
  }

  // Helper method to check if file is image
  isImageFile(fileType: string): boolean {
    if (!fileType) return false;
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(fileType.toLowerCase());
  }

  // Helper method to get file type icon
  getFileTypeIcon(fileType: string): string {
    const type = fileType.toLowerCase();
    switch (type) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'ppt':
      case 'pptx': return '📊';
      case 'txt': return '📄';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp': return '🖼️';
      default: return '📎';
    }
  }

  // State City Data
  // project.service.ts

  // CSV CRUD operations
  updateStateCityData(data: StateCityRow[]): Observable<{ message: string }> {
   
    return this.httpClient.post<{ message: string }>('/route/state-city-data/update', {
      data: data
    });
  }
  exportStateCityCSV(): Observable<Blob> {
    return this.httpClient.get('/route/state-city-data/export', {
      responseType: 'blob'
    });
  }
  getStateCityData(): Observable<StateCityResponse> {
    return this.httpClient.get<StateCityResponse>('/route/state-city-data');
  }
  // Optional: Add individual row operations
  addStateCityRow(row: StateCityRow): Observable<{ message: string }> {
    return this.httpClient.post<{ message: string }>('/route/state-city-data/add', row);
  }

  deleteStateCityRow(index: number): Observable<{ message: string }> {
    return this.httpClient.delete<{ message: string }>(`/route/state-city-data/${index}`);
  }
  getStateCityDataForEditing(): Observable<{ data: StateCityRow[] }> {
    return this.httpClient.get<{ data: StateCityRow[] }>('/route/state-city-data/raw');
  }

}
