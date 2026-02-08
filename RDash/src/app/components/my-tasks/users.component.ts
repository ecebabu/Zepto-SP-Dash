import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserService } from '../../Services/user.service';
import { AuthService } from '../../Services/auth.service';
import { User, CreateUserRequest, UpdateUserRequest } from '../../user.model';
import { AbstractControl, ValidationErrors } from '@angular/forms';
@Component({
  selector: 'app-users',
  template: `
    <div class="users-container">
      <div class="users-header">
        <h1>User Management</h1>
        <p>Manage system users and their roles</p>
        <button 
          class="create-user-btn" 
          (click)="openCreateModal()"
          *ngIf="isAdmin">
          <span class="btn-icon">+</span>
          Create User
        </button>
      </div>
      
      <!-- Loading State -->
      <div class="loading-container" *ngIf="loading">
        <div class="loading-spinner"></div>
        <p>Loading users...</p>
      </div>

      <!-- Error State -->
      <div class="error-container" *ngIf="error">
        <div class="error-icon">⚠️</div>
        <p>{{ error }}</p>
        <button class="retry-btn" (click)="loadUsers()">Retry</button>
      </div>

      <!-- Users Table -->
      <div class="users-content" *ngIf="!loading && !error">
        <div class="users-table-container">
          <table class="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created At</th>
                <th class="actions-column" *ngIf="isAdmin">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of users; trackBy: trackByUserId" class="user-row">
                <td>{{ user.id }}</td>
                <td>{{ user.email }}</td>
                <td>
                  <span class="role-badge" [ngClass]="getRoleClass(user.role)">
                    {{ user.role }}
                  </span>
                </td>
                <td>{{ formatDate(user.created_at) }}</td>
                <td class="actions-cell" *ngIf="isAdmin">
                  <button 
                    class="action-btn edit-btn" 
                    (click)="openEditModal(user)"
                    title="Edit User">
                    ✏️
                  </button>
                  <button 
                    class="action-btn delete-btn" 
                    (click)="confirmDelete(user)"
                    [disabled]="user.id === currentUser?.id"
                    title="{{ user.id === currentUser?.id ? 'Cannot delete yourself' : 'Delete User' }}">
                    🗑️
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div class="empty-state" *ngIf="users.length === 0">
            <div class="empty-icon">👥</div>
            <h3>No Users Found</h3>
            <p>There are no users in the system yet.</p>
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ isEditMode ? 'Edit User' : 'Create New User' }}</h2>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>
          
          <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="user-form">
            <div class="form-group">
             <label for="email">Email or Phone Number</label>
<input
  type="text"
  id="email"
  formControlName="email"
  class="form-control"
  placeholder="Enter email or phone number"
>
              <div class="error-message" *ngIf="userForm.get('email')?.invalid && userForm.get('email')?.touched">
                <span *ngIf="userForm.get('email')?.errors?.['required']">Email is required</span>
                <span *ngIf="userForm.get('email')?.errors?.['email']">Please enter a valid email</span>
              </div>
            </div>

            <div class="form-group" *ngIf="!isEditMode">
              <label for="password">Password</label>
              <input 
                type="password" 
                id="password"
                formControlName="password"
                class="form-control"
                [class.error]="userForm.get('password')?.invalid && userForm.get('password')?.touched">
              <div class="error-message" *ngIf="userForm.get('password')?.invalid && userForm.get('password')?.touched">
                <span *ngIf="userForm.get('password')?.errors?.['required']">Password is required</span>
                <span *ngIf="userForm.get('password')?.errors?.['minlength']">Password must be at least 6 characters</span>
              </div>
            </div>

            <div class="form-group" *ngIf="isEditMode">
              <label for="newPassword">New Password (leave blank to keep current)</label>
              <input 
                type="password" 
                id="newPassword"
                formControlName="password"
                class="form-control"
                placeholder="Enter new password or leave blank">
              <div class="error-message" *ngIf="userForm.get('password')?.invalid && userForm.get('password')?.touched">
                <span *ngIf="userForm.get('password')?.errors?.['minlength']">Password must be at least 6 characters</span>
              </div>
            </div>

            <div class="form-group">
              <label for="role">Role</label>
              <select 
                id="role"
                formControlName="role"
                class="form-control"
                [class.error]="userForm.get('role')?.invalid && userForm.get('role')?.touched">
                <option value="">Select a role</option>
                <option *ngFor="let role of availableRoles" [value]="role">{{ role }}</option>
              </select>
              <div class="error-message" *ngIf="userForm.get('role')?.invalid && userForm.get('role')?.touched">
                <span *ngIf="userForm.get('role')?.errors?.['required']">Role is required</span>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="cancel-btn" (click)="closeModal()">Cancel</button>
              <button 
                type="submit" 
                class="submit-btn"
                [disabled]="userForm.invalid || submitting">
                <span *ngIf="submitting" class="loading-spinner small"></span>
                {{ submitting ? 'Saving...' : (isEditMode ? 'Update User' : 'Create User') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div class="modal-overlay" *ngIf="showDeleteModal" (click)="closeDeleteModal()">
        <div class="modal-content delete-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Confirm Delete</h2>
            <button class="close-btn" (click)="closeDeleteModal()">×</button>
          </div>
          
          <div class="delete-content">
            <div class="warning-icon">⚠️</div>
            <p>Are you sure you want to delete the user <strong>{{ userToDelete?.email }}</strong>?</p>
            <p class="warning-text">This action cannot be undone.</p>
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-btn" (click)="closeDeleteModal()">Cancel</button>
            <button 
              class="delete-confirm-btn"
              (click)="deleteUser()"
              [disabled]="deleting">
              <span *ngIf="deleting" class="loading-spinner small"></span>
              {{ deleting ? 'Deleting...' : 'Delete User' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Success Message -->
      <div class="success-message" *ngIf="successMessage" [@fadeInOut]>
        {{ successMessage }}
      </div>
    </div>
  `,
  styles: [`
    .users-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .users-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      flex-wrap: wrap;
      gap: 20px;
    }

    .users-header div {
      flex: 1;
    }

    .users-header h1 {
      font-size: 32px;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 8px 0;
    }

    .users-header p {
      color: #6b7280;
      margin: 0;
      font-size: 16px;
    }

    .create-user-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background-color 0.2s;
    }

    .create-user-btn:hover {
      background: #2563eb;
    }

    .btn-icon {
      font-size: 18px;
      font-weight: bold;
    }

    .loading-container, .error-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      padding: 60px 40px;
      text-align: center;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f4f6;
      border-top: 4px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    .loading-spinner.small {
      width: 16px;
      height: 16px;
      border-width: 2px;
      margin: 0;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-container {
      border-left: 4px solid #ef4444;
    }

    .error-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .retry-btn {
      background: #ef4444;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      margin-top: 16px;
    }

    .users-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .users-table-container {
      overflow-x: auto;
    }

    .users-table {
      width: 100%;
      border-collapse: collapse;
    }

    .users-table th {
      background: #f9fafb;
      padding: 16px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 1px solid #e5e7eb;
    }

    .users-table td {
      padding: 16px;
      border-bottom: 1px solid #f3f4f6;
    }

    .user-row:hover {
      background: #f9fafb;
    }

    .role-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .role-badge.admin {
      background: #fee2e2;
      color: #dc2626;
    }

    .role-badge.super-admin {
      background: #fef3c7;
      color: #d97706;
    }

    .role-badge.editor {
      background: #dbeafe;
      color: #2563eb;
    }

    .role-badge.normal-user {
      background: #f3f4f6;
      color: #6b7280;
    }

    .role-badge.associate {
      background: #ecfdf5;
      color: #059669;
    }

    .role-badge.ground-team {
      background: #f0f9ff;
      color: #0284c7;
    }

    .actions-column {
      width: 120px;
    }

    .actions-cell {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      background: none;
      border: 1px solid #d1d5db;
      padding: 8px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }

    .action-btn:hover:not(:disabled) {
      background: #f3f4f6;
    }

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .edit-btn:hover:not(:disabled) {
      border-color: #3b82f6;
      color: #3b82f6;
    }

    .delete-btn:hover:not(:disabled) {
      border-color: #ef4444;
      color: #ef4444;
    }

    .empty-state {
      text-align: center;
      padding: 60px 40px;
      color: #6b7280;
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 500px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #6b7280;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
    }

    .close-btn:hover {
      background: #f3f4f6;
    }

    .user-form {
      padding: 24px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: #374151;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 16px;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-control.error {
      border-color: #ef4444;
    }

    .error-message {
      color: #ef4444;
      font-size: 14px;
      margin-top: 4px;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 32px;
    }

    .cancel-btn {
      background: none;
      border: 1px solid #d1d5db;
      color: #6b7280;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }

    .cancel-btn:hover {
      background: #f9fafb;
    }

    .submit-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .submit-btn:hover:not(:disabled) {
      background: #2563eb;
    }

    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .delete-modal {
      max-width: 400px;
    }

    .delete-content {
      padding: 24px;
      text-align: center;
    }

    .warning-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .warning-text {
      color: #6b7280;
      font-size: 14px;
    }

    .delete-confirm-btn {
      background: #ef4444;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .delete-confirm-btn:hover:not(:disabled) {
      background: #dc2626;
    }

    .delete-confirm-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .success-message {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 500;
      z-index: 1001;
      animation: fadeInOut 3s ease-in-out;
    }

    @keyframes fadeInOut {
      0%, 100% { opacity: 0; transform: translateX(100%); }
      10%, 90% { opacity: 1; transform: translateX(0); }
    }

    @media (max-width: 768px) {
      .users-container {
        padding: 10px;
      }

      .users-header {
        flex-direction: column;
        align-items: stretch;
      }

      .create-user-btn {
        align-self: flex-start;
      }

      .modal-content {
        margin: 10px;
        max-width: none;
      }

      .users-table {
        font-size: 14px;
      }

      .users-table th,
      .users-table td {
        padding: 12px 8px;
      }
    }
  `]
})
export class UsersComponent implements OnInit, OnDestroy {
  users: User[] = [];
  loading = false;
  error: string | null = null;
  submitting = false;
  deleting = false;
  showModal = false;
  showDeleteModal = false;
  isEditMode = false;
  userToDelete: User | null = null;
  currentUser: User | null = null;
  successMessage = '';

  userForm: FormGroup;
  availableRoles = ['Admin', 'Normal User', 'Editor', 'Associate', 'Ground Team', 'Super Admin'];

  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.userForm = this.createUserForm();
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  trackByUserId(index: number, user: User): number {
    return user.id;
  }

  // Add this custom validator function inside your component class
  static emailOrPhoneValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value?.trim();
    if (!value) return null;

    const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
    const isPhone = /^[\+]?[0-9]{10,13}$/.test(value); // 10–13 digits, optional +

    return isEmail || isPhone ? null : { emailOrPhone: true };
  }

  // Inside createUserForm() method
  createUserForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required]],
      password: [''],
      role: ['', Validators.required]
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    this.userService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.users = response.users;
          this.loading = false;
        },
        error: (error) => {
          this.error = error.error?.error || 'Failed to load users';
          this.loading = false;
        }
      });
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.userForm.reset();
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.showModal = true;
  }

  openEditModal(user: User): void {
    this.isEditMode = true;
    this.userForm.patchValue({
      email: user.email,
      role: user.role
    });
    this.userForm.get('password')?.setValidators([Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.userForm.reset();
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formData = this.userForm.value;

    // For edit mode, only include password if it's provided
    if (this.isEditMode && !formData.password) {
      delete formData.password;
    }

    const request$ = this.isEditMode
      ? this.userService.updateUser(this.getEditingUserId(), formData as UpdateUserRequest)
      : this.userService.createUser(formData as CreateUserRequest);

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.submitting = false;
          this.closeModal();
          this.loadUsers();
          this.showSuccessMessage(
            this.isEditMode ? 'User updated successfully' : 'User created successfully'
          );
        },
        error: (error) => {
          this.submitting = false;
          this.error = error.error?.error || `Failed to ${this.isEditMode ? 'update' : 'create'} user`;
        }
      });
  }

  getEditingUserId(): number {
    const email = this.userForm.get('email')?.value;
    const user = this.users.find(u => u.email === email);
    return user?.id || 0;
  }

  confirmDelete(user: User): void {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }

  deleteUser(): void {
    if (!this.userToDelete) return;

    this.deleting = true;

    this.userService.deleteUser(this.userToDelete.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deleting = false;
          this.closeDeleteModal();
          this.loadUsers();
          this.showSuccessMessage('User deleted successfully');
        },
        error: (error) => {
          this.deleting = false;
          this.error = error.error?.error || 'Failed to delete user';
        }
      });
  }

  getRoleClass(role: string): string {
    return role.toLowerCase().replace(' ', '-');
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  showSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }
}
