// comments.component.ts - Fixed Version
import { Component, OnInit } from '@angular/core';
import { CommentService } from '../../Services/comment.service';
import { ProjectService } from '../../Services/project.service';
import { TaskService } from '../../Services/task.service';
import { UserService } from '../../Services/user.service';
import { Comment, Project, Task, User } from '../../user.model';
import { forkJoin, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

interface CommentWithDetails extends Comment {
  project?: Project;
  task?: Task;
  user?: User;
}

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.css']
})
export class CommentsComponent implements OnInit {
  comments: CommentWithDetails[] = [];
  loading = true;
  error = '';
  selectedMedia: any = null;
  showMediaModal = false;

  constructor(
    private commentService: CommentService,
    private projectService: ProjectService,
    private taskService: TaskService,
    private userService: UserService
  ) { }

  ngOnInit() {
    this.loadAllComments();
  }

  loadAllComments() {
    this.loading = true;
    this.error = '';

    // Get all tasks first
    this.taskService.getTasks().subscribe({
      next: (response) => {
        const tasks = response.tasks || [];

        if (tasks.length === 0) {
          this.comments = [];
          this.loading = false;
          return;
        }

        // Get comments for each task
        const commentRequests: Observable<{ comments: Comment[] }>[] = tasks.map(task =>
          this.commentService.getComments(task.id).pipe(
            catchError(error => {
              console.error(`Error loading comments for task ${task.id}:`, error);
              return of({ comments: [] });
            })
          )
        );

        forkJoin(commentRequests).subscribe({
          next: (commentResponses) => {
            const allComments: CommentWithDetails[] = [];

            commentResponses.forEach((response, index) => {
              const task = tasks[index];
              if (response.comments && Array.isArray(response.comments)) {
                response.comments.forEach(comment => {
                  allComments.push({
                    ...comment,
                    task: task,
                    media_files: comment.media_files || []
                  });
                });
              }
            });

            if (allComments.length === 0) {
              this.comments = [];
              this.loading = false;
              return;
            }

            this.enrichCommentsWithDetails(allComments);
          },
          error: (error) => {
            console.error('Error loading comments:', error);
            this.error = 'Failed to load comments';
            this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.error = 'Failed to load tasks';
        this.loading = false;
      }
    });
  }

  enrichCommentsWithDetails(comments: CommentWithDetails[]) {
    const projectIds = [...new Set(comments.map(c => c.task?.project_id).filter(Boolean))];
    const userIds = [...new Set(comments.map(c => c.user_id))];

    const requests: Observable<any>[] = [];

    // Add project requests
    projectIds.forEach(id => {
      requests.push(
        this.projectService.getProject(id!).pipe(
          map(response => ({ type: 'project', data: response.project })),
          catchError(error => {
            console.error(`Error loading project ${id}:`, error);
            return of({ type: 'project', data: null });
          })
        )
      );
    });

    // Add user requests
    userIds.forEach(id => {
      requests.push(
        this.userService.getUser(id).pipe(
          map(response => ({ type: 'user', data: response.user })),
          catchError(error => {
            console.error(`Error loading user ${id}:`, error);
            return of({ type: 'user', data: null });
          })
        )
      );
    });

    if (requests.length === 0) {
      this.comments = this.sortComments(comments);
      this.loading = false;
      return;
    }

    forkJoin(requests).subscribe({
      next: (responses) => {
        const projects = responses.filter(r => r.type === 'project' && r.data).map(r => r.data);
        const users = responses.filter(r => r.type === 'user' && r.data).map(r => r.data);

        comments.forEach(comment => {
          comment.project = projects.find(p => p.id === comment.task?.project_id);
          comment.user = users.find(u => u.id === comment.user_id);
        });

        this.comments = this.sortComments(comments);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error enriching comments:', error);
        // Still show comments even if we couldn't get all details
        this.comments = this.sortComments(comments);
        this.loading = false;
      }
    });
  }

  private sortComments(comments: CommentWithDetails[]): CommentWithDetails[] {
    return comments.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  openMediaModal(media: any) {
    this.selectedMedia = media;
    this.showMediaModal = true;
  }

  closeMediaModal() {
    this.showMediaModal = false;
    this.selectedMedia = null;
  }

  isImage(fileType: string): boolean {
    if (!fileType) return false;
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType.toLowerCase());
  }

  isVideo(fileType: string): boolean {
    if (!fileType) return false;
    return ['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(fileType.toLowerCase());
  }

  getMediaUrl(filePath: string): string {
    if (!filePath) return '';
    // Extract filename from full path and create web accessible URL
    const fileName = filePath.split('/').pop() || filePath;
    return `C:\\xampp\\htdocs\\uploads\\${fileName}`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Unknown Date';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  }

  getFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getRoleClass(role?: string): string {
    if (!role) return 'role-unknown';
    return 'role-' + role.toLowerCase().replace(/\s+/g, '-');
  }

  getStatusClass(status?: string): string {
    if (!status) return 'status-unknown';
    return 'status-' + status.toLowerCase().replace(/\s+/g, '-');
  }

  // Helper methods for template
  getUserEmail(comment: CommentWithDetails): string {
    return comment.user?.email || comment.user_email || 'Unknown User';
  }

  getUserRole(comment: CommentWithDetails): string {
    return comment.user?.role || 'Unknown Role';
  }

  getProjectCode(comment: CommentWithDetails): string {
    return comment.project?.project_code || 'N/A';
  }

  getStoreName(comment: CommentWithDetails): string {
    return comment.project?.store_name || 'Unknown Store';
  }

  getProjectLocation(comment: CommentWithDetails): string {
    const city = comment.project?.city || '';
    const state = comment.project?.state || '';
    if (city && state) return `${city}, ${state}`;
    return city || state || '';
  }

  getTaskTitle(comment: CommentWithDetails): string {
    return comment.task?.title || 'Unknown Task';
  }

  getTaskStatus(comment: CommentWithDetails): string {
    return comment.task?.status || 'N/A';
  }
}
