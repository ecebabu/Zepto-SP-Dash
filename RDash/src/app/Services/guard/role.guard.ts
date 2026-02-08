import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {

    const allowedRoles = route.data['roles'] as string[];

    if (this.authService.isAuthenticated() && this.authService.hasRole(allowedRoles)) {
      return true;
    }

    // Redirect to dashboard or unauthorized page
    this.router.navigate(['/dashboard']);
    return false;
  }
}
