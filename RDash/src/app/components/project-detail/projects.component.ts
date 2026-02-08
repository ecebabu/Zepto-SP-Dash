// projects.component.ts - Updated with Attachments Section
// projects.component.ts - Updated with State-City Dropdown functionality

import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ProjectService } from '../../Services/project.service';
import { UserService } from '../../Services/user.service';
import { AuthService } from '../../Services/auth.service';
import { TaskService } from '../../Services/task.service';
import { Project, CreateProjectRequest, User, ProjectStatusCounts, CreateTaskRequest, Task, Comment, ProjectDocument } from '../../user.model';
import { forkJoin } from 'rxjs';
import { CommentService } from '../../Services/comment.service';
import * as Papa from 'papaparse';
import { HttpClient } from '@angular/common/http';
import { StateCityResponse, StateCityRow } from '../../user.model';
interface RawStateCityData {
  State: string;
  StateCode: string;
  DistrictCode: string;
  'District Name': string; // Note: This is the key from CSV
  TownCode: string;
  'Town  Name': string; // Note: Extra space in CSV header
}

interface StateItem {
  name: string;
  code?: string;
}

interface CityItem {
  name: string;
  state_name: string;
  district_code?: string;
}

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {
  @ViewChild('deleteModal') deleteModal!: ElementRef;

  projectForm!: FormGroup;
  editProjectForm!: FormGroup;
  userForm!: FormGroup;

  showCreateForm = false;
  showEditForm = false;
  showUserForm = false;
  showDeleteModal = false;
  showViewProject = false;

  isSubmitting = false;
  submitError = '';

  projects: Project[] = [];
  filteredProjects: Project[] = [];
  projectStatusCounts: ProjectStatusCounts | null = null;
  availableUsers: User[] = [];

  searchTerm = '';
  currentUserRole: string | null = '';

  // Edit/Delete state
  selectedProject: Project | null = null;
  projectToDelete: Project | null = null;

  // View Project state
  viewProject: Project | null = null;
  viewProjectTasks: Task[] = [];
  viewProjectUsers: any[] = [];
  viewProjectAttachments: Comment[] = [];
  loadingProjectDetails = false;
  loadingAttachments = false;

  // User management
  users: User[] = [];
  selectedUser: User | null = null;
  showDeleteUserModal = false;
  userToDelete: User | null = null;

  // Loading states
  usersLoaded = false;
  projectsLoaded = false;

  // Media modal
  showMediaModal = false;
  selectedMedia: any = null;

  // State City dropdown properties
  statesList: StateItem[] = [];
  citiesList: CityItem[] = [];
  filteredCitiesList: CityItem[] = [];
  selectedState: string = '';
  stateCityDataLoaded = false;
  // State City Editor properties
  showStateCityEditor = false;
  stateCityRows: StateCityRow[] = [];
  editingRowIndex: number | null = null;
  originalRowData: StateCityRow | null = null;
  isLoadingStateCityData = false;
  stateCityError = '';
  originalCsvData: StateCityRow[] = []; 

  // Filters
  showDropdown: boolean = false;
  dropdownPosition: { x: number, y: number } = { x: 0, y: 0 };
  selectedRowProject: Project | null = null;

  // Files
  uploadingDocument = false;
  uploadError = '';
  pendingDocuments: File[] = []; // Store files to upload after project creation
  projectDocuments: ProjectDocument[] = [];

  // Resizer
  // Add to your component class
  private isResizing = false;
  private currentColumn = -1;
  private startX = 0;
  private startWidth = 0;
  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private userService: UserService,
    private authService: AuthService,
    private taskService: TaskService,
    private http: HttpClient,
    private commentService: CommentService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.currentUserRole = this.authService.getCurrentUserRole();
    this.loadStateCityData();
    this.loadInitialData();
  }


  // Handle state change for edit form
  onEditStateChange(event: any): void {
    const selectedStateName = event.target.value;
    this.selectedState = selectedStateName;

    if (selectedStateName) {
      this.filteredCitiesList = this.citiesList
        .filter(city => city.state_name === selectedStateName)
        .sort((a, b) => a.name.localeCompare(b.name));

      this.editProjectForm.patchValue({ city: '' });
    } else {
      this.filteredCitiesList = [];
      this.editProjectForm.patchValue({ city: '' });
    }
  }

  // Helper methods for template calculations - FIXED
  getCompletedTasksCount(): number {
    if (!this.viewProjectTasks || !Array.isArray(this.viewProjectTasks)) {
      return 0;
    }
    return this.viewProjectTasks.filter(t => t.status === 'Completed').length;
  }

  getOnHoldTasksCount(): number {
    if (!this.viewProjectTasks || !Array.isArray(this.viewProjectTasks)) {
      return 0;
    }
    return this.viewProjectTasks.filter(t => t.status === 'On Hold').length;
  }

  getInProgressTasksCount(): number {
    if (!this.viewProjectTasks || !Array.isArray(this.viewProjectTasks)) {
      return 0;
    }
    return this.viewProjectTasks.filter(t => t.status === 'In Progress').length;
  }

  getTodoTasksCount(): number {
    if (!this.viewProjectTasks || !Array.isArray(this.viewProjectTasks)) {
      return 0;
    }
    return this.viewProjectTasks.filter(t => t.status === 'To Do').length;
  }

  // Load both projects and users together
  loadInitialData(): void {
    forkJoin({
      projects: this.projectService.getProjects(),
      users: this.userService.getUsers()
    }).subscribe({
      next: (results) => {
        // Load projects
        this.projects = results.projects.projects;
        this.filteredProjects = this.projects;
        this.projectStatusCounts = results.projects.status_counts;
        this.projectsLoaded = true;
        this.applyColumnFilter();
        // Load users
        this.availableUsers = results.users.users;
        this.users = results.users.users;
        this.usersLoaded = true;
       
     
       
      },
      error: (error) => {
        console.error('Error loading initial data:', error);
        this.submitError = 'Failed to load initial data';
      }
    });
  }

  // View Project functionality
  showProjectDetails(project: Project): void {
    this.viewProject = project;
    this.showViewProject = true;
    this.loadingProjectDetails = true;
    this.loadProjectDetails(project.id);
    this.loadProjectAttachments(project.id);
  }

  loadProjectDetails(projectId: number): void {
    forkJoin({
      project: this.projectService.getProject(projectId),
      tasks: this.projectService.getProjectTasks(projectId)
    }).subscribe({
      next: (results) => {
        this.viewProject = results.project.project;
        this.viewProjectTasks = results.tasks.tasks || [];

        // Process users with their task progress
        this.processProjectUsers();
        this.loadingProjectDetails = false;
      },
      error: (error) => {
        console.error('Error loading project details:', error);
        this.viewProjectTasks = [];
        this.loadingProjectDetails = false;
      }
    });
  }

  // New method to load project attachments
  loadProjectAttachments(projectId: number): void {
    this.loadingAttachments = true;

    // First get all tasks for this project
    this.projectService.getProjectTasks(projectId).subscribe({
      next: (response) => {
        const tasks = response.tasks || [];

        if (tasks.length === 0) {
          this.viewProjectAttachments = [];
          this.loadingAttachments = false;
          return;
        }

        // Get comments for each task
        const commentRequests = tasks.map(task =>
          this.commentService.getComments(task.id).toPromise().then(
            (commentResponse: any) => {
              const comments = commentResponse?.comments || [];
              return comments.map((comment: any) => ({
                ...comment,
                task_title: task.title,
                task_id: task.id,
                media_files: comment.media_files || []
              }));
            },
            (error) => {
              console.error(`Error loading comments for task ${task.id}:`, error);
              return [];
            }
          )
        );

        Promise.all(commentRequests).then((commentArrays) => {
          // Flatten all comments and filter only those with attachments
          const allComments = commentArrays.flat();
          this.viewProjectAttachments = allComments
            .filter(comment => comment.media_files && comment.media_files.length > 0)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

          this.loadingAttachments = false;
        }).catch((error) => {
          console.error('Error processing attachments:', error);
          this.viewProjectAttachments = [];
          this.loadingAttachments = false;
        });
      },
      error: (error) => {
        console.error('Error loading tasks for attachments:', error);
        this.viewProjectAttachments = [];
        this.loadingAttachments = false;
      }
    });
  }

  processProjectUsers(): void {
    if (!this.viewProject || !this.viewProject.assigned_users) {
      this.viewProjectUsers = [];
      return;
    }

    this.viewProjectUsers = this.viewProject.assigned_users.map(assignedUser => {
      const user = this.availableUsers.find(u => u.id.toString() === assignedUser.user_id.toString());
      const userTasks = this.viewProjectTasks.filter(task => task.assigned_to === assignedUser.user_id);

      const totalTasks = userTasks.length;
      const completedTasks = userTasks.filter(task => task.status === 'Completed').length;
      const inProgressTasks = userTasks.filter(task => task.status === 'In Progress').length;
      const todoTasks = userTasks.filter(task => task.status === 'To Do').length;
      const onHoldTasks = userTasks.filter(task => task.status === 'On Hold').length;

      const avgProgress = totalTasks > 0
        ? Math.round(userTasks.reduce((sum, task) => sum + task.progress_percentage, 0) / totalTasks)
        : 0;

      return {
        id: assignedUser.user_id,
        email: user?.email || 'Unknown User',
        role: assignedUser.role,
        user_role: user?.role || 'Unknown',
        tasks: userTasks,
        taskStats: {
          total: totalTasks,
          completed: completedTasks,
          in_progress: inProgressTasks,
          todo: todoTasks,
          on_hold: onHoldTasks,
          avg_progress: avgProgress
        }
      };
    });
  }

  closeProjectView(): void {
    this.showViewProject = false;
    this.viewProject = null;
    this.viewProjectTasks = [];
    this.viewProjectUsers = [];
    this.viewProjectAttachments = [];
  }

  // Media handling methods
  openMediaModal(media: any): void {
    this.selectedMedia = media;
    this.showMediaModal = true;
  }

  closeMediaModal(): void {
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
    const fileName = filePath.split('/').pop() || filePath;
    return `https://aliceblue-jaguar-943425.hostingersite.com/uploads/${fileName}`;
  }

 
  getTaskPriorityClass(priority: string): string {
    return `priority-${priority.toLowerCase()}`;
  }

  getTaskStatusClass(status: string): string {
    return `status-${status.toLowerCase().replace(' ', '-')}`;
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return 'Unknown Date';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  }

  getUserProgressColor(progress: number): string {
    if (progress >= 80) return '#4CAF50';
    if (progress >= 60) return '#FF9800';
    if (progress >= 40) return '#FFC107';
    return '#F44336';
  }

  // Permission checks
  canAdd(): boolean {
    return this.currentUserRole === 'Admin' || this.currentUserRole === 'Super Admin';
  }

  canEdit(): boolean {
    return this.currentUserRole === 'Super Admin';
  }

  canDelete(): boolean {
    return this.currentUserRole === 'Super Admin';
  }

  canView(): boolean {
    return true;
  }

  initializeForms(): void {
    // Project form
    this.projectForm = this.fb.group({
      store_code: ['', Validators.required],
      store_name: ['', Validators.required],
      project_code: ['', Validators.required],
      zone: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      site_lat_long: [''],
      store_type: ['', Validators.required],
      site_type: ['', Validators.required],
      ll_ho_date: [''],
      launch_date: [''],
      project_handover_date: [''],
      loi_release_date: [''],
      token_release_date: [''],
      recee_date: [''],
      recee_status: [''],
      loi_signed_status: [''],
      layout: [''],
      project_status: ['LL WIP'],
      property_area_sqft: [''],
      assigned_users: this.fb.array([]),
      documents: this.fb.array([]),
      criticality: [''],
      address: [''],
      actual_carpet_area_sqft: [''],
      token_released: [''],
      power_availability_kva: ['']
    });

    // Edit project form (same structure)
    this.editProjectForm = this.fb.group({
      store_code: ['', Validators.required],
      store_name: ['', Validators.required],
      project_code: ['', Validators.required],
      zone: [''],
      city: [''],
      state: [''],
      site_lat_long: [''],
      store_type: [''],
      site_type: [''],
      ll_ho_date: [''],
      launch_date: [''],
      project_handover_date: [''],
      loi_release_date: [''],
      token_release_date: [''],
      recee_date: [''],
      recee_status: [''],
      loi_signed_status: [''],
      layout: [''],
      project_status: ['LL WIP'],
      property_area_sqft: [''],
      assigned_users: this.fb.array([]),
      documents: this.fb.array([]),
      criticality: [''],
      address: [''],
      actual_carpet_area_sqft: [''],
      token_released: [''],
      power_availability_kva: [''],

    });

    // User form
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: ['Normal User', Validators.required]
    });
  }

  // Form array getters
  get assignedUsersArray(): FormArray {
    return this.projectForm.get('assigned_users') as FormArray;
  }

  get documentsArray(): FormArray {
    return this.projectForm.get('documents') as FormArray;
  }

  get editAssignedUsersArray(): FormArray {
    return this.editProjectForm.get('assigned_users') as FormArray;
  }

  get editDocumentsArray(): FormArray {
    return this.editProjectForm.get('documents') as FormArray;
  }

  // Data loading methods
  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (response) => {
        this.projects = response.projects;
        this.filteredProjects = this.projects;
        this.projectStatusCounts = response.status_counts;
        this.projectsLoaded = true;
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.submitError = 'Failed to load projects';
      }
    });
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (response) => {
        this.availableUsers = response.users;
        this.users = response.users;
        this.usersLoaded = true;
      
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  // Ensure users are loaded before proceeding
  private ensureUsersLoaded(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.usersLoaded && this.availableUsers.length > 0) {
        resolve();
      } else {
       
        this.userService.getUsers().subscribe({
          next: (response) => {
            this.availableUsers = response.users;
            this.users = response.users;
            this.usersLoaded = true;
            
            resolve();
          },
          error: (error) => {
            console.error('Error loading users for task creation:', error);
            reject(error);
          }
        });
      }
    });
  }

  // Helper method to extract username from email
  private extractUsername(email: string): string {
    return email.split('@')[0];
  }

  // Helper method to find user by ID
  private findUserById(userId: number | string): User | undefined {
    const userIdStr = userId.toString();
    const user = this.availableUsers.find(user => user.id.toString() === userIdStr);
    
    return user;
  }

  // Method to create default task for assigned users
  private async createDefaultTasksForProject(project: Project, assignedUsers: any[]): Promise<void> {
    if (!assignedUsers || assignedUsers.length === 0) {
     
      return;
    }

    try {
      await this.ensureUsersLoaded();

     

      const taskPromises = assignedUsers.map(assignedUser => {
        if (assignedUser.user_id) {
          const userId = assignedUser.user_id;
          const user = this.findUserById(userId);
          
          if (user) {
            const username = this.extractUsername(user.email);
            const taskTitle = `${project.store_name} - ${username}`;

            const taskData: CreateTaskRequest = {
              project_id: project.id,
              title: taskTitle,
              description: `Default task created for project: ${project.store_name} (${project.project_code})`,
              status: 'To Do',
              priority: 'Medium',
              assigned_to: parseInt(userId),
              progress_percentage: 0,

              // Initialize all new fields with default values
              store_type: undefined,
              property_type: undefined,
              photo_video_capture: false,
              comments: undefined,

              // LL SOW fields
              earth_leveling_status: undefined,

              // Foundation & Structure fields
              footing_stone_status: undefined,
              column_erection_status: undefined,
              roofing_sheets_status: undefined,
              roof_insulation_status: undefined,
              sides_cladding_status: undefined,
              roof_trusses_status: undefined,
              wall_construction_status: undefined,
              flooring_concrete_status: undefined,
              plastering_painting_status: undefined,
              plumbing_status: undefined,

              // Site Infrastructure fields
              parking_availability_status: undefined,
              associates_restroom_status: undefined,
              zeptons_restroom_status: undefined,
              water_availability_status: undefined,
              permanent_power_status: undefined,
              temporary_connection_available: undefined,
              parking_work_status: undefined,
              dg_bed_status: undefined,
              store_shutters_status: undefined,
              approach_road_status: undefined,
              temporary_power_kva_status: undefined,
              flooring_tiles_level_issues: undefined,
              restroom_fixtures_status: undefined,
              dg_installation_status: undefined,

              // Project Specific Installation fields
              cctv_installation_status: undefined,
              lights_fans_installation_status: undefined,
              racks_installation_status: undefined,
              cold_room_installation_status: undefined,
              panda_bin_installation_status: undefined,
              crates_installation_status: undefined,
              flykiller_installation_status: undefined,
              dg_testing_status: undefined,
              cleaning_status: undefined,

              due_date: undefined
            };

         

            return this.taskService.createTask(taskData).toPromise().then(
              (response) => {
               
                return response;
              },
              (error) => {
              
                if (error.error) {
                  console.error('Error details:', error.error);
                }
                throw error;
              }
            );
          } else {
            console.warn(`User with ID ${userId} not found in available users`);
            return Promise.resolve(null);
          }
        } else {
          console.warn('Assigned user has no user_id:', assignedUser);
          return Promise.resolve(null);
        }
      }).filter(promise => promise !== null);

      if (taskPromises.length > 0) {
        await Promise.all(taskPromises);
     
      }
    } catch (error) {
      console.error('Error in createDefaultTasksForProject:', error);
    }
  }

  // Project CRUD operations
  // Fixed onSubmit method with better debugging and validation
  // Fixed onSubmit method with hardcoded role value
  onSubmit(): void {
    if (this.projectForm.valid && this.canAdd()) {
      this.isSubmitting = true;
      this.submitError = '';

      const formData = { ...this.projectForm.value };

      // Process assigned users (hardcoded role fix)
      formData.assigned_users = formData.assigned_users
        .filter((user: any) => user.user_id !== null && user.user_id !== undefined && user.user_id !== '')
        .map((user: any) => ({
          user_id: user.user_id,
          role: 'Normal User'
        }));

      // Remove documents from form data (handle separately)
      delete formData.documents;

      const assignedUsers = [...formData.assigned_users];

      this.projectService.createProject(formData).subscribe({
        next: (response) => {
         

          // Upload pending documents if any
          if (this.pendingDocuments.length > 0) {
            this.uploadPendingDocuments(response.project.id);
          }

          // Create default tasks
          if (assignedUsers.length > 0) {
            this.createDefaultTasksForProject(response.project, assignedUsers);
          }

          this.resetForm();
          this.showCreateForm = false;
          this.loadProjects();
        },
        error: (error) => {
          console.error('Error creating project:', error);
          this.submitError = error.error?.error || 'Failed to create project. Please try again.';
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    }
  }

  // Helper method to debug form validation errors
  private getFormValidationErrors(): any {
    const errors: any = {};
    Object.keys(this.projectForm.controls).forEach(key => {
      const control = this.projectForm.get(key);
      if (control && !control.valid) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }

  // FIXED: Update project method to match createProject structure exactly
  updateProject(): void {
    if (this.editProjectForm.valid && this.selectedProject && this.canEdit()) {
      this.isSubmitting = true;
      this.submitError = '';

      const formData = { ...this.editProjectForm.value };

     

      // FIXED: Process assigned users exactly like in createProject (hardcoded role fix)
      formData.assigned_users = formData.assigned_users
        .filter((user: any) => user.user_id !== null && user.user_id !== undefined && user.user_id !== '')
        .map((user: any) => ({
          user_id: user.user_id,
          role: 'Normal User'  // Same hardcoded role as createProject
        }));

      // Remove documents from form data (handle separately)
      delete formData.documents;

   

      this.projectService.updateProject(this.selectedProject.id, formData).subscribe({
        next: (response) => {
         
          if (formData.assigned_users.length > 0) {
            this.createDefaultTasksForProject(response.project, formData.assigned_users);
          }
          this.resetEditForm();
          this.showEditForm = false;
          this.loadProjects(); // Reload to see changes
        },
        error: (error) => {
          console.error('Error updating project:', error);
          console.error('Error details:', error.error);
          this.submitError = error.error?.error || error.error?.message || 'Failed to update project. Please try again.';
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      console.error('Form validation failed');
      console.error('Form errors:', this.getEditFormValidationErrors());
      this.submitError = 'Please check all required fields';
    }
  }

  // ENHANCED: Debug method for edit form validation
  private getEditFormValidationErrors(): any {
    const errors: any = {};
    Object.keys(this.editProjectForm.controls).forEach(key => {
      const control = this.editProjectForm.get(key);
      if (control && !control.valid) {
        errors[key] = control.errors;
      }
    });

    // Check assigned users array specifically
    if (this.editAssignedUsersArray) {
      this.editAssignedUsersArray.controls.forEach((control, index) => {
        if (!control.valid) {
          errors[`assigned_user_${index}`] = control.errors;
         
        }
      });
    }

    return errors;
  }

  // ENHANCED: Edit project method with better debugging
  editProject(project: Project): void {
    if (!this.canEdit()) return;

    // CRITICAL FIX: Ensure users are loaded before editing
    if (!this.usersLoaded || this.availableUsers.length === 0) {
      console.log('Users not loaded, loading users first...');
      this.loadUsers();
      // Wait for users to load then try again
      setTimeout(() => this.editProject(project), 500);
      return;
    }

  

    this.selectedProject = project;
    this.showEditForm = true;

    // Set selected state and filter cities for edit form
    this.selectedState = project.state || '';
    if (this.selectedState) {
      this.filteredCitiesList = this.citiesList
        .filter(city => city.state_name === this.selectedState)
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    // Patch basic form values
    this.editProjectForm.patchValue({
      store_code: project.store_code,
      store_name: project.store_name,
      project_code: project.project_code,
      zone: project.zone,
      city: project.city,
      state: project.state,
      site_lat_long: project.site_lat_long,
      store_type: project.store_type,
      site_type: project.site_type,
      ll_ho_date: project.ll_ho_date,
      launch_date: project.launch_date,
      project_handover_date: project.project_handover_date,
      loi_release_date: project.loi_release_date,
      token_release_date: project.token_release_date, recee_date: project.recee_date,
      recee_status: project.recee_status,
      loi_signed_status: project.loi_signed_status,
      layout: project.layout,
      project_status: project.project_status,
      property_area_sqft: project.property_area_sqft,
      criticality: project.criticality,
      address: project.address,
      actual_carpet_area_sqft: project.actual_carpet_area_sqft,
      token_released: project.token_released,
      power_availability_kva: project.power_availability_kva
    });

    // FIXED: Clear and populate assigned users properly
    this.editAssignedUsersArray.clear();

    if (project.assigned_users && project.assigned_users.length > 0) {
    
      project.assigned_users.forEach((assignedUser, index) => {
       
        // ENHANCED: Better user matching with multiple fallback approaches
        let userExists = null;

        // Try different ways to match the user
        if (assignedUser.user_id !== undefined) {
          // Method 1: Direct ID comparison
          userExists = this.availableUsers.find(u => u.id.toString() === assignedUser.user_id.toString());

          // Method 2: If not found, try without toString conversion
          if (!userExists) {
            userExists = this.availableUsers.find(u => u.id == assignedUser.user_id);
          }

          // Method 3: If still not found, try by email if available
          if (!userExists && assignedUser.email) {
            userExists = this.availableUsers.find(u => u.email === assignedUser.email);
          }
        }

       

        if (userExists) {
          const userFormGroup = this.fb.group({
            user_id: [userExists.id.toString(), Validators.required], // Use the actual user ID from availableUsers
            role: [assignedUser.role || 'Normal User', Validators.required]
          });

          this.editAssignedUsersArray.push(userFormGroup);
        
        } else {
       
          // FALLBACK: Add the user anyway but mark it for debugging
          const userFormGroup = this.fb.group({
            user_id: [assignedUser.user_id?.toString() || '', Validators.required],
            role: [assignedUser.role || 'Normal User', Validators.required]
          });
          this.editAssignedUsersArray.push(userFormGroup);
       
        }
      });

    
    } else {
      console.log('No assigned users found for this project');
    }

    // Clear and populate documents
    this.editDocumentsArray.clear();
    if (project.documents && project.documents.length > 0) {
      project.documents.forEach(doc => {
        this.editDocumentsArray.push(this.fb.group({
          name: [doc.document_name]
        }));
      });
    }

    // Force change detection to update the view
    setTimeout(() => {
     
      console.log('Form validation status:', {
        formValid: this.editProjectForm.valid,
        assignedUsersValid: this.editAssignedUsersArray.valid,
        formErrors: this.getEditFormValidationErrors()
      });
    }, 100);
  }


  confirmDeleteProject(project: Project): void {
    if (!this.canDelete()) return;
    this.projectToDelete = project;
    this.showDeleteModal = true;
  }

  deleteProject(): void {
    if (this.projectToDelete && this.canDelete()) {
      this.projectService.deleteProject(this.projectToDelete.id).subscribe({
        next: (response) => {
          console.log('Project deleted successfully:', response);
          this.showDeleteModal = false;
          this.projectToDelete = null;
          this.loadProjects();
        },
        error: (error) => {
          console.error('Error deleting project:', error);
          this.submitError = error.error?.error || 'Failed to delete project. Please try again.';
        }
      });
    }
  }

  // User CRUD operations
  showCreateUser(): void {
    if (!this.canAdd()) return;
    this.selectedUser = null;
    this.userForm.reset();
    this.userForm.patchValue({ role: 'Normal User' });
    this.showUserForm = true;
  }

  editUser(user: User): void {
    if (!this.canEdit()) return;
    this.selectedUser = user;
    this.userForm.patchValue({
      email: user.email,
      role: user.role,
      password: ''
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.showUserForm = true;
  }

  saveUser(): void {
    if (this.userForm.valid) {
      this.isSubmitting = true;
      this.submitError = '';

      const userData = { ...this.userForm.value };

      if (this.selectedUser) {
        if (!userData.password) {
          delete userData.password;
        }

        this.userService.updateUser(this.selectedUser.id, userData).subscribe({
          next: (response) => {
           
            this.resetUserForm();
            this.loadUsers();
          },
          error: (error) => {
            console.error('Error updating user:', error);
            this.submitError = error.error?.error || 'Failed to update user. Please try again.';
            this.isSubmitting = false;
          },
          complete: () => {
            this.isSubmitting = false;
          }
        });
      } else {
        this.userService.createUser(userData).subscribe({
          next: (response) => {
         
            this.resetUserForm();
            this.loadUsers();
          },
          error: (error) => {
            console.error('Error creating user:', error);
            this.submitError = error.error?.error || 'Failed to create user. Please try again.';
            this.isSubmitting = false;
          },
          complete: () => {
            this.isSubmitting = false;
          }
        });
      }
    }
  }

  confirmDeleteUser(user: User): void {
    if (!this.canDelete()) return;
    this.userToDelete = user;
    this.showDeleteUserModal = true;
  }

  deleteUser(): void {
    if (this.userToDelete && this.canDelete()) {
      this.userService.deleteUser(this.userToDelete.id).subscribe({
        next: (response) => {
        
          this.showDeleteUserModal = false;
          this.userToDelete = null;
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.submitError = error.error?.error || 'Failed to delete user. Please try again.';
        }
      });
    }
  }

  // Dynamic form methods
  addUser(): void {
    const userFormGroup = this.fb.group({
      user_id: [''],
      role: ['']
    });
    this.assignedUsersArray.push(userFormGroup);
  }

  removeUser(index: number): void {
    this.assignedUsersArray.removeAt(index);
  }

  addUserToEdit(): void {
    const userFormGroup = this.fb.group({
      user_id: ['', Validators.required], // Empty initially
      role: ['Normal User', Validators.required] // Set default role
    });

    this.editAssignedUsersArray.push(userFormGroup);
  
  }

  // FIXED: Remove user from edit form
  removeUserFromEdit(index: number): void {
    if (index >= 0 && index < this.editAssignedUsersArray.length) {
    
      this.editAssignedUsersArray.removeAt(index);
    }
  }
  
  addDocument(documentName: string, filePath: string) {
    this.documentsArray.push(
      this.fb.group({
        document_name: [documentName],
        file_path: [filePath]
      })
    );
  }

  removeDocument(index: number): void {
    this.documentsArray.removeAt(index);
  }

  addDocumentToEdit(): void {
    const documentFormGroup = this.fb.group({
      name: ['']
    });
    this.editDocumentsArray.push(documentFormGroup);
  }

  removeDocumentFromEdit(index: number): void {
    this.editDocumentsArray.removeAt(index);
  }
  // Utility methods
  isFieldInvalid(fieldName: string, form: FormGroup = this.projectForm): boolean {
    const field = form.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  filterProjects(): void {
    if (!this.searchTerm.trim()) {
      this.filteredProjects = this.projects;
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredProjects = this.projects.filter(project =>
      project.store_code.toLowerCase().includes(searchLower) ||
      project.store_name.toLowerCase().includes(searchLower) ||
      project.project_code.toLowerCase().includes(searchLower) ||
      (project.city && project.city.toLowerCase().includes(searchLower)) ||
      (project.state && project.state.toLowerCase().includes(searchLower)) ||
      (project.criticality && project.criticality.toLowerCase().includes(searchLower)) ||
      (project.address && project.address.toLowerCase().includes(searchLower))
    );
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }

  resetForm(): void {
    this.projectForm.reset();
    this.initializeForms();
    this.submitError = '';
    this.isSubmitting = false;
    this.showCreateForm = false;
    // Reset state-city selections
    this.selectedState = '';
    this.filteredCitiesList = [];
    this.pendingDocuments = [];
    this.projectDocuments = [];
  }

  resetEditForm(): void {
    this.editProjectForm.reset();
    this.selectedProject = null;
    this.submitError = '';
    this.isSubmitting = false;
    this.showEditForm = false;
    // Reset state-city selections
    this.selectedState = '';
    this.filteredCitiesList = [];
  }

  resetUserForm(): void {
    this.userForm.reset();
    this.userForm.patchValue({ role: 'Normal User' });
    this.userForm.get('password')?.setValidators([Validators.required]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.selectedUser = null;
    this.submitError = '';
    this.isSubmitting = false;
    this.showUserForm = false;
  }

  cancelDeleteProject(): void {
    this.showDeleteModal = false;
    this.projectToDelete = null;
  }

  cancelDeleteUser(): void {
    this.showDeleteUserModal = false;
    this.userToDelete = null;
  }

  // Method to handle double-click on table row
  onRowDoubleClick(event: MouseEvent, project: Project): void {
    event.preventDefault();
    event.stopPropagation();

    this.selectedRowProject = project;
    this.dropdownPosition = {
      x: event.clientX,
      y: event.clientY
    };
    this.showDropdown = true;

    // Close dropdown when clicking outside
    setTimeout(() => {
      document.addEventListener('click', this.closeDropdown.bind(this), { once: true });
    }, 0);
  }

  // Method to close dropdown
  closeDropdown(): void {
    this.showDropdown = false;
    this.selectedRowProject = null;
  }

  // Method to handle dropdown actions
  handleDropdownAction(action: string): void {
    if (!this.selectedRowProject) return;

    switch (action) {
      case 'view':
        if (this.canView()) {
          this.showProjectDetails(this.selectedRowProject);
        }
        break;
      case 'edit':
        if (this.canEdit()) {
          this.editProject(this.selectedRowProject);
        }
        break;
      case 'delete':
        if (this.canDelete()) {
          this.confirmDeleteProject(this.selectedRowProject);
        }
        break;
    }

    this.closeDropdown();
  }
  
  // File ->
  onDocumentFileSelected(event: any): void {
    const fileInput = event.target;
    if (fileInput.files.length === 0) return;

    const file = fileInput.files[0];

    // Validate file size (e.g., max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size should not exceed 10MB');
      fileInput.value = '';
      return;
    }

    // Validate file type
    const allowedTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      alert('Invalid file type. Please select: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, JPEG, PNG');
      fileInput.value = '';
      return;
    }

    // Add to pending documents
    this.pendingDocuments.push(file);
    fileInput.value = ''; // Reset input


  }

  // NEW: Upload pending documents after project creation
  private uploadPendingDocuments(projectId: number): void {
    if (this.pendingDocuments.length === 0) return;

    this.uploadingDocument = true;
    this.uploadError = '';
  //  console.log(projectId);
    const uploadPromises = this.pendingDocuments.map(file =>
      
      this.projectService.uploadProjectDocument(projectId, file).toPromise()
    );

    Promise.all(uploadPromises).then(
      (responses) => {
      
        this.pendingDocuments = []; // Clear pending documents
        this.uploadingDocument = false;

        // Reload project to show uploaded documents
        this.loadProjectDocuments(projectId);
      },
      (error) => {
        console.error('Error uploading documents:', error);
        this.uploadError = 'Some documents failed to upload';
        this.uploadingDocument = false;
      }
    );
  }

  // NEW: Load project documents
  loadProjectDocuments(projectId: number): void {
    this.projectService.getProjectDocuments(projectId).subscribe({
      next: (response) => {
        this.projectDocuments = response.documents;
      },
      error: (error) => {
        console.error('Error loading project documents:', error);
      }
    });
  }
  
  removePendingDocument(index: number): void {
    this.pendingDocuments.splice(index, 1);
  }

  // NEW: Download document
  downloadDocument(document: ProjectDocument): void {
    const url = this.projectService.getDocumentUrl(document.file_path);
    window.open(url, '_blank');
  }

  deleteDocument(document: ProjectDocument): void {
    if (confirm(`Are you sure you want to delete "${document.document_name}"?`)) {
      this.projectService.deleteProjectDocument(document.id).subscribe({
        next: () => {
          
          // Remove from local array
          this.projectDocuments = this.projectDocuments.filter(doc => doc.id !== document.id);
        },
        error: (error) => {
          console.error('Error deleting document:', error);
          alert('Failed to delete document');
        }
      });
    }
  }

  // NEW: Get file size in readable format
  getFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // NEW: Get file type icon
  getFileTypeIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    return this.projectService.getFileTypeIcon(extension);
  }
  
  filters: {
    store_code: string;
    store_name: string;
    project_code: string;
    zone: string;
    city: string;
    state: string;
    site_lat_long: string;
    store_type: string;
    site_type: string;
    project_status: string;
    criticality: string;
    address: string;
    created_by: string;
    recee_status: string;
    ll_ho_date: string;
    launch_date: string;
    project_handover_date: string;
    layout: string;
    token_released: string;
  } = {
      store_code: '',
      store_name: '',
      project_code: '',
      zone: '',
      city: '',
      state: '',
      site_lat_long: '',
      store_type: '',
      site_type: '',
      project_status: '',
      criticality: '',
      address: '',
      created_by: '',
      recee_status: '',
      ll_ho_date: '',
      launch_date: '',
      project_handover_date: '',
      layout: '',
      token_released: ''
    };

  // Enhanced apply column filter method
  applyColumnFilter(): void {
    this.filteredProjects = this.projects.filter(project => {
      return (
        (!this.filters.store_code || project.store_code.toLowerCase().includes(this.filters.store_code.toLowerCase())) &&
        (!this.filters.store_name || project.store_name.toLowerCase().includes(this.filters.store_name.toLowerCase())) &&
        (!this.filters.project_code || project.project_code.toLowerCase().includes(this.filters.project_code.toLowerCase())) &&
        (!this.filters.zone || project.zone?.toLowerCase().includes(this.filters.zone.toLowerCase())) &&
        (!this.filters.city || project.city?.toLowerCase().includes(this.filters.city.toLowerCase())) &&
        (!this.filters.state || project.state?.toLowerCase().includes(this.filters.state.toLowerCase())) &&
        (!this.filters.site_lat_long || project.site_lat_long?.toLowerCase().includes(this.filters.site_lat_long.toLowerCase())) &&
        (!this.filters.store_type || project.store_type?.toLowerCase().includes(this.filters.store_type.toLowerCase())) &&
        (!this.filters.site_type || project.site_type?.toLowerCase().includes(this.filters.site_type.toLowerCase())) &&
        (!this.filters.project_status || project.project_status?.toLowerCase().includes(this.filters.project_status.toLowerCase())) &&
        (!this.filters.criticality || project.criticality?.toLowerCase().includes(this.filters.criticality.toLowerCase())) &&
        (!this.filters.address || project.address?.toLowerCase().includes(this.filters.address.toLowerCase())) &&
        (!this.filters.created_by || project.created_by_email?.toLowerCase().includes(this.filters.created_by.toLowerCase())) &&
        (!this.filters.recee_status || project.recee_status?.toLowerCase().includes(this.filters.recee_status.toLowerCase())) &&
        (!this.filters.layout || project.layout?.toLowerCase().includes(this.filters.layout.toLowerCase())) &&
        (!this.filters.token_released || project.token_released?.toLowerCase().includes(this.filters.token_released.toLowerCase())) // &&
      //  (!this.filters.ll_ho_date || this.matchesDateFilter(project.ll_ho_date?.toString(), this.filters.ll_ho_date)) &&
      //  (!this.filters.launch_date || this.matchesDateFilter(project.launch_date, this.filters.launch_date)) &&
      //  (!this.filters.project_handover_date || this.matchesDateFilter(project.project_handover_date, this.filters.project_handover_date))
      );
    });
  }

  // Helper method for date filtering
  private matchesDateFilter(projectDate: string | null, filterDate: string): boolean {
    if (!projectDate || !filterDate) return true;
    const pDate = new Date(projectDate).toISOString().split('T')[0];
    return pDate === filterDate;
  }

  // Enhanced filterBySiteType method that works with other filters
  filterBySiteType(siteType: string): void {
    // Update the site_type filter
    this.filters.site_type = siteType;

    // Apply all filters including the new site_type filter
    this.applyColumnFilter();
  }

  // Method to clear all filters
  clearAllFilters(): void {
    // Reset all filter values
    Object.keys(this.filters).forEach(key => {
      (this.filters as any)[key] = '';
    });

    // Reset search term
    this.searchTerm = '';

    // Show all projects
    this.filteredProjects = [...this.projects];
  }

  // Method to clear individual filter
  clearFilter(filterName: string): void {
    (this.filters as any)[filterName] = '';
    this.applyColumnFilter();
  }

  // Get unique values for dropdown filters
  getUniqueValues(fieldName: keyof Project): string[] {
    const values = this.projects
      .map(project => project[fieldName])
      .filter(value => value !== null && value !== undefined && value !== '')
      .map(value => String(value))
      .filter((value, index, arr) => arr.indexOf(value) === index)
      .sort();

    return values;
  }


  /**
 * Downloads the current filtered projects as a CSV file
 */
  downloadProjectsAsCSV(): void {
    // Define headers (align with table columns)
    const headers = [
      'Store Code',
      'Store Name',
      'Project Code',
      'Zone',
      'City',
      'State',
      'Site Lat/Long',
      'Store Type',
      'Site Type',
      'Project Status',
      'LL HO Date',
      'Launch Date',
      'Project Handover Date',
      'Layout',
      'Token Released',
      'Criticality',
      'Address',
   //   'Created By',
      'Created At',
      //'Assigned Users Count',
     // 'Tasks Count'
    ];

    // Prepare rows from filteredProjects
    const rows = this.filteredProjects.map(project => ({
      storeCode: project.store_code || '',
      storeName: project.store_name || '',
      projectCode: project.project_code || '',
      zone: project.zone || '',
      city: project.city || '',
      state: project.state || '',
      siteLatLong: project.site_lat_long || '',
      storeType: project.store_type || '',
      siteType: project.site_type || '',
      projectStatus: project.project_status || '',
      llHoDate: project.ll_ho_date || '',
      launchDate: project.launch_date || '',
      handoverDate: project.project_handover_date || '',
      layout: project.layout || '',
      tokenReleased: project.token_released || '',
      criticality: project.criticality || '',
      address: project.address || '',
  //    createdBy: project.created_by || '',
      createdAt: project.created_at || '',
      assignedUsersCount: project.assigned_users?.length || 0,
    //  tasksCount: project.tasks_count || 0,
    //  AssignedBy: project.created_by
    }));

    // Generate CSV content
    const csvContent = [
      headers.join(','), // Header row
      ...rows.map(row =>
        [
          this.escapeCsvField(row.storeCode),
          this.escapeCsvField(row.storeName),
          this.escapeCsvField(row.projectCode),
          this.escapeCsvField(row.zone),
          this.escapeCsvField(row.city),
          this.escapeCsvField(row.state),
          this.escapeCsvField(row.siteLatLong),
          this.escapeCsvField(row.storeType),
          this.escapeCsvField(row.siteType),
          this.escapeCsvField(row.projectStatus),
          this.escapeCsvField(row.llHoDate),
          this.escapeCsvField(row.launchDate),
          this.escapeCsvField(row.handoverDate),
          this.escapeCsvField(row.layout),
          this.escapeCsvField(row.tokenReleased),
          this.escapeCsvField(row.criticality),
          this.escapeCsvField(row.address),
      //    this.escapeCsvField(row.createdBy),
          this.escapeCsvField(row.createdAt),
      //    row.assignedUsersCount,
       //   row.tasksCount
        ].join(',')
      )
    ].join('\n');

    // Create blob and trigger download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date().toISOString().slice(0, 10); // e.g., 2025-04-05
    a.download = `projects-export-${now}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
  
  private escapeCsvField(value: string | number): string {
    if (value == null) return '';
    const str = value.toString();
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`; // Escape double quotes
    }
    return str;
  }
  // State City ->
  // Toggle State-City Editor
  toggleStateCityEditor(): void {
    this.showStateCityEditor = !this.showStateCityEditor;

    if (this.showStateCityEditor) {
      // Always reload editor data when opening
      this.loadStateCityDataForEditor();
    } else {
      // Clear editing state when closing
      this.editingRowIndex = null;
      this.originalRowData = null;
     
    }
  }
  
  loadStateCityDataForEditor(): void {
    this.isLoadingStateCityData = true;

    // Make a direct call to get the raw CSV data for editing
    this.projectService.getStateCityDataForEditing().subscribe({
      next: (response) => {
        console.log('Raw CSV data loaded for editing:', response);

        // Store the original data
        this.originalCsvData = response.data || [];

        // Create editable rows from the raw CSV data
        this.stateCityRows = this.originalCsvData.map(row => ({ ...row })); // Deep copy

        this.isLoadingStateCityData = false;
   

        console.log('Editor rows prepared:', this.stateCityRows.length);
      },
      error: (error) => {
        console.error('Error loading state-city data for editing:', error);
        this.stateCityError = 'Failed to load data: ' + (error.error?.error || 'Network error');
        this.isLoadingStateCityData = false;
      }
    });
  }

  // Convert API response to editable rows
  convertResponseToRows(response: StateCityResponse): void {
    const rows: StateCityRow[] = response.cities.map(city => ({
      State: city.state_name,
      'State Code': response.states.find(s => s.name === city.state_name)?.code || '',
      'District Code': city.district_code || '',
      'District Name': city.name,
      'Town Code': '',
      'Town Name': ''
    }));

    this.stateCityRows = Array.from(new Map(
      rows.map(row => [`${row.State}-${row['District Name']}`, row])
    ).values()).sort((a, b) =>
      a.State.localeCompare(b.State) || a['District Name'].localeCompare(b['District Name'])
    );
  }

  // CRUD operations for CSV rows
  addNewRow(): void {
    const newRow: StateCityRow = {
      State: '',
      'State Code': '',
      'District Code': '',
      'District Name': '',
      'Town Code': '',
      'Town Name': ''
    };

    // Add to both the display array and track as new
    this.stateCityRows.push(newRow);

    // Start editing the new row
    this.startEdit(this.stateCityRows.length - 1);

    console.log('New row added. Total rows:', this.stateCityRows.length);
  }

  startEdit(index: number): void {
    // Save any current edit first
    if (this.editingRowIndex !== null && this.editingRowIndex !== index) {
      this.saveRow(this.editingRowIndex);
    }

    this.originalRowData = { ...this.stateCityRows[index] };
    this.editingRowIndex = index;

    console.log('Started editing row:', index);
  }

  // Enhanced: Better save handling
  saveRow(index: number): void {
    console.log('Saving row:', index, this.stateCityRows[index]);

    this.editingRowIndex = null;
    this.originalRowData = null;

    // Optionally validate the row data here
    const row = this.stateCityRows[index];
    if (!row.State || !row['District Name']) {
      console.warn('Row has missing required data:', row);
    }
  }



  cancelEdit(): void {
    if (this.originalRowData !== null && this.editingRowIndex !== null) {
      // If this was a new row (empty original data), remove it
      if (!this.originalRowData.State && !this.originalRowData['District Name']) {
        this.stateCityRows.splice(this.editingRowIndex, 1);
        console.log('Cancelled new row creation');
      } else {
        // Restore original data
        this.stateCityRows[this.editingRowIndex] = { ...this.originalRowData };
        console.log('Cancelled edit, restored original data');
      }
    }

    this.editingRowIndex = null;
    this.originalRowData = null;
  }


  deleteRow(index: number): void {
    if (confirm('Are you sure you want to delete this row?')) {
      console.log('Deleting row at index:', index);
      this.stateCityRows.splice(index, 1);

      // If we were editing the deleted row, clear edit state
      if (this.editingRowIndex === index) {
        this.editingRowIndex = null;
        this.originalRowData = null;
      } else if (this.editingRowIndex !== null && this.editingRowIndex > index) {
        // Adjust editing index if needed
        this.editingRowIndex--;
      }

      console.log('Row deleted. Remaining rows:', this.stateCityRows.length);
    }
  }


  // Bulk operations
  saveAllChanges(): void {
    if (this.editingRowIndex !== null) {
      // Save current row first
      this.saveRow(this.editingRowIndex);
    }

    console.log('Saving all changes. Total rows:', this.stateCityRows.length);
    this.isLoadingStateCityData = true;
    this.stateCityError = '';

    this.projectService.updateStateCityData(this.stateCityRows).subscribe({
      next: (response) => {
        console.log('Save successful:', response);
        alert(response.message || 'State-City data updated successfully!');

        // FIXED: Process the saved data immediately for dropdowns
        this.processStateCityDataFromArray(this.stateCityRows);

        // Also reload editor data to reflect any backend processing
        setTimeout(() => {
          this.loadStateCityDataForEditor();
        }, 500);

        this.isLoadingStateCityData = false;
      },
      error: (error) => {
        console.error('Save failed:', error);
        this.stateCityError = 'Save failed: ' + (error.error?.error || 'Network error');
        this.isLoadingStateCityData = false;
      }
    });
  }

  processStateCityDataFromArray(data: any[]): void {
    console.log('Processing data for dropdowns, total rows:', data.length);

    const statesMap = new Map<string, StateItem>();
    const citiesArray: CityItem[] = [];

    data.forEach((row: any, index: number) => {
      // Handle different possible column names
      const state = row.State || row.state || row.STATE;
      const city = row['District Name'] || row['Town Name'] || row.District || row.City || row.city;
      const stateCode = row['State Code'] || row.StateCode || row.state_code;
      const districtCode = row['District Code'] || row.DistrictCode || row.district_code;

      if (state && city) {
        const stateName = state.toString().trim();
        const cityName = city.toString().trim();

        // Add state if not exists
        if (!statesMap.has(stateName)) {
          statesMap.set(stateName, {
            name: stateName,
            code: stateCode?.toString().trim() || ''
          });
        }

        // Add city
        citiesArray.push({
          name: cityName,
          state_name: stateName,
          district_code: districtCode?.toString().trim() || ''
        });
      } else {
        // Log missing data for debugging
        if (index < 5) {
          console.log(`Row ${index} missing state or city:`, row);
        }
      }
    });

    // Convert states map to array and sort
    this.statesList = Array.from(statesMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));

    // Remove duplicate cities and sort
    const citiesMap = new Map<string, CityItem>();
    citiesArray.forEach(city => {
      const key = `${city.name}-${city.state_name}`;
      if (!citiesMap.has(key)) {
        citiesMap.set(key, city);
      }
    });

    this.citiesList = Array.from(citiesMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));

    // Update the filtered cities if a state is currently selected
    if (this.selectedState) {
      this.filteredCitiesList = this.citiesList
        .filter(city => city.state_name === this.selectedState)
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    this.stateCityDataLoaded = true;

    console.log('Updated dropdown data:', {
      states: this.statesList.length,
      cities: this.citiesList.length,
      filteredCities: this.filteredCitiesList.length
    });
  }
  downloadStateCityCSV(): void {
    this.projectService.exportStateCityCSV().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `StateCity-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        alert('Export failed');
      }
    });
  }

  // Load State-City data from CSV - FIXED VERSION
  loadStateCityData(): void {
    this.isLoadingStateCityData = true;


    this.projectService.getStateCityData().subscribe({
      next: (response) => {
        console.log('State-City data loaded for dropdowns:', response);

        this.statesList = response.states || [];
        this.citiesList = response.cities || [];
        this.stateCityDataLoaded = true;
        this.isLoadingStateCityData = false;

        console.log('States loaded:', this.statesList.length);
        console.log('Cities loaded:', this.citiesList.length);
      },
      error: (error) => {
        console.error('Error loading state-city data:', error);
        this.stateCityError = 'Failed to load state-city data';
        this.isLoadingStateCityData = false;
      }
    });
  }

  private tryLoadingFromPaths(paths: string[], index: number): void {
    if (index >= paths.length) {
      console.error('CSV file not found in any of the attempted paths');
      this.loadFallbackStateCityData();
      return;
    }

    const currentPath = paths[index];
    // console.log(`Attempting to load CSV from: ${currentPath}`);

    this.http.get(currentPath, { responseType: 'text' }).subscribe({
      next: (csvData: string) => {
        /*    console.log(`CSV file loaded successfully from: ${currentPath}`);
            console.log(`CSV data length: ${csvData.length}`);
            console.log(`First 200 characters:`, csvData.substring(0, 200));*/
        this.processStateCityData(csvData);
      },
      error: (error: any) => {
        console.error(`Error loading from ${currentPath}:`, error);
        // Try next path
        this.tryLoadingFromPaths(paths, index + 1);
      }
    });
  }

  // Enhanced CSV processing with better error handling
  // Fixed CSV processing method with proper TypeScript types
  processStateCityData(csvData: string): void {
    if (!csvData || csvData.trim().length === 0) {
      console.error('CSV data is empty');
      this.loadFallbackStateCityData();
      return;
    }

    //  console.log('Starting CSV parsing...');

    // Fix the Papa Parse call - remove the type casting issue
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      delimitersToGuess: [',', '\t', '|', ';'],
      complete: (results: Papa.ParseResult<any>) => {
        // console.log('Papa Parse results:', results);

        if (results.errors && results.errors.length > 0) {
          //   console.warn('CSV parsing errors:', results.errors);
        }

        try {
          const data = results.data;
          //  console.log('Parsed data sample:', data.slice(0, 5));
          //  console.log('Data headers:', results.meta?.fields);

          if (!data || data.length === 0) {
            //    console.error('No data found in CSV');
            this.loadFallbackStateCityData();
            return;
          }

          // Check the actual column names in your CSV
          const firstRow = data[0];
          //  console.log('First row keys:', Object.keys(firstRow));

          // Extract unique states and cities
          const statesMap = new Map<string, StateItem>();
          const citiesArray: CityItem[] = [];

          data.forEach((row: any, index: number) => {
            // Try different possible column names
            const state = row.State || row.state || row.STATE;
            const city = row['District Name'] || row['District'] || row.City || row.city || row.CITY;
            const stateCode = row.StateCode || row['State Code'] || row.state_code;
            const districtCode = row.DistrictCode || row['District Code'] || row.district_code;

            if (state && city) {
              const stateName = state.toString().trim();
              const cityName = city.toString().trim();

              // Add state if not exists
              if (!statesMap.has(stateName)) {
                statesMap.set(stateName, {
                  name: stateName,
                  code: stateCode?.toString().trim()
                });
              }

              // Add city
              citiesArray.push({
                name: cityName,
                state_name: stateName,
                district_code: districtCode?.toString().trim()
              });
            } else {
              if (index < 5) { // Only log first 5 rows to avoid spam
                console.warn(`Row ${index} missing required data:`, { state, city, row });
              }
            }
          });

          // Convert states map to array and sort
          this.statesList = Array.from(statesMap.values())
            .sort((a, b) => a.name.localeCompare(b.name));

          // Remove duplicate cities and sort
          const citiesMap = new Map<string, CityItem>();
          citiesArray.forEach(city => {
            const key = `${city.name}-${city.state_name}`;
            if (!citiesMap.has(key)) {
              citiesMap.set(key, city);
            }
          });

          this.citiesList = Array.from(citiesMap.values())
            .sort((a, b) => a.name.localeCompare(b.name));

          this.stateCityDataLoaded = true;
          /* console.log('State-City data loaded successfully:', {
             states: this.statesList.length,
             cities: this.citiesList.length
           });*/

          // Log some sample data
          //    console.log('Sample states:', this.statesList.slice(0, 5));
          //   console.log('Sample cities:', this.citiesList.slice(0, 5));

        } catch (error) {
          console.error('Error processing CSV data:', error);
          this.loadFallbackStateCityData();
        }
      },
      error: (error: any) => {
        console.error('Papa Parse error:', error);
        this.loadFallbackStateCityData();
      }
    });
  }

  // Alternative method using File API if HTTP method doesn't work
  loadStateCityDataAlternative(): void {
    // Method 1: Try HTTP first
    this.http.get('assets/StateCity.csv', { responseType: 'text' }).subscribe({
      next: (csvData: string) => {

        this.processStateCityData(csvData);
      },
      error: (httpError) => {
        console.error('HTTP method failed:', httpError);

        // Method 2: Try using fetch as fallback
        fetch('assets/StateCity.csv')
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
          })
          .then(csvData => {

            this.processStateCityData(csvData);
          })
          .catch(fetchError => {
            console.error('Fetch method also failed:', fetchError);
            console.error('File not found. Check if StateCity.csv exists in src/assets/');
            this.loadFallbackStateCityData();
          });
      }
    });
  }

  // Fallback data in case CSV loading fails
  loadFallbackStateCityData(): void {
    this.statesList = [
      { name: 'Andhra Pradesh' },
      { name: 'Arunachal Pradesh' },
      { name: 'Assam' },
      { name: 'Bihar' },
      { name: 'Chhattisgarh' },
      { name: 'Delhi' },
      { name: 'Goa' },
      { name: 'Gujarat' },
      { name: 'Haryana' },
      { name: 'Himachal Pradesh' },
      { name: 'Jharkhand' },
      { name: 'Karnataka' },
      { name: 'Kerala' },
      { name: 'Madhya Pradesh' },
      { name: 'Maharashtra' },
      { name: 'Manipur' },
      { name: 'Meghalaya' },
      { name: 'Mizoram' },
      { name: 'Nagaland' },
      { name: 'Odisha' },
      { name: 'Punjab' },
      { name: 'Rajasthan' },
      { name: 'Sikkim' },
      { name: 'Tamil Nadu' },
      { name: 'Telangana' },
      { name: 'Tripura' },
      { name: 'Uttar Pradesh' },
      { name: 'Uttarakhand' },
      { name: 'West Bengal' }
    ].sort((a, b) => a.name.localeCompare(b.name));

    this.citiesList = [
      { name: 'Mumbai', state_name: 'Maharashtra' },
      { name: 'Delhi', state_name: 'Delhi' },
      { name: 'Bangalore', state_name: 'Karnataka' },
      { name: 'Hyderabad', state_name: 'Telangana' },
      { name: 'Chennai', state_name: 'Tamil Nadu' },
      { name: 'Kolkata', state_name: 'West Bengal' },
      { name: 'Pune', state_name: 'Maharashtra' },
      { name: 'Ahmedabad', state_name: 'Gujarat' },
      { name: 'Jaipur', state_name: 'Rajasthan' },
      { name: 'Lucknow', state_name: 'Uttar Pradesh' }
    ].sort((a, b) => a.name.localeCompare(b.name));

    this.stateCityDataLoaded = true;

  }

  // Handle state selection change
  onStateChange(event: any): void {
    const selectedStateName = event.target.value;
    this.selectedState = selectedStateName;

    if (selectedStateName) {
      // Filter cities based on selected state
      this.filteredCitiesList = this.citiesList
        .filter(city => city.state_name === selectedStateName)
        .sort((a, b) => a.name.localeCompare(b.name));

      // Reset city selection in form
      this.projectForm.patchValue({ city: '' });
      if (this.showEditForm) {
        this.editProjectForm.patchValue({ city: '' });
      }
    } else {
      this.filteredCitiesList = [];
      this.projectForm.patchValue({ city: '' });
      if (this.showEditForm) {
        this.editProjectForm.patchValue({ city: '' });
      }
    }
  }
  // Resizer
  startResize(event: MouseEvent, columnIndex: number): void {
    this.isResizing = true;
    this.currentColumn = columnIndex;
    this.startX = event.clientX;

    const th = (event.target as HTMLElement).parentElement as HTMLTableCellElement;
    this.startWidth = th.offsetWidth;

    document.addEventListener('mousemove', this.doResize.bind(this));
    document.addEventListener('mouseup', this.stopResize.bind(this));

    document.body.classList.add('column-resizing');
    event.preventDefault();
  }

  private doResize(event: MouseEvent): void {
    if (!this.isResizing) return;

    const diff = event.clientX - this.startX;
    const newWidth = Math.max(80, this.startWidth + diff);

    const table = document.querySelector('.data-table') as HTMLTableElement;
    const headerCells = table.querySelectorAll('thead tr:last-child th');
    const targetCell = headerCells[this.currentColumn] as HTMLTableCellElement;

    if (targetCell) {
      targetCell.style.width = newWidth + 'px';
      targetCell.style.minWidth = newWidth + 'px';
    }
  }

  private stopResize(): void {
    this.isResizing = false;
    this.currentColumn = -1;

    document.removeEventListener('mousemove', this.doResize.bind(this));
    document.removeEventListener('mouseup', this.stopResize.bind(this));

    document.body.classList.remove('column-resizing');
  }
}

