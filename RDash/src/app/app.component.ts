import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from './Services/auth.service';

@Component({
  selector: 'app-root',

  template: `
    <div class="app-container">
      <!-- Show router outlet for login page -->
      <router-outlet *ngIf="isLoginPage"></router-outlet>
      
      <!-- Show dashboard layout for authenticated pages -->
      <app-dashboard *ngIf="!isLoginPage && isAuthenticated"></app-dashboard>
      
      <!-- Show login redirect for unauthenticated users -->
      <router-outlet *ngIf="!isLoginPage && !isAuthenticated"></router-outlet>
    </div>
  `,
  styles: [`
    .app-container {
      height: 100vh;
      overflow: hidden;
    }
  `]
})
export class AppComponent implements OnInit {
  isLoginPage = false;
  isAuthenticated = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Check authentication status
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
    });

    // Check if current route is login page
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isLoginPage = event.url === '/login';
      }
    });
  }
}


/*import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'RDash';
}
*/
