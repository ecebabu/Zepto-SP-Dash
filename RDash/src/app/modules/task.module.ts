import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { TasksComponent } from '../components/my-tasks/my-tasks.component';

const routes: Routes = [
  { path: '', component: TasksComponent }
];

@NgModule({
  declarations: [TasksComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    // All services are already provided in root, so no need to provide them here
  ]
})
export class TasksModule { }
