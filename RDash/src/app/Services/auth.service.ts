import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { HttpClientService } from './http-client.service';
import { User, LoginRequest, LoginResponse } from '../user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';
  private readonly TOKEN_EXPIRES_AT = 'auth_token_expires_at';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getCurrentUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private httpClient: HttpClientService) {
    // ✅ Start polling for token expiry every 60 seconds
    this.startTokenExpiryCheck();
  }

  // --- Login / Logout ---
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.httpClient.post<LoginResponse>('/route/login', credentials).pipe(
      tap(response => {
        if (response.token && response.user) {
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 4); // 4-hour expiry

          this.setToken(response.token);
          this.setTokenExpiry(expiresAt);
          this.setCurrentUser(response.user);

          this.currentUserSubject.next(response.user);
          this.isAuthenticatedSubject.next(true);
        }
      })
    );
  }

  logout(): Observable<any> {
    return this.httpClient.post('/route/logout', {}).pipe(
      tap({
        next: () => this.clearAuthData(),
        error: () => this.clearAuthData() // Clear even if backend fails
      })
    );
  }

  // --- Token & User Methods ---
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private setTokenExpiry(date: Date): void {
    localStorage.setItem(this.TOKEN_EXPIRES_AT, date.toISOString());
  }

  private getTokenExpiry(): Date | null {
    const exp = localStorage.getItem(this.TOKEN_EXPIRES_AT);
    return exp ? new Date(exp) : null;
  }

  public hasValidToken(): boolean {
    const token = this.getToken();
    const expiresAt = this.getTokenExpiry();

    if (!token || !expiresAt) return false;

    return new Date() < expiresAt; // true if not expired
  }

  private setCurrentUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  public clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRES_AT);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
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
    return user ? ['Admin', 'Super Admin', 'Editor', 'Normal User'].includes(user.role) : false;
  }

  hasRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  getCurrentUserRole(): string | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  // ✅ New: Start polling for token expiry
  private startTokenExpiryCheck(): void {
    setInterval(() => {
      const isValid = this.hasValidToken();
      const wasAuthenticated = this.isAuthenticatedSubject.value;

      if (!isValid && wasAuthenticated) {
        console.log('Session expired: automatically logging out');
        this.clearAuthData();

        // Optional: Redirect to login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }, 60000); // Check every 60 seconds
  }
}

