import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../Services/auth.service';
import { TaskService } from '../../Services/task.service';
import { UserService } from '../../Services/user.service';
import { ProjectService } from '../../Services/project.service';
import { CommentService } from '../../Services/comment.service';
import { Task, User, Project, CreateTaskRequest, UpdateTaskRequest, Comment, CreateCommentRequest } from '../../user.model';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data properties
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  users: User[] = [];
  projects: Project[] = [];
  selectedTask: Task | null = null;
  editingTask: Task | null = null;
  taskComments: Comment[] = [];

  // UI state
  loading = true;
  saving = false;
  showTaskModal = false;
  showViewModal = false;
  showCommentsSection = false;
  loadingComments = false;
  uploadingMedia = false;

  // Filter properties
  selectedStatus = '';
  selectedPriority = '';
  searchTerm = '';

  // Forms
  taskForm: FormGroup;
  commentForm: FormGroup;

  // File upload
  selectedFiles: FileList | null = null;
  maxFileSize = 100 * 1024 * 1024; // 100MB
  allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4', 'video/mov', 'video/avi'];
  // Inside your TasksComponent class
  showMediaViewer = false;
  selectedMedia: Comment['media_files'][0] | null = null; // Adjust type if needed
  // Statistics
  taskStats = {
    total: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  };
  // Inside your TasksComponent class
  // Add these new properties to your existing component
  showFieldMediaModal = false;
  currentFieldForUpload = '';
  fieldMediaForm: FormGroup;
  fieldSelectedFiles: FileList | null = null;
  uploadingFieldMedia = false;
  fieldMediaComments: { [key: string]: Comment[] } = {};

  // Add field display names mapping
  fieldDisplayNames: { [key: string]: string } = {
    'earth_leveling_status': 'Earth Leveling Status',
    'footing_stone_status': 'Footing Stone Status',
    'column_erection_status': 'Column Erection Status',
    'roofing_sheets_status': 'Roofing Sheets Status',
    'roof_insulation_status': 'Roof Insulation Status',
    'sides_cladding_status': 'Sides Cladding Status',
    'roof_trusses_status': 'Roof Trusses Status',
    'wall_construction_status': 'Wall Construction Status',
    'flooring_concrete_status': 'Flooring Concrete Status',
    'plastering_painting_status': 'Plastering & Painting Status',
    'plumbing_status': 'Plumbing Status',
    'parking_availability_status': 'Parking Availability Status',
    'associates_restroom_status': 'Associates Restroom Status',
    'zeptons_restroom_status': 'Zeptons Restroom Status',
    'water_availability_status': 'Water Availability Status',
    'permanent_power_status': 'Permanent Power Status',
    'temporary_connection_available': 'Drainage Status',
    'parking_work_status': 'Parking Work Status',
    'dg_bed_status': 'DG Bed Status',
    'store_shutters_status': 'Store Shutters Status',
    'approach_road_status': 'Approach Road Status',
    'temporary_power_kva_status': 'Temporary Power KVA Status',
    'flooring_tiles_level_issues': 'Flooring Tiles Level Issues',
    'restroom_fixtures_status': 'Restroom Fixtures Status',
    'dg_installation_status': 'DG Installation Status',
    'cctv_installation_status': 'CCTV Installation Status',
    'lights_fans_installation_status': 'Lights & Fans Installation Status',
    'racks_installation_status': 'Racks Installation Status',
    'cold_room_installation_status': 'Cold Room Installation Status',
    'panda_bin_installation_status': 'Panda Bin Installation Status',
    'crates_installation_status': 'Crates Installation Status',
    'flykiller_installation_status': 'Flykiller Installation Status',
    'dg_testing_status': 'DG Testing Status',
    'cleaning_status': 'Cleaning Status'
  };

  openMediaViewer(media: Comment['media_files'][0]): void { // Adjust type if needed
    this.selectedMedia = media;
    this.showMediaViewer = true;
  }

  closeMediaViewer(): void {
    this.showMediaViewer = false;
    this.selectedMedia = null;
  }

  // Ensure getMediaUrl, isImageFile, isVideoFile, and formatFileSize are public or accessible in the template
  // They are already present in your provided code.
  // Dropdown options for new fields
  taskActivityOptions = [
    { value: 'Completed', label: 'Completed' },
    { value: 'WIP', label: 'WIP' },
    { value: 'Not Started', label: 'Not Started' },
    { value: 'NA', label: 'NA' }
  ];

  storeTypeOptions = [
    { value: 'DH', label: 'DH' },
    { value: 'SS', label: 'SS' },
    { value: 'Relocation', label: 'Relocation' }
  ];

  propertyTypeOptions = [
    { value: 'BTS', label: 'BTS' },
    { value: 'Semi BTS', label: 'Semi BTS' },
    { value: 'C&E', label: 'C&E' },
    { value: 'RTM', label: 'RTM' }
  ];

  flooringIssuesOptions = [
    { value: 'No Issues', label: 'No Issues' },
    { value: 'Level Difference', label: 'Level Difference' }
  ];

  constructor(
    private authService: AuthService,
    private taskService: TaskService,
    private userService: UserService,
    private projectService: ProjectService,
    private commentService: CommentService,
    private fb: FormBuilder
  ) {
    this.taskForm = this.createTaskForm();
    this.commentForm = this.createCommentForm();
    this.fieldMediaForm = this.createFieldMediaForm();
  }
  private createFieldMediaForm(): FormGroup {
    return this.fb.group({
      comment_text: ['']
    });
  }
  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Initialization methods
  private loadInitialData(): void {
    this.loading = true;
    this.loadTasks();
    this.loadUsers();
    this.loadProjects();
  }

  private loadTasks(): void {
    this.taskService.getTasks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.tasks = response.tasks;
          this.calculateStats();
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading tasks:', error);
          this.loading = false;
        }
      });
  }

  private loadUsers(): void {
    this.userService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.users = response.users;
        },
        error: (error) => {
          console.error('Error loading users:', error);
        }
      });
  }

  private loadProjects(): void {
    this.projectService.getProjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.projects = response.projects;
        },
        error: (error) => {
          console.error('Error loading projects:', error);
        }
      });
  }

  private createTaskForm(): FormGroup {
    return this.fb.group({
      // Existing required fields
      project_id: ['', Validators.required],
      title: ['', Validators.required],
      description: [''],

      // Hidden fields (still in form but not displayed)
      status: ['To Do'],
      priority: ['Medium'],

      assigned_to: [''],
      due_date: [''],
      progress_percentage: [0],

      // New fields - Store Type & Property Type
      store_type: [''],
      property_type: [''],
      photo_video_capture: [false],
      comments: [''],

      // Earth Leveling & Land Filling Activities (LL SOW)
      earth_leveling_status: [''],

      // Foundation & Structure Statuses
      footing_stone_status: [''],
      column_erection_status: [''],
      roofing_sheets_status: [''],
      roof_insulation_status: [''],
      sides_cladding_status: [''],
      roof_trusses_status: [''],
      wall_construction_status: [''],
      flooring_concrete_status: [''],
      plastering_painting_status: [''],
      plumbing_status: [''],

      // Site Infrastructure & Utilities
      parking_availability_status: [''],
      associates_restroom_status: [''],
      zeptons_restroom_status: [''],
      water_availability_status: [''],
      permanent_power_status: [''],
      temporary_connection_available: [''],
      parking_work_status: [''],
      dg_bed_status: [''],
      store_shutters_status: [''],
      approach_road_status: [''],
      temporary_power_kva_status: [''],
      flooring_tiles_level_issues: [''],
      restroom_fixtures_status: [''],
      dg_installation_status: [''],

      // Project Specific Installations (Projects SOW Checklist)
      cctv_installation_status: [''],
      lights_fans_installation_status: [''],
      racks_installation_status: [''],
      cold_room_installation_status: [''],
      panda_bin_installation_status: [''],
      crates_installation_status: [''],
      flykiller_installation_status: [''],
      dg_testing_status: [''],
      cleaning_status: ['']
    });
  }

  private createCommentForm(): FormGroup {
    return this.fb.group({
      comment_text: ['', Validators.required]
    });
  }

  private calculateStats(): void {
    this.taskStats = {
      total: this.tasks.length,
      inProgress: this.tasks.filter(task => task.status === 'In Progress').length,
      completed: this.tasks.filter(task => task.status === 'Completed').length,
      overdue: this.tasks.filter(task => this.isTaskOverdue(task)).length
    };
  }

  // Permission methods
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  canEditTask(task: Task): boolean {
    if (this.isAdmin()) {
      return true;
    }
    const currentUser = this.authService.getCurrentUser();
    return currentUser ? task.assigned_to === currentUser.id : false;
  }

  // Filter and search methods
  applyFilters(): void {
    this.filteredTasks = this.tasks.filter(task => {
      const matchesStatus = !this.selectedStatus || task.status === this.selectedStatus;
      const matchesPriority = !this.selectedPriority || task.priority === this.selectedPriority;
      const matchesSearch = !this.searchTerm ||
        task.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        task.store_name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        task.project_code?.toLowerCase().includes(this.searchTerm.toLowerCase());

      return matchesStatus && matchesPriority && matchesSearch;
    });
  }

  // Task modal methods
  openCreateTaskModal(): void {
    if (!this.isAdmin()) {
      return;
    }

    this.editingTask = null;
    this.taskForm.reset({
      project_id: '',
      title: '',
      description: '',
      status: 'To Do',
      priority: 'Medium',
      assigned_to: '',
      due_date: '',
      progress_percentage: 0,
      store_type: '',
      property_type: '',
      photo_video_capture: false,
      comments: '',
      temporary_connection_available: ''
    });
    this.showTaskModal = true;
  }

  editTask(task: Task): void {
    if (!this.canEditTask(task)) {
      return;
    }

    this.editingTask = task;
    this.taskForm.patchValue({
      project_id: task.project_id != null ? task.project_id.toString() : '',
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assigned_to: task.assigned_to != null ? task.assigned_to.toString() : '',
      due_date: task.due_date || '',
      progress_percentage: task.progress_percentage,

      // New fields
      store_type: task.store_type || '',
      property_type: task.property_type || '',
      photo_video_capture: task.photo_video_capture || false,
      comments: task.comments || '',

      // LL SOW fields
      earth_leveling_status: task.earth_leveling_status || '',

      // Foundation & Structure fields
      footing_stone_status: task.footing_stone_status || '',
      column_erection_status: task.column_erection_status || '',
      roofing_sheets_status: task.roofing_sheets_status || '',
      roof_insulation_status: task.roof_insulation_status || '',
      sides_cladding_status: task.sides_cladding_status || '',
      roof_trusses_status: task.roof_trusses_status || '',
      wall_construction_status: task.wall_construction_status || '',
      flooring_concrete_status: task.flooring_concrete_status || '',
      plastering_painting_status: task.plastering_painting_status || '',
      plumbing_status: task.plumbing_status || '',

      // Site Infrastructure fields
      parking_availability_status: task.parking_availability_status || '',
      associates_restroom_status: task.associates_restroom_status || '',
      zeptons_restroom_status: task.zeptons_restroom_status || '',
      water_availability_status: task.water_availability_status || '',
      permanent_power_status: task.permanent_power_status || '',
      temporary_connection_available: task.temporary_connection_available || '',
      parking_work_status: task.parking_work_status || '',
      dg_bed_status: task.dg_bed_status || '',
      store_shutters_status: task.store_shutters_status || '',
      approach_road_status: task.approach_road_status || '',
      temporary_power_kva_status: task.temporary_power_kva_status || '',
      flooring_tiles_level_issues: task.flooring_tiles_level_issues || '',
      restroom_fixtures_status: task.restroom_fixtures_status || '',
      dg_installation_status: task.dg_installation_status || '',

      // Project Specific Installation fields
      cctv_installation_status: task.cctv_installation_status || '',
      lights_fans_installation_status: task.lights_fans_installation_status || '',
      racks_installation_status: task.racks_installation_status || '',
      cold_room_installation_status: task.cold_room_installation_status || '',
      panda_bin_installation_status: task.panda_bin_installation_status || '',
      crates_installation_status: task.crates_installation_status || '',
      flykiller_installation_status: task.flykiller_installation_status || '',
      dg_testing_status: task.dg_testing_status || '',
      cleaning_status: task.cleaning_status || ''
    });
    this.showTaskModal = true;

    Object.keys(this.fieldDisplayNames).forEach(fieldName => {
      this.loadFieldMediaComments(fieldName);
    });
  }

  editTaskFromView(): void {
    if (this.selectedTask) {
      this.closeViewModal();
      this.editTask(this.selectedTask);
    }
  }

  closeTaskModal(): void {
    this.showTaskModal = false;
    this.editingTask = null;
    this.taskForm.reset();
  }

  saveTask(): void {
    if (this.taskForm.invalid || this.saving) {
      return;
    }

    this.saving = true;
    const formValue = this.taskForm.value;

    // Clean up form data - handle nulls and booleans properly
    const taskData = {
      ...formValue,
      // Handle required fields
      project_id: parseInt(formValue.project_id) || null,
      assigned_to: formValue.assigned_to ? parseInt(formValue.assigned_to) : null,
      due_date: formValue.due_date || null,

      // Handle boolean fields - convert to integers
      photo_video_capture: formValue.photo_video_capture ? 1 : 0,
      temporary_connection_available: formValue.temporary_connection_available || null,

      // Handle progress percentage
      progress_percentage: parseInt(formValue.progress_percentage) || 0,

      // Clean string fields - convert empty strings to null
      store_type: formValue.store_type || null,
      property_type: formValue.property_type || null,
      comments: formValue.comments || null,

      // Clean all status fields
      earth_leveling_status: formValue.earth_leveling_status || null,
      footing_stone_status: formValue.footing_stone_status || null,
      column_erection_status: formValue.column_erection_status || null,
      roofing_sheets_status: formValue.roofing_sheets_status || null,
      roof_insulation_status: formValue.roof_insulation_status || null,
      sides_cladding_status: formValue.sides_cladding_status || null,
      roof_trusses_status: formValue.roof_trusses_status || null,
      wall_construction_status: formValue.wall_construction_status || null,
      flooring_concrete_status: formValue.flooring_concrete_status || null,
      plastering_painting_status: formValue.plastering_painting_status || null,
      plumbing_status: formValue.plumbing_status || null,
      parking_availability_status: formValue.parking_availability_status || null,
      associates_restroom_status: formValue.associates_restroom_status || null,
      zeptons_restroom_status: formValue.zeptons_restroom_status || null,
      water_availability_status: formValue.water_availability_status || null,
      permanent_power_status: formValue.permanent_power_status || null,
      parking_work_status: formValue.parking_work_status || null,
      dg_bed_status: formValue.dg_bed_status || null,
      store_shutters_status: formValue.store_shutters_status || null,
      approach_road_status: formValue.approach_road_status || null,
      temporary_power_kva_status: formValue.temporary_power_kva_status || null,
      flooring_tiles_level_issues: formValue.flooring_tiles_level_issues || null,
      restroom_fixtures_status: formValue.restroom_fixtures_status || null,
      dg_installation_status: formValue.dg_installation_status || null,
      cctv_installation_status: formValue.cctv_installation_status || null,
      lights_fans_installation_status: formValue.lights_fans_installation_status || null,
      racks_installation_status: formValue.racks_installation_status || null,
      cold_room_installation_status: formValue.cold_room_installation_status || null,
      panda_bin_installation_status: formValue.panda_bin_installation_status || null,
      crates_installation_status: formValue.crates_installation_status || null,
      flykiller_installation_status: formValue.flykiller_installation_status || null,
      dg_testing_status: formValue.dg_testing_status || null,
      cleaning_status: formValue.cleaning_status || null
    };

    if (this.editingTask) {
      // Update existing task
      const updateData: UpdateTaskRequest = {};

      // Include all form fields that might have changed
      Object.keys(taskData).forEach(key => {
        if (taskData[key] !== this.editingTask![key as keyof Task]) {
          updateData[key as keyof UpdateTaskRequest] = taskData[key];
        }
      });

      this.taskService.updateTask(this.editingTask.id, updateData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.updateTaskInList(response.task);
            this.closeTaskModal();
            this.saving = false;
          },
          error: (error) => {
            console.error('Error updating task:', error);
            this.saving = false;
          }
        });
    } else {
      // Create new task
      const createData: CreateTaskRequest = taskData;

      this.taskService.createTask(createData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.tasks.unshift(response.task);
            this.calculateStats();
            this.applyFilters();
            this.closeTaskModal();
            this.saving = false;
          },
          error: (error) => {
            console.error('Error creating task:', error);
            this.saving = false;
          }
        });
    }
  }

  private updateTaskInList(updatedTask: Task): void {
    const index = this.tasks.findIndex(task => task.id === updatedTask.id);
    if (index !== -1) {
      this.tasks[index] = updatedTask;
      this.calculateStats();
      this.applyFilters();

      // Update selected task if it's the same one
      if (this.selectedTask && this.selectedTask.id === updatedTask.id) {
        this.selectedTask = updatedTask;
      }
    }
  }

  deleteTask(task: Task): void {
    if (!this.isAdmin()) {
      return;
    }

    const confirmed = confirm(`Are you sure you want to delete the task "${task.title}"?`);
    if (!confirmed) {
      return;
    }

    this.taskService.deleteTask(task.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.tasks = this.tasks.filter(t => t.id !== task.id);
          this.calculateStats();
          this.applyFilters();

          // Close view modal if this task was being viewed
          if (this.selectedTask && this.selectedTask.id === task.id) {
            this.closeViewModal();
          }
        },
        error: (error) => {
          console.error('Error deleting task:', error);
        }
      });
  }

  // Task view modal methods
  viewTask(task: Task): void {
    this.selectedTask = task;
    this.showViewModal = true;
    this.loadTaskComments(task.id);
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedTask = null;
    this.taskComments = [];
    this.showCommentsSection = false;
  }

  // Comments methods
  toggleCommentsSection(): void {
    this.showCommentsSection = !this.showCommentsSection;
    if (this.showCommentsSection && this.selectedTask) {
      this.loadTaskComments(this.selectedTask.id);
    }
  }

  loadTaskComments(taskId: number): void {
    this.loadingComments = true;
    this.commentService.getComments(taskId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.taskComments = response.comments;
          this.loadingComments = false;
        },
        error: (error) => {
          console.error('Error loading comments:', error);
          this.loadingComments = false;
        }
      });
  }

  addComment(): void {
    if (this.commentForm.invalid || !this.selectedTask) {
      return;
    }

    const commentData: CreateCommentRequest = {
      task_id: this.selectedTask.id,
      comment_text: this.commentForm.value.comment_text
    };

    this.commentService.createComment(commentData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.taskComments.push(response.comment);
          this.commentForm.reset();

          // Upload media files if any
          if (this.selectedFiles && this.selectedFiles.length > 0) {
            this.uploadMediaFiles(response.comment.id);
          }
        },
        error: (error) => {
          console.error('Error creating comment:', error);
        }
      });
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      this.selectedFiles = target.files;
    }
  }

  uploadMediaFiles(commentId: number): void {
    if (!this.selectedFiles || this.selectedFiles.length === 0) {
      return;
    }

    // Validate files
    for (let i = 0; i < this.selectedFiles.length; i++) {
      const file = this.selectedFiles[i];

      if (!this.allowedTypes.includes(file.type)) {
        alert(`File ${file.name} has invalid type. Allowed: JPG, PNG, MP4, MOV, AVI`);
        return;
      }

      if (file.size > this.maxFileSize) {
        alert(`File ${file.name} exceeds maximum size of 100MB`);
        return;
      }
    }

    this.uploadingMedia = true;
    this.commentService.uploadMedia(commentId, this.selectedFiles)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Update the comment with uploaded media
          const commentIndex = this.taskComments.findIndex(c => c.id === commentId);
          if (commentIndex !== -1) {
            this.taskComments[commentIndex].media_files = response.uploaded_files;
          }

          this.selectedFiles = null;
          this.uploadingMedia = false;

          if (response.errors && response.errors.length > 0) {
            alert('Some files failed to upload:\n' + response.errors.join('\n'));
          }
        },
        error: (error) => {
          console.error('Error uploading media:', error);
          this.uploadingMedia = false;
        }
      });
  }

  getMediaUrl(filePath: string): string {
    // Convert file path to URL - adjust based on your server setup
    if (!filePath) return '';
    const fileName = filePath.split('/').pop() || filePath;
    return `https://aliceblue-jaguar-943425.hostingersite.com/uploads/${fileName}`;
  }

  isImageFile(fileType: string): boolean {
    return ['jpg', 'jpeg', 'png'].includes(fileType.toLowerCase());
  }

  isVideoFile(fileType: string): boolean {
    return ['mp4', 'mov', 'avi'].includes(fileType.toLowerCase());
  }

  // Utility methods
  isTaskOverdue(task: Task): boolean {
    if (!task.due_date || task.status === 'Completed') {
      return false;
    }

    const today = new Date();
    const dueDate = new Date(task.due_date);
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    return dueDate < today;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // I Button
  // Field media modal methods
  openFieldMediaModal(fieldName: string): void {
    this.currentFieldForUpload = fieldName;
    this.showFieldMediaModal = true;
    this.fieldMediaForm.reset();
    if (this.editingTask) {
      this.loadFieldMediaComments(fieldName);
    }
  }

  closeFieldMediaModal(): void {
    this.showFieldMediaModal = false;
    this.currentFieldForUpload = '';
    this.fieldSelectedFiles = null;
  }

  onFieldFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      this.fieldSelectedFiles = target.files;
    }
  }

  loadFieldMediaComments(fieldName: string): void {
    if (!this.editingTask) return;

    this.commentService.getComments(this.editingTask.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const fieldComments = response.comments.filter(comment =>
            comment.comment_text.startsWith(fieldName + '/')
          );
          this.fieldMediaComments[fieldName] = fieldComments;
        },
        error: (error) => console.error('Error loading field comments:', error)
      });
  }

  addFieldMedia(): void {
    if (!this.editingTask) return;

    const fieldDisplayName = this.fieldDisplayNames[this.currentFieldForUpload] || this.currentFieldForUpload;
    const commentText = `${this.currentFieldForUpload}/${fieldDisplayName} - ${this.fieldMediaForm.value.comment_text || 'Media upload'}`;

    const commentData: CreateCommentRequest = {
      task_id: this.editingTask.id,
      comment_text: commentText
    };

    this.commentService.createComment(commentData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (this.fieldSelectedFiles && this.fieldSelectedFiles.length > 0) {
            this.uploadFieldMediaFiles(response.comment.id);
          }
          this.closeFieldMediaModal();
          // Refresh comments in view modal if open
          if (this.showCommentsSection) {
            this.loadTaskComments(this.editingTask!.id);
          }
        },
        error: (error) => console.error('Error creating field comment:', error)
      });
  }

  uploadFieldMediaFiles(commentId: number): void {
    if (!this.fieldSelectedFiles) return;

    this.uploadingFieldMedia = true;
    this.commentService.uploadMedia(commentId, this.fieldSelectedFiles)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.uploadingFieldMedia = false;
          this.fieldSelectedFiles = null;
          if (response.errors && response.errors.length > 0) {
            alert('Some files failed to upload:\n' + response.errors.join('\n'));
          }
        },
        error: (error) => {
          console.error('Error uploading field media:', error);
          this.uploadingFieldMedia = false;
        }
      });
  }

  getFieldMediaCount(fieldName: string): number {
    return this.fieldMediaComments[fieldName]?.length || 0;
  }

  hasFieldMedia(fieldName: string): boolean {
    return this.getFieldMediaCount(fieldName) > 0;
  }
}
