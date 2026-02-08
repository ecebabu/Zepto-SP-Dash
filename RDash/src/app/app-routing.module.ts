import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './Services/guard/auth.guard';
import { AdminGuard } from './Services/guard/admin.guard';
import { RoleGuard } from './Services/guard/role.guard';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', loadChildren: () => import('./modules/login.module').then(m => m.LoginModule) },
  {
    path: 'dashboard',
    loadChildren: () => import('./modules/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'projects',
    loadChildren: () => import('./modules/projects.module').then(m => m.ProjectsModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Admin', 'Super Admin', 'Editor'] }
  },
  {
    path: 'tasks',
    loadChildren: () => import('./modules/task.module').then(m => m.TasksModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'users',
    loadChildren: () => import('./modules/users.module').then(m => m.UsersModule),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'comments',
    loadChildren: () => import('./modules/comment.module').then(m => m.CommentsModule),
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '/login' } // Changed from '/projects' to '/dashboard'
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
