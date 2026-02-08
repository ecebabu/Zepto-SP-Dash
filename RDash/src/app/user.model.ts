// models/user.model.ts
export interface User {
  id: number;
  email: string;
  role: 'Admin' | 'Normal User' | 'Editor' | 'Associate' | 'Ground Team' | 'Super Admin';
  created_at: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expires_at: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserRequest {
  email?: string;
  role?: string;
  password?: string;
}

// models/project.model.ts
export interface Project {
  id: number;
  store_code: string;
  store_name: string;
  project_code: string;
  zone?: string;
  city?: string;
  state?: string;
  site_lat_long?: string;
  store_type?: string;
  site_type?: string;
  ll_ho_date?: string; // YYYY-MM-DD
  launch_date?: string; // YYYY-MM-DD
  project_handover_date?: string; // YYYY-MM-DD
  loi_release_date?: string; // YYYY-MM-DD
  token_release_date?: string; // YYYY-MM-DD
  recee_date?: string; // YYYY-MM-DD
  recee_status?: string;
  loi_signed_status?: string;
  layout?: string;
  project_status: string;
  property_area_sqft?: number;
  created_by: number;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  created_by_email?: string;
  assigned_users_count?: number;
  tasks_count?: number;
  assigned_users?: ProjectUser[];
  documents?: ProjectDocument[];
  task_stats?: TaskStats;
  // New Fields
  criticality?: 'PG0' | 'PG1' | 'PG2';
  address?: string;
  actual_carpet_area_sqft?: number;
  token_released?: 'Yes' | 'No';
  power_availability_kva?:
  | '45 KVA Available'
  | 'Power Connection Not available'
  | '>35 KVA Available'
  | '<25 KVA Available'
  | '<5 KVA Available';
  is_archived?: boolean; // Add this
}

export interface ProjectDocument {
  id: number;
  project_id: number;
  document_name: string;
  file_path: string;
  created_at: string;
}

export interface ProjectUser {
  id: number;
  project_id: number;
  user_id: number;
  role: string;
  assigned_at: string;
  email?: string;
  user_role?: string;
}


export interface TaskStats {
  total_tasks: number;
  avg_progress: number;
  completed_tasks: number;
}

export interface CreateProjectRequest {
  store_code: string;
  store_name: string;
  project_code: string;
  zone?: string;
  city?: string;
  state?: string;
  site_lat_long?: string;
  store_type?: string;
  site_type?: string;
  ll_ho_date?: string; // YYYY-MM-DD
  launch_date?: string; // YYYY-MM-DD
  project_handover_date?: string; // YYYY-MM-DD
  loi_release_date?: string; // YYYY-MM-DD
  token_release_date?: string; // YYYY-MM-DD
  recee_date?: string; // YYYY-MM-DD
  recee_status?: string;
  loi_signed_status?: string;
  layout?: string;
  project_status?: string;
  property_area_sqft?: number;
  assigned_users?: { user_id: number; role: string }[];
  //documents?: { name: string }[];
  // New Fields
  criticality?: 'PG0' | 'PG1' | 'PG2';
  address?: string;
  documents?: ProjectDocument[];
}

export interface ProjectStatusCounts {
  all_projects: number;
  project_created: number;
  recce_pending: number;
  ll_wip: number;
  fitout_wip: number;
  completed: number;

  // ✅ New Status Counts
  llho_done: number;
  project_ho_complete: number;
  launched: number;
  recce_completed: number;
  loi_signed_yes: number;
  token_released_yes: number;

  // ✅ Site Type Breakdown
  site_type_bts: number;
  site_type_semi_bts: number;
  site_type_rtm: number;
  site_type_c_and_e: number;
}

export interface ProjectsResponse {
  projects: Project[];
  status_counts: ProjectStatusCounts;
}

// models/task.model.ts
type TaskActivityStatus = 'Completed' | 'WIP' | 'Not Started' | 'NA';
export interface Task {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'Completed' | 'On Hold'; // Existing
  priority: 'Low' | 'Medium' | 'High' | 'Critical'; // Existing
  progress_percentage: number; // Existing
  assigned_to?: number; // Existing
  created_by: number; // Existing
  due_date?: string; // YYYY-MM-DD // Existing
  created_at: string; // ISO 8601 // Existing
  updated_at: string; // ISO 8601 // Existing
  store_name?: string; // Existing (from join)
  project_code?: string; // Existing (from join)
  assigned_to_email?: string; // Existing (from join)
  created_by_email?: string; // Existing (from join)

  // New Fields - Store Type & Property Type
  store_type?: 'DH' | 'SS';
  property_type?: 'BTS' | 'Semi BTS' | 'C&E' | 'RTM';
  photo_video_capture?: boolean; // 0/1 or true/false
  comments?: string; // Free text

  // Earth Leveling & Land Filling Activities (LL SOW)
  earth_leveling_status?: TaskActivityStatus;

  // Foundation & Structure Statuses
  footing_stone_status?: TaskActivityStatus;
  column_erection_status?: TaskActivityStatus;
  roofing_sheets_status?: TaskActivityStatus;
  roof_insulation_status?: TaskActivityStatus;
  sides_cladding_status?: TaskActivityStatus;
  roof_trusses_status?: TaskActivityStatus;
  wall_construction_status?: TaskActivityStatus;
  flooring_concrete_status?: TaskActivityStatus;
  plastering_painting_status?: TaskActivityStatus;
  plumbing_status?: TaskActivityStatus;

  // Site Infrastructure & Utilities
  parking_availability_status?: TaskActivityStatus;
  associates_restroom_status?: TaskActivityStatus;
  zeptons_restroom_status?: TaskActivityStatus;
  water_availability_status?: TaskActivityStatus;
  permanent_power_status?: string; // Descriptive text
  temporary_connection_available?: string; // 0/1 or true/false
  parking_work_status?: TaskActivityStatus;
  dg_bed_status?: TaskActivityStatus;
  store_shutters_status?: TaskActivityStatus;
  approach_road_status?: TaskActivityStatus;
  temporary_power_kva_status?: TaskActivityStatus;
  flooring_tiles_level_issues?: 'No Issues' | 'Level Difference';
  restroom_fixtures_status?: TaskActivityStatus;
  dg_installation_status?: TaskActivityStatus;

  // Project Specific Installations (Projects SOW Checklist)
  cctv_installation_status?: TaskActivityStatus;
  lights_fans_installation_status?: TaskActivityStatus;
  racks_installation_status?: TaskActivityStatus;
  cold_room_installation_status?: TaskActivityStatus;
  panda_bin_installation_status?: TaskActivityStatus;
  crates_installation_status?: TaskActivityStatus;
  flykiller_installation_status?: TaskActivityStatus;
  dg_testing_status?: TaskActivityStatus;
  cleaning_status?: TaskActivityStatus;
}

export interface CreateTaskRequest {
  project_id: number;
  title: string;
  description?: string;
  status?: 'To Do' | 'In Progress' | 'Completed' | 'On Hold';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  assigned_to?: number;
  due_date?: string; // YYYY-MM-DD
  progress_percentage?: number,
  // New Fields - Store Type & Property Type
  store_type?: 'DH' | 'SS';
  property_type?: 'BTS' | 'Semi BTS' | 'C&E' | 'RTM';
  photo_video_capture?: boolean; // 0/1 or true/false
  comments?: string; // Free text

  // Earth Leveling & Land Filling Activities (LL SOW)
  earth_leveling_status?: TaskActivityStatus;

  // Foundation & Structure Statuses
  footing_stone_status?: TaskActivityStatus;
  column_erection_status?: TaskActivityStatus;
  roofing_sheets_status?: TaskActivityStatus;
  roof_insulation_status?: TaskActivityStatus;
  sides_cladding_status?: TaskActivityStatus;
  roof_trusses_status?: TaskActivityStatus;
  wall_construction_status?: TaskActivityStatus;
  flooring_concrete_status?: TaskActivityStatus;
  plastering_painting_status?: TaskActivityStatus;
  plumbing_status?: TaskActivityStatus;

  // Site Infrastructure & Utilities
  parking_availability_status?: TaskActivityStatus;
  associates_restroom_status?: TaskActivityStatus;
  zeptons_restroom_status?: TaskActivityStatus;
  water_availability_status?: TaskActivityStatus;
  permanent_power_status?: string; // Descriptive text
  temporary_connection_available?: string; // 0/1 or true/false
  parking_work_status?: TaskActivityStatus;
  dg_bed_status?: TaskActivityStatus;
  store_shutters_status?: TaskActivityStatus;
  approach_road_status?: TaskActivityStatus;
  temporary_power_kva_status?: TaskActivityStatus;
  flooring_tiles_level_issues?: 'No Issues' | 'Level Difference';
  restroom_fixtures_status?: TaskActivityStatus;
  dg_installation_status?: TaskActivityStatus;

  // Project Specific Installations (Projects SOW Checklist)
  cctv_installation_status?: TaskActivityStatus;
  lights_fans_installation_status?: TaskActivityStatus;
  racks_installation_status?: TaskActivityStatus;
  cold_room_installation_status?: TaskActivityStatus;
  panda_bin_installation_status?: TaskActivityStatus;
  crates_installation_status?: TaskActivityStatus;
  flykiller_installation_status?: TaskActivityStatus;
  dg_testing_status?: TaskActivityStatus;
  cleaning_status?: TaskActivityStatus;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: 'To Do' | 'In Progress' | 'Completed' | 'On Hold';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  progress_percentage?: number;
  assigned_to?: number;
  due_date?: string; // YYYY-MM-DD

  // New Fields - Store Type & Property Type
  store_type?: 'DH' | 'SS';
  property_type?: 'BTS' | 'Semi BTS' | 'C&E' | 'RTM';
  photo_video_capture?: boolean; // 0/1 or true/false
  comments?: string; // Free text

  // Earth Leveling & Land Filling Activities (LL SOW)
  earth_leveling_status?: TaskActivityStatus;

  // Foundation & Structure Statuses
  footing_stone_status?: TaskActivityStatus;
  column_erection_status?: TaskActivityStatus;
  roofing_sheets_status?: TaskActivityStatus;
  roof_insulation_status?: TaskActivityStatus;
  sides_cladding_status?: TaskActivityStatus;
  roof_trusses_status?: TaskActivityStatus;
  wall_construction_status?: TaskActivityStatus;
  flooring_concrete_status?: TaskActivityStatus;
  plastering_painting_status?: TaskActivityStatus;
  plumbing_status?: TaskActivityStatus;

  // Site Infrastructure & Utilities
  parking_availability_status?: TaskActivityStatus;
  associates_restroom_status?: TaskActivityStatus;
  zeptons_restroom_status?: TaskActivityStatus;
  water_availability_status?: TaskActivityStatus;
  permanent_power_status?: string; // Descriptive text
  temporary_connection_available?: string; // 0/1 or true/false
  parking_work_status?: TaskActivityStatus;
  dg_bed_status?: TaskActivityStatus;
  store_shutters_status?: TaskActivityStatus;
  approach_road_status?: TaskActivityStatus;
  temporary_power_kva_status?: TaskActivityStatus;
  flooring_tiles_level_issues?: 'No Issues' | 'Level Difference';
  restroom_fixtures_status?: TaskActivityStatus;
  dg_installation_status?: TaskActivityStatus;

  // Project Specific Installations (Projects SOW Checklist)
  cctv_installation_status?: TaskActivityStatus;
  lights_fans_installation_status?: TaskActivityStatus;
  racks_installation_status?: TaskActivityStatus;
  cold_room_installation_status?: TaskActivityStatus;
  panda_bin_installation_status?: TaskActivityStatus;
  crates_installation_status?: TaskActivityStatus;
  flykiller_installation_status?: TaskActivityStatus;
  dg_testing_status?: TaskActivityStatus;
  cleaning_status?: TaskActivityStatus;
}

// models/comment.model.ts
export interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  comment_text: string;
  created_at: string;
  user_email?: string;
  media_files: MediaFile[];
}

export interface MediaFile {
  id: number;
  file_name: string;        // Original name, e.g., report.pdf
  file_path: string;        // Server path, e.g., /uploads/abc123_report.pdf
  file_type: string;        // Extension: 'pdf', 'docx', 'jpg', etc.
  file_size: number;        // In bytes
  uploaded_at?: string;     // ISO date
  mime_type?: string;       // Optional: for frontend rendering
  is_image?: boolean;       // Helper for UI
  is_video?: boolean;       // Helper for UI
  is_document?: boolean;    // Helper for UI
}

export interface CreateCommentRequest {
  task_id: number;
  comment_text: string;
}

// models/dashboard.model.ts
export interface DashboardData {
  total_projects?: number;
  total_tasks?: number;
  total_users?: number;
  my_tasks_count?: number;
  completed_tasks_count?: number;
  my_projects_count?: number;
  project_status_breakdown?: StatusBreakdown[];
  task_status_breakdown?: StatusBreakdown[];
  recent_activities?: RecentActivity[];
}

export interface StatusBreakdown {
  project_status?: string;
  status?: string;
  count: number;
}

export interface RecentActivity {
  type: 'project' | 'task';
  name: string;
  created_at: string;
}

// models/api-response.model.ts
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  error: string;
  status?: number;
}






// Excel Data


export interface StatusBreakdown { // Define if not already in user.model or if structure differs
  project_status?: string;
  status?: string; // For task status
  count: number;
}

export interface RecentActivity {
  type: 'project' | 'task';
  name: string;
  created_at: string;
}



// State City Data Row
export interface StateCityRow {
  State: string;
  'State Code': string;
  'District Code': string;
  'District Name': string;
  'Town Code': string;
  'Town Name': string;
}
export interface StateItem {
  name: string;
  code?: string;
}

export interface CityItem {
  name: string;
  state_name: string;
  district_code?: string;
}

export interface StateCityResponse {
  states: StateItem[];
  cities: CityItem[];
}
