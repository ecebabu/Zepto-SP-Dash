// dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth.service';
import { DashboardService } from '../../Services/dashboard.service';
import { ProjectService } from '../../Services/project.service';
import { TaskService } from '../../Services/task.service';
import { User, Project, DashboardData, ProjectStatusCounts, Task, StatusBreakdown } from '../../user.model';
import { interval, Subscription } from 'rxjs';

interface AnalyticsData {
  projectProgress: { name: string; value: number; color: string }[];
  taskDistribution: { status: string; count: number; percentage: number; color: string }[];
  userActivity: { date: string; projects: number; tasks: number; comments: number }[];
  performanceMetrics: {
    completionRate: number;
    averageTaskTime: number;
    activeProjects: number;
    overdueItems: number;
  };
  recentActivities: {
    type: 'project' | 'task' | 'user';
    title: string;
    description: string;
    timestamp: string;
    priority?: 'high' | 'medium' | 'low';
  }[];
}

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard-container">
      <!-- Modern Sidebar -->
      <div class="sidebar" [class.collapsed]="sidebarCollapsed">
        <div class="sidebar-header">
        <div class="logo">
    <div class="logo-icon">
    <img src="zepto-logo.png" alt="Logo" />
  </div>
  <div class="logo-text" *ngIf="!sidebarCollapsed">
    <span class="brand-name">Project </span>
    <span class="brand-subtitle">Management System</span>
  </div>
</div>
         
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section">
            <div class="nav-section-label" *ngIf="!sidebarCollapsed">Overview</div>
            <ul class="nav-list">
              <li class="nav-item">
                <a [routerLink]="['/dashboard']" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">
                  <div class="nav-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="7" height="7"></rect>
                      <rect x="14" y="3" width="7" height="7"></rect>
                      <rect x="14" y="14" width="7" height="7"></rect>
                      <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                  </div>
                  <span class="nav-text" *ngIf="!sidebarCollapsed">Dashboard</span>
                  <div class="nav-indicator"></div>
                </a>
              </li>
              <li class="nav-item" *ngIf="isAdminOrEditor()">
                <a [routerLink]="['/projects']" routerLinkActive="active" class="nav-link">
                  <div class="nav-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <span class="nav-text" *ngIf="!sidebarCollapsed">My Projects</span>
                  <div class="nav-badge" *ngIf="!sidebarCollapsed && analyticsData?.performanceMetrics?.activeProjects">
                    {{ analyticsData?.performanceMetrics?.activeProjects || 0 }}
                  </div>
                  <div class="nav-indicator"></div>
                </a>
              </li>
              <li class="nav-item">
                <a [routerLink]="['/tasks']" routerLinkActive="active" class="nav-link">
                  <div class="nav-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="9,11 12,14 22,4"></polyline>
                      <path d="M21,12V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3H16"></path>
                    </svg>
                  </div>
                  <span class="nav-text" *ngIf="!sidebarCollapsed">Task Explorer</span>
                  <div class="nav-indicator"></div>
                </a>
              </li>

            </ul>
          </div>

          <div class="nav-section" *ngIf="isSuperAdmin()">
            <div class="nav-section-label" *ngIf="!sidebarCollapsed">Management</div>
            <ul class="nav-list">
              <li class="nav-item">
                <a [routerLink]="['/users']" routerLinkActive="active" class="nav-link">
                  <div class="nav-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <span class="nav-text" *ngIf="!sidebarCollapsed">User Management</span>
                  <div class="nav-indicator"></div>
                </a>
              </li>
              <li class="nav-item">
                <a [routerLink]="['/comments']" routerLinkActive="active" class="nav-link">
                  <div class="nav-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <span class="nav-text" *ngIf="!sidebarCollapsed">Comments</span>
                  <div class="nav-indicator"></div>
                </a>
              </li>
            </ul>
          </div>
        </nav>

        <div class="sidebar-footer">
          <div class="user-profile">
            <div class="user-avatar">
              <div class="avatar-gradient"></div>
              <span class="avatar-text">{{ currentUser?.email?.charAt(0)?.toUpperCase() || 'U'}}</span>
            </div>
            <div class="user-info" *ngIf="!sidebarCollapsed">
              <div class="user-name">{{ currentUser?.email }}</div>
              <div class="user-role">{{ currentUser?.role }}</div>
            </div>
          </div>
          <button class="logout-btn" (click)="logout()" [title]="sidebarCollapsed ? 'Logout' : ''">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16,17 21,12 16,7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span *ngIf="!sidebarCollapsed">Logout</span>
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content" [class.expanded]="sidebarCollapsed">
        <!-- Top Header -->
        <header class="top-header">
          <div class="header-left">
            <div class="page-title-container">
              <h1 class="page-title">{{ getPageTitle() }}</h1>
              <div class="page-subtitle">{{ getPageSubtitle() }}</div>
            </div>
            <div class="breadcrumb">
              <span class="breadcrumb-item">Home</span>
              <span class="breadcrumb-separator">›</span>
              <span class="breadcrumb-item active">{{ getPageTitle() }}</span>
            </div>
          </div>
          <div class="header-right">
            <div class="header-actions">
              <button class="action-btn" title="Refresh Data" (click)="refreshData()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" [class.spinning]="isRefreshing">
                  <polyline points="23,4 23,10 17,10"></polyline>
                  <polyline points="1,20 1,14 7,14"></polyline>
                  <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4a9,9,0,0,1-14.85,9.36L23,14"></path>
                </svg>
              </button>
           
            </div>
            <div class="user-menu-header">
              <div class="time-display">{{ currentTime | date:'HH:mm' }}</div>
              <div class="date-display">{{ currentTime | date:'MMM dd, yyyy' }}</div>
            </div>
          </div>
        </header>

        <!-- Dashboard Content -->
        <div class="dashboard-content" *ngIf="router.url === '/dashboard'">
          <!-- KPI Cards -->
          <div class="kpi-grid">
            <div class="kpi-card primary" *ngIf="isAdmin()">
              <div class="kpi-header">
                <div class="kpi-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
               
              </div>
              <div class="kpi-content">
                <div class="kpi-number">{{ dashboardData?.total_projects || 0 }}</div>
                <div class="kpi-label">Total Projects</div>
                <div class="kpi-subtitle">{{ analyticsData?.performanceMetrics?.activeProjects || 0 }} active</div>
              </div>
              <div class="kpi-progress">
                <div class="progress-bar" [style.width.%]="75"></div>
              </div>
            </div>

            <div class="kpi-card success" *ngIf="isAdmin()">
              <div class="kpi-header">
                <div class="kpi-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9,11 12,14 22,4"></polyline>
                    <path d="M21,12V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3H16"></path>
                  </svg>
                </div>
               
              </div>
              <div class="kpi-content">
                <div class="kpi-number">{{ dashboardData?.total_tasks || 0 }}</div>
                <div class="kpi-label">Total Tasks</div>
                <div class="kpi-subtitle">{{ calculateCompletedTasks() }}% completed</div>
              </div>
              <div class="kpi-progress">
                <div class="progress-bar" [style.width.%]="calculateCompletedTasks()"></div>
              </div>
            </div>

      

          

            <!-- User KPIs -->
            <div class="kpi-card info" *ngIf="!isAdmin()">
              <div class="kpi-header">
                <div class="kpi-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <path d="M9 9h6v6H9z"></path>
                  </svg>
                </div>
             
              </div>
              <div class="kpi-content">
                <div class="kpi-number">{{ dashboardData?.my_tasks_count || 0 }}</div>
                <div class="kpi-label">My Tasks</div>
                <div class="kpi-subtitle">{{ dashboardData?.completed_tasks_count || 0 }} completed</div>
              </div>
              <div class="kpi-progress">
                <div class="progress-bar" [style.width.%]="calculateUserProgress()"></div>
              </div>
            </div>

            <div class="kpi-card success" *ngIf="!isAdmin()">
              <div class="kpi-header">
                <div class="kpi-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22,4 12,14.01 9,11.01"></polyline>
                  </svg>
                </div>
                
              </div>
              <div class="kpi-content">
                <div class="kpi-number">{{ calculateUserProgress() }}%</div>
                <div class="kpi-label">Completion Rate</div>
                <div class="kpi-subtitle">This week</div>
              </div>
              <div class="kpi-progress">
                <div class="progress-bar" [style.width.%]="calculateUserProgress()"></div>
              </div>
            </div>
          </div>

          <!-- Analytics Grid -->
          <div class="analytics-grid">
            <!-- Project Status Chart -->
            <div class="analytics-card" *ngIf="isAdmin()">
              <div class="card-header">
                <h3>Project Status Distribution</h3>
                <div class="card-actions">
                
                </div>
              </div>
              <div class="card-content">
                <div class="chart-container">
                  <div class="donut-chart">
                    <svg viewBox="0 0 100 100" class="donut-svg">
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e5e7eb" stroke-width="8"></circle>
                     <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" stroke-width="8"
        [attr.stroke-dasharray]="calculateStrokeDasharray('in_progress')"
        [attr.stroke-dashoffset]="-calculateStrokeDashoffset('completed')" transform="rotate(-90 50 50)"></circle>

                     <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" stroke-width="8"
        [attr.stroke-dasharray]="calculateStrokeDasharray('completed')"
        stroke-dashoffset="0" transform="rotate(-90 50 50)"></circle>
                    </svg>
                    <div class="donut-center">
                      <div class="donut-value">{{ projectStatusCounts?.all_projects || 0 }}</div>
                      <div class="donut-label">Projects</div>
                    </div>
                  </div>
                </div>
                <div class="chart-legend">
                  <div class="legend-item">
                    <div class="legend-color completed"></div>
                    <span>Completed ({{ projectStatusCounts?.completed || 0 }})</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-color in-progress"></div>
                    <span>In Progress ({{ (projectStatusCounts?.ll_wip || 0) + (projectStatusCounts?.fitout_wip || 0) }})</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-color pending"></div>
                    <span>Pending ({{ projectStatusCounts?.recce_pending || 0 }})</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Task Analytics 
            <div class="analytics-card">
              <div class="card-header">
                <h3>Task Performance</h3>
                <div class="time-filter">
                  <button class="filter-btn active">7D</button>
                  <button class="filter-btn">30D</button>
                  <button class="filter-btn">90D</button>
                </div>
              </div>
              <div class="card-content">
                <div class="performance-metrics">
                  <div class="metric-item">
                    <div class="metric-value">{{ analyticsData?.performanceMetrics?.completionRate || 0 }}%</div>
                    <div class="metric-label">Completion Rate</div>
                    <div class="metric-change positive">+2.5%</div>
                  </div>
                  <div class="metric-item">
                    <div class="metric-value">{{ analyticsData?.performanceMetrics?.averageTaskTime || 0 }}h</div>
                    <div class="metric-label">Avg. Task Time</div>
                    <div class="metric-change negative">-0.8h</div>
                  </div>
                </div>
                <div class="progress-bars">
                  <div class="progress-item" *ngFor="let status of getTaskStatusData()">
                    <div class="progress-header">
                      <span class="progress-label">{{ status.name }}</span>
                      <span class="progress-value">{{ status.count }}</span>
                    </div>
                    <div class="progress-track">
                      <div class="progress-fill" [style.width.%]="status.percentage" [style.background]="status.color"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            -->
            <!-- Recent Activity -->
          
            <!-- Projects Overview -->
            <div class="analytics-card projects-overview-card" *ngIf="isAdmin() && recentProjects.length > 0">
              <div class="card-header">
                <h3>Project Overview</h3>
                <button class="btn-primary-small" (click)="navigateToProjects()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add Project
                </button>
              </div>
              <div class="card-content">
                <div class="projects-grid">
                  <div class="project-card" *ngFor="let project of recentProjects.slice(0, 4)">
                    <div class="project-header">
                      <div class="project-title">{{ project.store_name }}</div>
                      <div class="project-status" [ngClass]="getStatusClass(project.project_status)">
                        {{ project.project_status }}
                      </div>
                    </div>
                    <div class="project-meta">
                      <div class="project-code">{{ project.project_code }}</div>
                      <div class="project-location">{{ project.city }}, {{ project.state }}</div>
                    </div>
                    <div class="project-progress">
                      <div class="progress-track">
                        <div class="progress-fill" [style.width.%]="getProjectProgress(project)"></div>
                      </div>
                      <span class="progress-text">{{ getProjectProgress(project) }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Router Outlet for other pages -->
        <div class="page-content" *ngIf="router.url !== '/dashboard'">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    /* Logo Container */
.logo {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 20px; /* Ensures space from edges */
  position: relative;
  z-index: 2;
}

/* Logo Icon Wrapper */
.logo-icon {
  width: 48px;
  height: 48px;
  position: relative;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Remove 'overflow: hidden' if logo is being clipped */
  overflow: visible; /* 👈 Prevents image from being cut off */
}

/* Gradient Background inside Icon */
.logo-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(145deg, #667eea, #764ba2);
  border-radius: 12px;
  z-index: 1;
}

/* Logo Image */
.logo-icon img {
  width: 96px;
  height: 96px;
  object-fit: contain; /* Ensures full image is visible */
  z-index: 2;
  position: relative;
  border-radius: 8px;
  background: white; /* Optional: improves contrast */
}
    :root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --success-gradient: linear-gradient(135deg, #10b981 0%, #059669 100%);
  --warning-gradient: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  --danger-gradient: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  --info-gradient: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  
  --surface-glass: rgba(255, 255, 255, 0.95);
  --surface-glass-dark: rgba(31, 41, 55, 0.95);
  
  --text-primary: white;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;
  
  --border-light: rgba(255, 255, 255, 0.2);
  --border-dark: rgba(0, 0, 0, 0.05);
}

    .dashboard-container {
      display: flex;
      height: 100vh;
       background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .kpi-card, .analytics-card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
    /* Modern Sidebar */
    .sidebar {
      width: 220px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-right: 1px solid rgba(255, 255, 255, 0.2);
      color: #1f2937;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }

    .sidebar::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(180deg, rgba(103, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%);
      pointer-events: none;
    }

    .sidebar.collapsed {
      width: 80px;
    }

    .sidebar-header {
      padding: 24px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      position: relative;
      z-index: 1;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 16px;

    }

    .logo-icon {
      width: 78px;
      height: 58px;
      position: relative;
     
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
   
    }
    .logo-icon img{
    width: 96px;
    height: 96px;
    object-fit: contain;
    z-index: 2;
    position: relative;
    border-radius: 8px;
    background: none;
   
    }
    .logo-gradient {
      position: absolute;
      inset: 0;
      background: linear-gradient(145deg, #667eea, #764ba2);
      border-radius: 12px;
    }

    .logo-letter {
      position: relative;
      color: white;
      font-weight: 700;
      font-size: 20px;
      z-index: 1;
    }

    .logo-text {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-size: 18px;
      font-weight: 700;
      color: white;
      line-height: 1;
    }

    .brand-subtitle {
      font-size: 12px;
      color: white;
      font-weight: 500;
    }

    .toggle-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .toggle-btn:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    .hamburger {
      width: 20px;
      height: 16px;
      position: relative;
      transform: rotate(0deg);
      transition: 0.3s ease-in-out;
    }

    .hamburger span {
      display: block;
      position: absolute;
      height: 2px;
      width: 100%;
      background: #6b7280;
      border-radius: 2px;
      opacity: 1;
      left: 0;
      transform: rotate(0deg);
      transition: 0.3s ease-in-out;
    }

    .hamburger span:nth-child(1) { top: 0; }
    .hamburger span:nth-child(2) { top: 7px; }
    .hamburger span:nth-child(3) { top: 14px; }

    .hamburger.active span:nth-child(1) {
      top: 7px;
      transform: rotate(135deg);
    }

    .hamburger.active span:nth-child(2) {
      opacity: 0;
      left: -20px;
    }

    .hamburger.active span:nth-child(3) {
      top: 7px;
      transform: rotate(-135deg);
    }

    .sidebar-nav {
      flex: 1;
      padding: 20px 0;
      position: relative;
      z-index: 1;
    }

    .nav-section {
      margin-bottom: 32px;
    }

    .nav-section-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #9ca3af;
      margin: 0 20px 12px;
    }

    .nav-list {
      list-style: none;
    }

    .nav-item {
      margin-bottom: 4px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      padding: 14px 20px;
      color: #6b7280;
      text-decoration: none;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      margin: 0 12px;
      border-radius: 12px;
    }

    .nav-link:hover {
      color: #667eea;
      background: rgba(103, 126, 234, 0.08);
      transform: translateX(4px);
    }

    .nav-link.active {
      color: #667eea;
      background: rgba(103, 126, 234, 0.12);
      font-weight: 600;
    }

    .nav-link.active .nav-indicator {
      opacity: 1;
      transform: scaleY(1);
    }

    .nav-icon {
      width: 20px;
      height: 20px;
      margin-right: 14px;
      flex-shrink: 0;
    }

    .nav-icon svg {
      width: 100%;
      height: 100%;
    }

    .nav-text {
      font-weight: 500;
      flex: 1;
    }

    .nav-badge {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 10px;
      min-width: 18px;
      text-align: center;
    }

    .nav-indicator {
      position: absolute;
      left: -12px;
      top: 50%;
      transform: translateY(-50%) scaleY(0);
      width: 3px;
      height: 20px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 0 2px 2px 0;
      opacity: 0;
      transition: all 0.2s;
    }

    .sidebar-footer {
      padding: 20px;
      border-top: 1px solid rgba(0, 0, 0, 0.05);
      position: relative;
      z-index: 1;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      position: relative;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      color:white;
    }

    .avatar-gradient {
      position: absolute;
      inset: 0;
      background: linear-gradient(145deg, #f59e0b, #ea580c);
      border-radius: 12px;
    }

    .avatar-text {
      position: relative;
      color: white;
      font-weight: 600;
      font-size: 14px;
      z-index: 1;
    }

    .user-info {
      flex: 1;
    }

    .user-name {
      font-size: 14px;
      font-weight: 600;
      color: white;
      margin-bottom: 2px;
    }

    .user-role {
      font-size: 12px;
      color: #6b7280;
    }

    .logout-btn {
      width: 100%;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #dc2626;
      padding: 12px 16px;
      border-radius: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .logout-btn:hover {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.3);
    }

    .logout-btn svg {
      width: 16px;
      height: 16px;
    }

    /* Main Content */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #f8fafc;
      transition: margin-left 0.3s ease;
      overflow: hidden;
    }

    .top-header {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      padding: 20px 32px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
    }

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .page-title-container {
      display: flex;
      flex-direction: column;
    }

    .page-title {
      font-size: 32px;
      font-weight: 700;
      color: white;
      margin: 0;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .page-subtitle {
      font-size: 14px;
      color: #6b7280;
      margin-top: 4px;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }

    .breadcrumb-item {
      color: #6b7280;
    }

    .breadcrumb-item.active {
      color: #667eea;
      font-weight: 500;
    }

    .breadcrumb-separator {
      color: #d1d5db;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .action-btn {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      position: relative;
    }

    .action-btn:hover {
      background: white;
      border-color: rgba(103, 126, 234, 0.2);
      transform: translateY(-1px);
    }

    .action-btn svg {
      width: 18px;
      height: 18px;
      color: #6b7280;
    }

    .action-btn svg.spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .notification-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 10px;
      min-width: 16px;
      text-align: center;
    }

    .user-menu-header {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
    }

    .time-display {
      font-size: 18px;
      font-weight: 600;
      color: white;
    }

    .date-display {
      font-size: 12px;
      color: #6b7280;
    }

    /* Dashboard Content */
    .dashboard-content {
      flex: 1;
      padding: 32px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .page-content {
      flex: 1;
      padding: 32px;
      overflow-y: auto;
    }

    /* KPI Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }

    .kpi-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 20px;
      padding: 24px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .kpi-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
      pointer-events: none;
    }

    .kpi-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    }

    .kpi-card.primary::before {
     background: linear-gradient(135deg, rgba(103, 126, 234, 0.1), rgba(118, 75, 162, 0.05));

    }

    .kpi-card.success::before {
      background: linear-gradient(135deg, rgba(103, 126, 234, 0.1), rgba(118, 75, 162, 0.05));

    }

    .kpi-card.warning::before {
       background: linear-gradient(135deg, rgba(103, 126, 234, 0.1), rgba(118, 75, 162, 0.05));

    }

    .kpi-card.danger::before {
      background: linear-gradient(135deg, rgba(103, 126, 234, 0.1), rgba(118, 75, 162, 0.05));

    }

    .kpi-card.info::before {
     background: linear-gradient(135deg, rgba(103, 126, 234, 0.1), rgba(118, 75, 162, 0.05));

    }

    .kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      position: relative;
      z-index: 1;
    }

    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .kpi-icon svg {
      width: 24px;
      height: 24px;
      color: #667eea;
    }

    .kpi-card.success .kpi-icon svg { color: #10b981; }
    .kpi-card.warning .kpi-icon svg { color: #f59e0b; }
    .kpi-card.danger .kpi-icon svg { color: #ef4444; }
    .kpi-card.info .kpi-icon svg { color: #3b82f6; }

    .kpi-trend {
      font-size: 12px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .kpi-trend.up {
      background: rgba(16, 185, 129, 0.1);
      color: #065f46;
    }

    .kpi-trend.down {
      background: rgba(239, 68, 68, 0.1);
      color: #991b1b;
    }

    .kpi-trend.text-danger {
      color: #dc2626;
    }

    .kpi-content {
      position: relative;
      z-index: 1;
    }

    .kpi-number {
      font-size: 36px;
      font-weight: 700;
      color: white;
      margin-bottom: 4px;
      line-height: 1;
    }

    .kpi-label {
      font-size: 14px;
      color: #6b7280;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .kpi-subtitle {
      font-size: 12px;
      color: #9ca3af;
    }

    .kpi-progress {
      margin-top: 16px;
      height: 6px;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 3px;
      overflow: hidden;
      position: relative;
      z-index: 1;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      border-radius: 3px;
      transition: width 0.6s ease;
      position: relative;
    }

    .progress-bar.danger {
      background: linear-gradient(90deg, #ef4444, #dc2626);
    }

    .progress-bar::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    /* Analytics Grid */
    .analytics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }

    .analytics-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      overflow: hidden;
      position: relative;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .analytics-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
      pointer-events: none;
    }

    .analytics-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }

    .card-header {
      padding: 24px 24px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 1;
      color:white;
    }

    .card-header h3 {
      font-size: 18px;
      font-weight: 600;
      color: white;
      margin: 0;
    }

    .card-actions {
      display: flex;
      gap: 8px;
    }

    .card-action-btn {
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .card-action-btn:hover {
      background: white;
      transform: translateY(-1px);
    }

    .card-action-btn svg {
      width: 14px;
      height: 14px;
      color: #6b7280;
    }

    .time-filter {
      display: flex;
      background: rgba(0, 0, 0, 0.03);
      border-radius: 8px;
      padding: 2px;
    }

    .filter-btn {
      background: none;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-btn.active {
      background: white;
      color: #667eea;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .view-all-btn {
      background: none;
      border: none;
      color: #667eea;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .view-all-btn:hover {
      background: rgba(103, 126, 234, 0.1);
    }

    .btn-primary-small {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .btn-primary-small:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(103, 126, 234, 0.3);
    }

    .btn-primary-small svg {
      width: 14px;
      height: 14px;
    }

    .card-content {
      padding: 24px;
      position: relative;
      z-index: 1;
    }

    /* Chart Components */
    .chart-container {
      display: flex;
      justify-content: center;
      margin-bottom: 24px;
    }

    .donut-chart {
      position: relative;
      width: 160px;
      height: 160px;
    }

    .donut-svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .donut-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }

    .donut-value {
      font-size: 24px;
      font-weight: 700;
      color: black;
    }

    .donut-label {
      font-size: 12px;
      color: black;
      margin-top: 4px;
    }

    .chart-legend {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      color: black;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 3px;
    }

    .legend-color.completed { background: #10b981; }
    .legend-color.in-progress { background: #f59e0b; }
    .legend-color.pending { background: #6b7280; }

    /* Performance Metrics */
    .performance-metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    .metric-item {
      text-align: center;
    }

    .metric-value {
      font-size: 28px;
      font-weight: 700;
      color: #6b7280;
      margin-bottom: 4px;
    }

    .metric-label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 4px;
    }

    .metric-change {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .metric-change.positive {
      background: rgba(16, 185, 129, 0.1);
      color: #065f46;
    }

    .metric-change.negative {
      background: rgba(239, 68, 68, 0.1);
      color: #991b1b;
    }

    .progress-bars {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .progress-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .progress-label {
      font-size: 13px;
      font-weight: 500;
      color: white;
    }

    .progress-value {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
    }

    .progress-track {
      height: 6px;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.6s ease;
      position: relative;
    }

    .progress-fill::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      animation: shimmer 2s infinite;
    }

    /* Activity List */
    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-height: 400px;
      overflow-y: auto;
    }

    .activity-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      border-radius: 12px;
      transition: all 0.2s;
      position: relative;
    }

    .activity-item:hover {
      background: rgba(0, 0, 0, 0.02);
    }

    .activity-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .activity-icon.project {
      background: rgba(103, 126, 234, 0.1);
    }

    .activity-icon.task {
      background: rgba(16, 185, 129, 0.1);
    }

    .activity-icon.user {
      background: rgba(245, 158, 11, 0.1);
    }

    .activity-icon svg {
      width: 16px;
      height: 16px;
    }

    .activity-icon.project svg { color: #667eea; }
    .activity-icon.task svg { color: #10b981; }
    .activity-icon.user svg { color: #f59e0b; }

    .activity-content {
      flex: 1;
    }
    /* Enhanced Dashboard Color Scheme */

/* Root Variables for Consistent Theming */
:root {
  --primary-color: #667eea;
  --primary-dark: #5a67d8;
  --secondary-color: #764ba2;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;
  --info-color: #3b82f6;
  
  --background-gradient: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  --surface-white: rgba(255, 255, 255, 0.98);
  --surface-glass: rgba(255, 255, 255, 0.95);
  
  --text-primary: white;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;
  
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.12);
  --shadow-xl: 0 20px 40px rgba(0, 0, 0, 0.15);
}

/* Dashboard Container with Better Background */
.dashboard-container {
  background: var(--background-gradient);
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Enhanced Sidebar with Better Glass Effect */
.sidebar {
  background: var(--surface-glass);
  backdrop-filter: blur(20px) saturate(180%);
  border-right: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: var(--shadow-md);
}

.sidebar::before {
  background: linear-gradient(180deg, 
    rgba(103, 126, 234, 0.08) 0%, 
    rgba(118, 75, 162, 0.04) 50%,
    transparent 100%);
}

/* Enhanced KPI Cards with Distinct Colors */
.kpi-card {
  background: var(--surface-white);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: var(--shadow-md);
  border-radius: 24px;
  overflow: hidden;
  position: relative;
}

.kpi-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 24px;
  padding: 1px;
  background: linear-gradient(145deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: exclude;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
}

.kpi-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-xl);
}

/* Primary KPI Card - Projects */
.kpi-card.primary {
  background: linear-gradient(135deg, 
    rgba(103, 126, 234, 0.12) 0%, 
    rgba(118, 75, 162, 0.08) 100%);
  border-left: 4px solid var(--primary-color);
}

.kpi-card.primary .kpi-icon {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  border: none;
}

/* Success KPI Card - Tasks */
.kpi-card.success {
  background: linear-gradient(135deg, 
    rgba(16, 185, 129, 0.12) 0%, 
    rgba(5, 150, 105, 0.08) 100%);
  border-left: 4px solid var(--success-color);
}

.kpi-card.success .kpi-icon {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
}

/* Warning KPI Card - Users */
.kpi-card.warning {
  background: linear-gradient(135deg, 
    rgba(245, 158, 11, 0.12) 0%, 
    rgba(217, 119, 6, 0.08) 100%);
  border-left: 4px solid var(--warning-color);
}

.kpi-card.warning .kpi-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  border: none;
}

/* Danger KPI Card - Overdue */
.kpi-card.danger {
  background: linear-gradient(135deg, 
    rgba(239, 68, 68, 0.12) 0%, 
    rgba(220, 38, 38, 0.08) 100%);
  border-left: 4px solid var(--danger-color);
}

.kpi-card.danger .kpi-icon {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border: none;
}

/* Info KPI Card - User Tasks */
.kpi-card.info {
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.12) 0%, 
    rgba(37, 99, 235, 0.08) 100%);
  border-left: 4px solid var(--info-color);
}

.kpi-card.info .kpi-icon {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
}

/* Enhanced Analytics Cards */
.analytics-card {
  background: var(--surface-white);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: var(--shadow-md);
  border-radius: 24px;
  overflow: hidden;
  position: relative;
}

.analytics-card::before {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.15) 0%, 
    rgba(255, 255, 255, 0.05) 100%);
}

.analytics-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* Enhanced Main Content */
.main-content {
  background: transparent;
}

.top-header {
  background: var(--surface-glass);
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: var(--shadow-sm);
}

/* Enhanced Progress Bars with Gradients */
.progress-bar {
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  position: relative;
  overflow: hidden;
}

.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 255, 255, 0.4), 
    transparent);
  animation: shimmer 2s infinite;
}

.progress-bar.success {
  background: linear-gradient(90deg, #10b981, #059669);
}

.progress-bar.warning {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.progress-bar.danger {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.progress-bar.info {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
}

/* Enhanced Donut Chart Colors */
.donut-svg circle:nth-child(2) {
  stroke: url(#completedGradient);
}

.donut-svg circle:nth-child(3) {
  stroke: url(#inProgressGradient);
}

/* Add SVG Gradients for Charts */
.donut-svg defs {
  background: transparent;
}

/* Responsive Enhancements */
@media (max-width: 768px) {
  .kpi-card {
    border-radius: 16px;
  }
  
  .analytics-card {
    border-radius: 16px;
  }
}

/* Focus States for Accessibility */
.nav-link:focus,
.action-btn:focus,
.card-action-btn:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* Loading States */
.loading-shimmer {
  background: linear-gradient(90deg, 
    rgba(255, 255, 255, 0.1), 
    rgba(255, 255, 255, 0.3), 
    rgba(255, 255, 255, 0.1));
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Status Color Classes */
.status-completed { color: var(--success-color); }
.status-in-progress { color: var(--warning-color); }
.status-pending { color: var(--text-secondary); }
.status-overdue { color: var(--danger-color); }
    .activity-title {
      font-size: 14px;
      font-weight: 500;
      color: white;
      margin-bottom: 2px;
    }

    .activity-description {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 4px;
    }

    .activity-time {
      font-size: 11px;
      color: #9ca3af;
    }

   .activity-priority {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 8px;
    }

    .activity-priority.high {
      background: #ef4444;
    }

    .activity-priority.medium {
      background: #f59e0b;
    }

    .activity-priority.low {
      background: #10b981;
    }

    /* Projects Overview */
    .projects-overview-card {
      grid-column: span 2;
    }

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }

    .project-card {
      background: black ;
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 12px;
      padding: 16px;
      transition: all 0.2s;
      cursor: pointer;
    }

    .project-card:hover {
      background: black;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .project-title {
      font-size: 14px;
      font-weight: 600;
     color : black;
      margin-bottom: 4px;
    }

    .project-status {
      font-size: 10px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .project-status.completed {
      background: rgba(16, 185, 129, 0.1);
      color: #065f46;
    }

    .project-status.in-progress {
      background: rgba(245, 158, 11, 0.1);
      color: #92400e;
    }

    .project-status.pending {
      background: rgba(107, 114, 128, 0.1);
      color: white;
    }

    .project-meta {
      margin-bottom: 12px;
    }

    .project-code {
      font-size: 12px;
      font-weight: 500;
      color: #667eea;
      margin-bottom: 2px;
    }

    .project-location {
      font-size: 11px;
      color: #6b7280;
    }

    .project-progress {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .project-progress .progress-track {
      flex: 1;
      height: 4px;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 2px;
      overflow: hidden;
    }

    .project-progress .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      border-radius: 2px;
      transition: width 0.6s ease;
    }

    .progress-text {
      font-size: 11px;
      font-weight: 500;
      color: #6b7280;
      min-width: 32px;
      text-align: right;
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .kpi-grid {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      }

      .analytics-grid {
        grid-template-columns: 1fr;
      }

      .projects-overview-card {
        grid-column: span 1;
      }
    }

    @media (max-width: 768px) {
      .dashboard-container {
        flex-direction: column;
      }

      .sidebar {
        width: 100%;
        height: auto;
        order: 2;
      }

      .sidebar.collapsed {
        width: 100%;
      }

      .main-content {
        order: 1;
      }

      .top-header {
        padding: 16px 20px;
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .header-right {
        width: 100%;
        justify-content: space-between;
      }

      .dashboard-content {
        padding: 20px;
        gap: 20px;
      }

      .kpi-grid {
        grid-template-columns: 1fr;
      }

      .performance-metrics {
        grid-template-columns: 1fr;
      }

      .projects-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Loading and Empty States */
    .loading-state {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 40px;
      color: #6b7280;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: #6b7280;
    }

    .empty-state-icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 16px;
      opacity: 0.5;
    }

    /* Animations */
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .kpi-card,
    .analytics-card {
      animation: fadeIn 0.6s ease-out;
    }

    .kpi-card:nth-child(2) { animation-delay: 0.1s; }
    .kpi-card:nth-child(3) { animation-delay: 0.2s; }
    .kpi-card:nth-child(4) { animation-delay: 0.3s; }

    .analytics-card:nth-child(1) { animation-delay: 0.4s; }
    .analytics-card:nth-child(2) { animation-delay: 0.5s; }
    .analytics-card:nth-child(3) { animation-delay: 0.6s; }

    /* Utility Classes */
    .text-primary { color: #667eea; }
    .text-success { color: #10b981; }
    .text-warning { color: #f59e0b; }
    .text-danger { color: #ef4444; }
    .text-info { color: #3b82f6; }

    .bg-primary { background: #667eea; }
    .bg-success { background: #10b981; }
    .bg-warning { background: #f59e0b; }
    .bg-danger { background: #ef4444; }
    .bg-info { background: #3b82f6; }

    /* Dark mode support (if needed) */
    @media (prefers-color-scheme: dark) {
      .dashboard-container {
        background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      }

      .sidebar {
        background: rgba(31, 41, 55, 0.95);
        color: #f9fafb;
      }

      .main-content {
        background: #111827;
      }

      .top-header {
        background: rgba(31, 41, 55, 0.95);
      }

      .kpi-card,
      .analytics-card {
        background: rgba(31, 41, 55, 0.95);
        border-color: rgba(75, 85, 99, 0.2);
      }

      .page-title {
        color: #f9fafb;
      }

      .kpi-number,
      .activity-title,
      .project-title {
        color: #f9fafb;
      }

      .nav-link {
        color: #d1d5db;
      }

      .nav-link:hover,
      .nav-link.active {
        color: #667eea;
      }
    }
  `],
  styleUrls: []
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  dashboardData: DashboardData | null = null;
  projectStatusCounts: ProjectStatusCounts | null = null;
  recentProjects: Project[] = [];
  analyticsData: AnalyticsData | null = null;
  currentTime = new Date();
  sidebarCollapsed = false;
  isRefreshing = false;
  statusBreakdown: StatusBreakdown[] = []; // To hold project status breakdown
  taskStatusBreakdown: StatusBreakdown[] = []; 
  private timeSubscription: Subscription = new Subscription();
  private refreshSubscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private projectService: ProjectService,
    private taskService: TaskService,
    public router: Router
  ) { }

  ngOnInit() {
    this.loadCurrentUser();
    this.loadDashboardData();
    this.startTimeUpdates();
    this.generateMockAnalyticsData();

    // Auto refresh every 5 minutes
    this.refreshSubscription = interval(300000).subscribe(() => {
      this.refreshData();
    });
  }

  ngOnDestroy() {
    this.timeSubscription.unsubscribe();
    this.refreshSubscription.unsubscribe();
  }

  private loadCurrentUser() {
    // Use AuthService instead of localStorage directly
    this.currentUser = this.authService.getCurrentUser();

    // Subscribe to user changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  private loadDashboardData() {
    this.dashboardService.getDashboardData().subscribe({
      next: (response) => {
        this.dashboardData = response.dashboard;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
      }
    });

    // Load project status counts if admin
    if (this.authService.isAdmin()) {
      this.projectService.getProjects().subscribe({
        next: (response) => {
          this.projectStatusCounts = response.status_counts;
          this.recentProjects = response.projects.slice(0, 6);
        },
        error: (error) => {
          console.error('Error loading projects:', error);
        }
      });
    }
  }

  private startTimeUpdates() {
    this.timeSubscription = interval(1000).subscribe(() => {
      this.currentTime = new Date();
    });
  }

  private generateMockAnalyticsData() {
    // Generate mock analytics data for demonstration
    this.analyticsData = {
      projectProgress: [
        { name: 'Completed', value: 65, color: '#10b981' },
        { name: 'In Progress', value: 25, color: '#f59e0b' },
        { name: 'Pending', value: 10, color: '#6b7280' }
      ],
      taskDistribution: [
        { status: 'Completed', count: 24, percentage: 60, color: '#10b981' },
        { status: 'In Progress', count: 10, percentage: 25, color: '#f59e0b' },
        { status: 'To Do', count: 6, percentage: 15, color: '#6b7280' }
      ],
      userActivity: [],
      performanceMetrics: {
        completionRate: 75,
        averageTaskTime: 2.5,
        activeProjects: this.projectStatusCounts?.all_projects || 0,
        overdueItems: 3
      },
      recentActivities: [
        {
          type: 'project',
          title: 'New Project Created',
          description: 'Store ABC-123 project has been initiated',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          priority: 'high'
        },
        {
          type: 'task',
          title: 'Task Completed',
          description: 'Foundation work completed for Project XYZ',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          priority: 'medium'
        },
        {
          type: 'user',
          title: 'User Assignment',
          description: 'John Doe assigned to Project DEF-456',
          timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          priority: 'low'
        }
      ]
    };
  }

  // Navigation and utility methods
  getPageTitle(): string {
    const path = this.router.url;
    switch (path) {
      case '/dashboard': return 'Dashboard';
      case '/projects': return 'Projects';
      case '/tasks': return 'Tasks';
      case '/users': return 'User Management';
      case '/comments': return 'Comments';
      default: return 'Dashboard';
    }
  }

  getPageSubtitle(): string {
    const path = this.router.url;
    switch (path) {
      case '/dashboard': return 'Overview of your projects and tasks';
      case '/projects': return 'Manage and track all projects';
      case '/tasks': return 'View and manage tasks';
      case '/users': return 'Manage user accounts and permissions';
      case '/comments': return 'View and moderate comments';
      default: return 'Welcome back!';
    }
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  refreshData() {
    this.isRefreshing = true;
    this.loadDashboardData();
    setTimeout(() => {
      this.isRefreshing = false;
    }, 1000);
  }

  navigateToProjects() {
    this.router.navigate(['/projects']);
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Force logout on error
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        this.router.navigate(['/login']);
      }
    });
  }

  // Helper methods
 /* isAdmin(): boolean {
    return this.currentUser?.role === 'Admin' ||
      this.currentUser?.role === 'Super Admin' ||
      this.currentUser?.role === 'Editor';
  }*/
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  // 4. ADD additional role check methods
  isSuperAdmin(): boolean {
    return this.currentUser?.role === 'Super Admin';
  }

  isAdminOrEditor(): boolean {
    return this.authService.hasRole(['Super Admin', 'Admin', 'Editor']);
  }

  calculateCompletedTasks(): number {
    if (!this.dashboardData?.total_tasks || this.dashboardData.total_tasks === 0) {
      return 0;
    }

    // Mock calculation - in real app, get from API
    return Math.round((this.dashboardData.total_tasks * 0.6));
  }

  calculateUserProgress(): number {
    if (!this.dashboardData?.my_tasks_count || this.dashboardData.my_tasks_count === 0) {
      return 0;
    }

    const completed = this.dashboardData.completed_tasks_count || 0;
    return Math.round((completed / this.dashboardData.my_tasks_count) * 100);
  }

  calculateStrokeDasharray(status: string): string {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;

    if (!this.projectStatusCounts) {
      return `0 ${circumference}`;
    }

    let percentage = 0;
    if (status === 'completed') {
      percentage = (this.projectStatusCounts.completed || 0) / (this.projectStatusCounts.all_projects || 1);
    } else if (status === 'in_progress') {
      const inProgress = (this.projectStatusCounts.ll_wip || 0) + (this.projectStatusCounts.fitout_wip || 0);
      percentage = inProgress / (this.projectStatusCounts.all_projects || 1);
    }

    const strokeLength = circumference * percentage;
    return `${strokeLength} ${circumference}`;
  }

  calculateStrokeDashoffset(previousStatus: string): number {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;

    if (previousStatus === 'completed' && this.projectStatusCounts) {
      const percentage = (this.projectStatusCounts.completed || 0) / (this.projectStatusCounts.all_projects || 1);
      return circumference * percentage;
    }

    return 0;
  }

  getTaskStatusData(): any[] {
    const mockData = [
      { name: 'Completed', count: 15, percentage: 60, color: '#10b981' },
      { name: 'In Progress', count: 8, percentage: 32, color: '#f59e0b' },
      { name: 'To Do', count: 2, percentage: 8, color: '#6b7280' }
    ];

    return mockData;
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed': return 'completed';
      case 'in progress':
      case 'll wip':
      case 'fitout wip': return 'in-progress';
      default: return 'pending';
    }
  }

  getProjectProgress(project: Project): number {
    // Mock progress calculation based on project status
    switch (project.project_status?.toLowerCase()) {
      case 'completed': return 100;
      case 'll wip': return 45;
      case 'fitout wip': return 75;
      case 'recce pending': return 15;
      default: return 0;
    }
  }

  getRelativeTime(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }

  // Math utility for template
  Math = Math;

  getUserInitial(): string {
    return (this.currentUser?.email?.charAt(0) || 'U').toUpperCase();
  }
}
