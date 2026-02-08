import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { CommentsComponent } from '../components/comment/comments.component';

const routes: Routes = [
  { path: '', component: CommentsComponent }
];

@NgModule({
  declarations: [
    CommentsComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class CommentsModule { }
