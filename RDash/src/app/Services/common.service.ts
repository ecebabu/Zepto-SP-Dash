/*// services/http-client.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class HttpClientService {
  private baseUrl = 'https://yourdomain.com'; // Replace with your actual API base URL

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const token = this.authService.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private getFormHeaders(): HttpHeaders {
    let headers = new HttpHeaders();

    const token = this.authService.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    return throwError(error);
  }

  get<T>(endpoint: string, params?: any): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return this.http.get<T>(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders(),
      params: httpParams
    }).pipe(
      catchError(this.handleError)
    );
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  postFormData<T>(endpoint: string, formData: FormData): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, formData, {
      headers: this.getFormHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }
}

// services/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { HttpClientService } from './http-client.service';
import { User, LoginRequest, LoginResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getCurrentUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private httpClient: HttpClientService) { }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.httpClient.post<LoginResponse>('/api/login', credentials).pipe(
      tap(response => {
        if (response.token && response.user) {
          this.setToken(response.token);
          this.setCurrentUser(response.user);
          this.currentUserSubject.next(response.user);
          this.isAuthenticatedSubject.next(true);
        }
      })
    );
  }

  logout(): Observable<any> {
    return this.httpClient.post('/api/logout', {}).pipe(
      tap(() => {
        this.clearAuthData();
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return this.hasValidToken();
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user ? ['Admin', 'Super Admin'].includes(user.role) : false;
  }

  isEditor(): boolean {
    const user = this.getCurrentUser();
    return user ? ['Admin', 'Super Admin', 'Editor'].includes(user.role) : false;
  }

  hasRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private setCurrentUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    return !!token; // Add token expiry validation if needed
  }

  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }
}

// services/user.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from './http-client.service';
import { User, CreateUserRequest, UpdateUserRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private httpClient: HttpClientService) { }

  getUsers(): Observable<{ users: User[] }> {
    return this.httpClient.get<{ users: User[] }>('/api/users');
  }

  getUser(userId: number): Observable<{ user: User }> {
    return this.httpClient.get<{ user: User }>(`/api/users/${userId}`);
  }

  createUser(userData: CreateUserRequest): Observable<{ user: User }> {
    return this.httpClient.post<{ user: User }>('/api/users', userData);
  }

  updateUser(userId: number, userData: UpdateUserRequest): Observable<{ user: User }> {
    return this.httpClient.put<{ user: User }>(`/api/users/${userId}`, userData);
  }

  deleteUser(userId: number): Observable<{ message: string }> {
    return this.httpClient.delete<{ message: string }>(`/api/users/${userId}`);
  }
}

// services/project.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from './http-client.service';
import { Project, ProjectsResponse, CreateProjectRequest } from '../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  constructor(private httpClient: HttpClientService) { }

  getProjects(): Observable<ProjectsResponse> {
    return this.httpClient.get<ProjectsResponse>('/api/projects');
  }

  getProject(projectId: number): Observable<{ project: Project }> {
    return this.httpClient.get<{ project: Project }>(`/api/projects/${projectId}`);
  }

  createProject(projectData: CreateProjectRequest): Observable<{ project: Project }> {
    return this.httpClient.post<{ project: Project }>('/api/projects', projectData);
  }

  updateProject(projectId: number, projectData: Partial<CreateProjectRequest>): Observable<{ project: Project }> {
    return this.httpClient.put<{ project: Project }>(`/api/projects/${projectId}`, projectData);
  }

  deleteProject(projectId: number): Observable<{ message: string }> {
    return this.httpClient.delete<{ message: string }>(`/api/projects/${projectId}`);
  }

  assignUserToProject(projectId: number, userData: { user_id: number; role?: string }): Observable<{ message: string }> {
    return this.httpClient.post<{ message: string }>(`/api/projects/${projectId}/assign-user`, userData);
  }

  getProjectTasks(projectId: number): Observable<{ tasks: Task[] }> {
    return this.httpClient.get<{ tasks: Task[] }>(`/api/projects/${projectId}/tasks`);
  }
}

// services/task.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from './http-client.service';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  constructor(private httpClient: HttpClientService) { }

  getTasks(): Observable<{ tasks: Task[] }> {
    return this.httpClient.get<{ tasks: Task[] }>('/api/tasks');
  }

  getTask(taskId: number): Observable<{ task: Task }> {
    return this.httpClient.get<{ task: Task }>(`/api/tasks/${taskId}`);
  }

  createTask(taskData: CreateTaskRequest): Observable<{ task: Task }> {
    return this.httpClient.post<{ task: Task }>('/api/tasks', taskData);
  }

  updateTask(taskId: number, taskData: UpdateTaskRequest): Observable<{ task: Task }> {
    return this.httpClient.put<{ task: Task }>(`/api/tasks/${taskId}`, taskData);
  }

  deleteTask(taskId: number): Observable<{ message: string }> {
    return this.httpClient.delete<{ message: string }>(`/api/tasks/${taskId}`);
  }

  getTaskComments(taskId: number): Observable<{ comments: Comment[] }> {
    return this.httpClient.get<{ comments: Comment[] }>(`/api/tasks/${taskId}/comments`);
  }
}

// services/comment.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from './http-client.service';
import { Comment, CreateCommentRequest, MediaFile } from '../models/comment.model';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  constructor(private httpClient: HttpClientService) { }

  getComments(taskId: number): Observable<{ comments: Comment[] }> {
    return this.httpClient.get<{ comments: Comment[] }>('/api/comments', { task_id: taskId });
  }

  createComment(commentData: CreateCommentRequest): Observable<{ comment: Comment }> {
    return this.httpClient.post<{ comment: Comment }>('/api/comments', commentData);
  }

  uploadMedia(commentId: number, files: FileList): Observable<{ uploaded_files: any[], errors?: string[] }> {
    const formData = new FormData();
    formData.append('comment_id', commentId.toString());

    for (let i = 0; i < files.length; i++) {
      formData.append('media[]', files[i]);
    }

    return this.httpClient.postFormData<{ uploaded_files: any[], errors?: string[] }>('/api/upload', formData);
  }
}

// services/dashboard.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from './http-client.service';
import { DashboardData } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private httpClient: HttpClientService) { }

  getDashboardData(): Observable<{ dashboard: DashboardData }> {
    return this.httpClient.get<{ dashboard: DashboardData }>('/api/dashboard');
  }
}
*/
