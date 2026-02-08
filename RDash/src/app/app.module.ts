import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';


import { AuthInterceptor } from './Services/interceptors/auth.interceptor';
// Services
import { AuthService } from './Services/auth.service';
import { HttpClientService } from './Services/http-client.service';
import { DashboardService } from './Services/dashboard.service';
import { ProjectService } from './Services/project.service';
import { UserService } from './Services/user.service';

// Guards
import { AuthGuard } from './Services/guard/auth.guard';
import { AdminGuard } from './Services/guard/admin.guard';
import { RoleGuard } from './Services/guard/role.guard';
import { DashboardModule } from './modules/dashboard.module';
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    DashboardModule 
  ],
  providers: [
    // Services
    AuthService,
    HttpClientService,
    DashboardService,
    ProjectService,
    UserService,
    // Guards
    AuthGuard,
    AdminGuard,
    RoleGuard,
    // Interceptors
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

/*@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }*/
