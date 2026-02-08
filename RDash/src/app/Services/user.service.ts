import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from './http-client.service';
import { User, CreateUserRequest, UpdateUserRequest } from '../user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private httpClient: HttpClientService) { }

  getUsers(): Observable<{ users: User[] }> {
    return this.httpClient.get<{ users: User[] }>('/route/users');
  }

  getUser(userId: number): Observable<{ user: User }> {
    return this.httpClient.get<{ user: User }>(`/route/users/${userId}`);
  }

  createUser(userData: CreateUserRequest): Observable<{ user: User }> {
    return this.httpClient.post<{ user: User }>('/route/users', userData);
  }

  updateUser(userId: number, userData: UpdateUserRequest): Observable<{ user: User }> {
    return this.httpClient.put<{ user: User }>(`/route/users/${userId}`, userData);
  }

  deleteUser(userId: number): Observable<{ message: string }> {
    return this.httpClient.delete<{ message: string }>(`/route/users/${userId}`);
  }

}
