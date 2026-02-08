<?php

// Load configuration first
require_once __DIR__ . '/config.php';

// CORS Headers - Support multiple origins
$allowedOrigins = explode(',', ALLOWED_ORIGINS);
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} elseif (count($allowedOrigins) === 1) {
    header('Access-Control-Allow-Origin: ' . $allowedOrigins[0]);
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 86400'); // 24 hours

// Security Headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

// Content Security Policy
if (APP_ENV === 'production') {
    header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;");
}

// Content-Type header
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// route.php - Fixed version with proper image URL storage
ini_set('max_execution_time', 30);
ini_set('memory_limit', '256M');
date_default_timezone_set('UTC');
ini_set('upload_max_filesize', '10M');
ini_set('post_max_size', '12M');

// Enable output buffering with compression
if (!ob_get_level()) {
    ob_start('ob_gzhandler');
}

// Optimized error handling
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

// Configuration
define('DB_PATH', __DIR__ . '/dbo/data/app.db');
define('UPLOAD_PATH', __DIR__ . '/uploads/');
define('STATELIST_PATH', __DIR__ . '/data/StateCity.csv');
define('MAX_VIDEO_SIZE', 100 * 1024 * 1024); // 100MB
define('MAX_PHOTO_SIZE', 200 * 1024); // 200KB

// Ensure directories exist
if (!file_exists(dirname(DB_PATH))) {
    mkdir(dirname(DB_PATH), 0755, true);
}
if (!file_exists(UPLOAD_PATH)) {
    mkdir(UPLOAD_PATH, 0755, true);
}

// Load configuration
require_once __DIR__ . '/config.php';

class ProjectManagementSystem {
    private $db;
    private $currentUser = null;

    public function __construct() {
        $this->initDatabase();
        $this->createDefaultAdmin();
    }

    private function initDatabase() {
        try {
            // Build DSN based on database type
            if (DB_TYPE === 'pgsql') {
                $dsn = sprintf(
                    "pgsql:host=%s;port=%d;dbname=%s",
                    DB_HOST_FINAL,
                    DB_PORT_FINAL,
                    DB_NAME_FINAL
                );
                $this->db = new PDO($dsn, DB_USER_FINAL, DB_PASS_FINAL);
            } else {
                // Fallback to SQLite for local development
                $dbPath = __DIR__ . '/dbo/data/app.db';
                if (!file_exists(dirname($dbPath))) {
                    mkdir(dirname($dbPath), 0755, true);
                }
                $this->db = new PDO('sqlite:' . $dbPath);
            }
            
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
            // Set PostgreSQL-specific settings
            if (DB_TYPE === 'pgsql') {
                $this->db->exec("SET TIME ZONE 'UTC'");
            }
            
            $this->createTables();
        } catch (PDOException $e) {
            error_log("Database connection error: " . $e->getMessage());
            $this->sendError('Database connection failed: ' . (DEBUG_MODE ? $e->getMessage() : 'Please contact administrator'), 500);
        }
    }

    private function createTables() {
        // Determine SQL syntax based on database type
        $isPgsql = (DB_TYPE === 'pgsql');
        $autoIncrement = $isPgsql ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
        $datetime = $isPgsql ? 'TIMESTAMP' : 'DATETIME';
        $currentTimestamp = $isPgsql ? 'CURRENT_TIMESTAMP' : 'CURRENT_TIMESTAMP';
        $boolean = $isPgsql ? 'BOOLEAN' : 'INTEGER';
        
        $tables = [
            // Users table
            "CREATE TABLE IF NOT EXISTS users (
                id $autoIncrement,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL DEFAULT 'Normal User',
                created_at $datetime DEFAULT $currentTimestamp,
                updated_at $datetime DEFAULT $currentTimestamp" .
                ($isPgsql ? "" : ", PRIMARY KEY (id)") . "
            )",
            // Sessions table
            "CREATE TABLE IF NOT EXISTS sessions (
                id $autoIncrement,
                user_id INTEGER NOT NULL,
                token VARCHAR(255) UNIQUE NOT NULL,
                expires_at $datetime NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE" .
                ($isPgsql ? "" : ", PRIMARY KEY (id)") . "
            )",
            // Projects table
           "CREATE TABLE IF NOT EXISTS projects (
    id $autoIncrement,
    store_code VARCHAR(100) NOT NULL,
    store_name VARCHAR(200) NOT NULL,
    project_code VARCHAR(100) NOT NULL UNIQUE,
    zone VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(100),
    site_lat_long TEXT,
    store_type VARCHAR(100),
    site_type VARCHAR(100),
    ll_ho_date DATE,
    launch_date DATE,
    project_handover_date DATE,
    loi_release_date DATE,
    token_release_date DATE,
    recee_date DATE,
    recee_status VARCHAR(100),
    loi_signed_status VARCHAR(100),
    layout VARCHAR(100),
    project_status VARCHAR(100) DEFAULT 'LL WIP',
    property_area_sqft DECIMAL(10,2),
    created_by INTEGER,
    created_at $datetime DEFAULT $currentTimestamp,
    updated_at $datetime DEFAULT $currentTimestamp,
    criticality VARCHAR(10),
    address TEXT,
    actual_carpet_area_sqft DECIMAL(10,2),
    token_released VARCHAR(10),
    power_availability_kva VARCHAR(50),
    FOREIGN KEY (created_by) REFERENCES users(id)" .
    ($isPgsql ? "" : ", PRIMARY KEY (id)") . "
)",
            // Project users assignment table
            "CREATE TABLE IF NOT EXISTS project_users (
                id $autoIncrement,
                project_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                role VARCHAR(100),
                assigned_at $datetime DEFAULT $currentTimestamp,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(project_id, user_id)" .
                ($isPgsql ? "" : ", PRIMARY KEY (id)") . "
            )",
            // Tasks table
            "CREATE TABLE IF NOT EXISTS tasks (
                id $autoIncrement,
                project_id INTEGER NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                status VARCHAR(50) DEFAULT 'To Do',
                priority VARCHAR(20) DEFAULT 'Medium',
                progress_percentage INTEGER DEFAULT 0,
                assigned_to INTEGER,
                created_by INTEGER,
                due_date DATE,
                created_at $datetime DEFAULT $currentTimestamp,
                updated_at $datetime DEFAULT $currentTimestamp,
                store_type VARCHAR(10),
                property_type VARCHAR(20),
                photo_video_capture INTEGER DEFAULT 0,
                comments TEXT,
                earth_leveling_status VARCHAR(20),
                footing_stone_status VARCHAR(20),
                column_erection_status VARCHAR(20),
                roofing_sheets_status VARCHAR(20),
                roof_insulation_status VARCHAR(20),
                sides_cladding_status VARCHAR(20),
                roof_trusses_status VARCHAR(20),
                wall_construction_status VARCHAR(20),
                flooring_concrete_status VARCHAR(20),
                plastering_painting_status VARCHAR(20),
                plumbing_status VARCHAR(20),
                parking_availability_status VARCHAR(20),
                associates_restroom_status VARCHAR(20),
                zeptons_restroom_status VARCHAR(20),
                water_availability_status VARCHAR(20),
                permanent_power_status TEXT,
                temporary_connection_available INTEGER DEFAULT 0,
                parking_work_status VARCHAR(20),
                dg_bed_status VARCHAR(20),
                store_shutters_status VARCHAR(20),
                approach_road_status VARCHAR(20),
                temporary_power_kva_status VARCHAR(20),
                flooring_tiles_level_issues VARCHAR(20),
                restroom_fixtures_status VARCHAR(20),
                dg_installation_status VARCHAR(20),
                cctv_installation_status VARCHAR(20),
                lights_fans_installation_status VARCHAR(20),
                racks_installation_status VARCHAR(20),
                cold_room_installation_status VARCHAR(20),
                panda_bin_installation_status VARCHAR(20),
                crates_installation_status VARCHAR(20),
                flykiller_installation_status VARCHAR(20),
                dg_testing_status VARCHAR(20),
                cleaning_status VARCHAR(20),
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (assigned_to) REFERENCES users(id),
                FOREIGN KEY (created_by) REFERENCES users(id)" .
                ($isPgsql ? "" : ", PRIMARY KEY (id)") . "
            )",
            // Comments table
            "CREATE TABLE IF NOT EXISTS comments (
                id $autoIncrement,
                task_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                comment_text TEXT NOT NULL,
                created_at $datetime DEFAULT $currentTimestamp,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id)" .
                ($isPgsql ? "" : ", PRIMARY KEY (id)") . "
            )",
            // Media files table
            "CREATE TABLE IF NOT EXISTS media_files (
                id $autoIncrement,
                comment_id INTEGER NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_type VARCHAR(50) NOT NULL,
                file_size INTEGER NOT NULL,
                uploaded_at $datetime DEFAULT $currentTimestamp,
                FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE" .
                ($isPgsql ? "" : ", PRIMARY KEY (id)") . "
            )",
            // Project documents table
            "CREATE TABLE IF NOT EXISTS project_documents (
                id $autoIncrement,
                project_id INTEGER NOT NULL,
                document_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(500),
                created_at $datetime DEFAULT $currentTimestamp,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE" .
                ($isPgsql ? "" : ", PRIMARY KEY (id)") . "
            )"
        ];
        
        foreach ($tables as $table) {
            try {
                $this->db->exec($table);
            } catch (PDOException $e) {
                error_log("Error creating table: " . $e->getMessage());
                if (DEBUG_MODE) {
                    throw $e;
                }
            }
        }

        // Create indexes
        $indexes = [
            "CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)",
            "CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_project_users_project_id ON project_users(project_id)",
            "CREATE INDEX IF NOT EXISTS idx_project_users_user_id ON project_users(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id)",
            "CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to)",
            "CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id)",
            "CREATE INDEX IF NOT EXISTS idx_media_files_comment_id ON media_files(comment_id)"
        ];
        
        foreach ($indexes as $index) {
            try {
                $this->db->exec($index);
            } catch (PDOException $e) {
                // Indexes might already exist, ignore errors
                error_log("Index creation note: " . $e->getMessage());
            }
        }
    }

    private function createDefaultAdmin() {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM users WHERE role = 'Admin'");
        $stmt->execute();
        $count = $stmt->fetchColumn();

        if ($count == 0) {
            $stmt = $this->db->prepare("INSERT INTO users (email, password, role) VALUES (?, ?, ?)");
            $stmt->execute(['admin@example.com', password_hash('adminpass', PASSWORD_DEFAULT), 'Admin']);
        }
    }

    private function authenticate() {
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;

        if (!$token) {
            $this->sendError('Authentication required', 401);
        }

        $stmt = $this->db->prepare("
            SELECT u.*, s.token 
            FROM users u 
            JOIN sessions s ON u.id = s.user_id 
            WHERE s.token = ? AND s.expires_at > datetime('now')
        ");
        $stmt->execute([$token]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            $this->sendError('Invalid or expired token', 401);
        }

        $this->currentUser = $user;
        return $user;
    }

    private function requireAdmin() {
        $user = $this->authenticate();
        if ($user['role'] !== 'Admin' && $user['role'] !== 'Super Admin') {
            $this->sendError('Admin access required', 403);
        }
        return $user;
    }

    private function sendResponse($data, $status = 200) {
        http_response_code($status);
        echo json_encode($data);
        exit;
    }

    private function sendError($message, $status = 400) {
        http_response_code($status);
        echo json_encode(['error' => $message]);
        exit;
    }

    private function logError($message) {
        error_log(date('Y-m-d H:i:s') . " - " . $message . "\n", 3, __DIR__ . '/error.log');
    }

    // Route handling
   public function handleRequest() {
    $method = $_SERVER['REQUEST_METHOD'];
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    
    // Clean the path - remove any leading slash and route.php
    $path = str_replace(['/route.php', 'route.php'], '', $path);
    $path = '/' . ltrim($path, '/');
    
    // Handle query parameter based routing (from .htaccess rewrite)
    if (isset($_GET['endpoint'])) {
        $endpoint = $_GET['endpoint'];
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        $action = isset($_GET['action']) ? $_GET['action'] : null;
        
        // Convert query params back to path format
        if ($id && $action) {
            $path = "/$endpoint/$id/$action";
        } elseif ($id) {
            $path = "/$endpoint/$id";
        } else {
            $path = "/$endpoint";
        }
    }
    
    // Ensure path starts with /
    if (!str_starts_with($path, '/')) {
        $path = '/' . $path;
    }

    try {
        switch (true) {
            // Authentication routes
            case $path === '/login':
                if ($method === 'POST') $this->login();
                break;
            case $path === '/logout':
                if ($method === 'POST') $this->logout();
                break;
                
            // User routes
            case $path === '/users':
                if ($method === 'GET') $this->getUsers();
                if ($method === 'POST') $this->createUser();
                break;
                
            // Project routes
            case $path === '/projects':
                if ($method === 'GET') $this->getProjects();
                if ($method === 'POST') $this->createProject();
                break;
                
            // Task routes
            case $path === '/tasks':
                if ($method === 'GET') $this->getTasks();
                if ($method === 'POST') $this->createTask();
                break;
                
            // Comment routes
            case $path === '/comments':
                if ($method === 'GET') $this->getComments();
                if ($method === 'POST') $this->createComment();
                break;
                
            // Upload route
            case $path === '/upload':
                if ($method === 'POST') $this->uploadMedia();
                break;
                
            // Dashboard route
            case $path === '/dashboard':
                if ($method === 'GET') $this->getDashboardData();
                break;
                
            // State city data route
            case $path === '/state-city-data':
                if ($method === 'GET') $this->getStateCityData();
                break;
                
            // Routes with /route/ prefix (for backward compatibility)
            case $path === '/route/login':
                if ($method === 'POST') $this->login();
                break;
            case $path === '/route/logout':
                if ($method === 'POST') $this->logout();
                break;
            case $path === '/route/users':
                if ($method === 'GET') $this->getUsers();
                if ($method === 'POST') $this->createUser();
                break;
            case $path === '/route/projects':
                if ($method === 'GET') $this->getProjects();
                if ($method === 'POST') $this->createProject();
                break;
            case $path === '/route/tasks':
                if ($method === 'GET') $this->getTasks();
                if ($method === 'POST') $this->createTask();
                break;
            case $path === '/route/comments':
                if ($method === 'GET') $this->getComments();
                if ($method === 'POST') $this->createComment();
                break;
            case $path === '/route/upload':
                if ($method === 'POST') $this->uploadMedia();
                break;
            case $path === '/route/dashboard':
                if ($method === 'GET') $this->getDashboardData();
                break;
            case $path === '/route/state-city-data':
                if ($method === 'GET') $this->getStateCityData();
                break;
                
            default:
                // Handle dynamic routes with IDs
                if (preg_match('/^\/(?:route\/)?projects\/(\d+)$/', $path, $matches)) {
                    $projectId = $matches[1];
                    if ($method === 'GET') $this->getProject($projectId);
                    if ($method === 'PUT') $this->updateProject($projectId);
                    if ($method === 'DELETE') $this->deleteProject($projectId);
                } elseif (preg_match('/^\/(?:route\/)?tasks\/(\d+)$/', $path, $matches)) {
                    $taskId = $matches[1];
                    if ($method === 'GET') $this->getTask($taskId);
                    if ($method === 'PUT') $this->updateTask($taskId);
                    if ($method === 'DELETE') $this->deleteTask($taskId);
                } elseif (preg_match('/^\/(?:route\/)?users\/(\d+)$/', $path, $matches)) {
                    $userId = $matches[1];
                    if ($method === 'GET') $this->getUser($userId);
                    if ($method === 'PUT') $this->updateUser($userId);
                    if ($method === 'DELETE') $this->deleteUser($userId);
                } elseif (preg_match('/^\/(?:route\/)?projects\/(\d+)\/assign-user$/', $path, $matches)) {
                    $projectId = $matches[1];
                    if ($method === 'POST') $this->assignUserToProject($projectId);
                } elseif (preg_match('/^\/(?:route\/)?projects\/(\d+)\/tasks$/', $path, $matches)) {
                    $projectId = $matches[1];
                    if ($method === 'GET') $this->getProjectTasks($projectId);
                } elseif (preg_match('/^\/(?:route\/)?tasks\/(\d+)\/comments$/', $path, $matches)) {
                    $taskId = $matches[1];
                    if ($method === 'GET') $this->getTaskComments($taskId);
                } else {
                    $this->sendError('Endpoint not found: ' . $path, 404);
                }
                break;
        }
    } catch (Exception $e) {
        $this->logError("Error in " . $path . ": " . $e->getMessage());
        $this->sendError('Internal server error', 500);
    }
}

// Add this helper method for getting bearer token
private function getBearerToken() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        return str_replace('Bearer ', '', $headers['Authorization']);
    }
    return null;
}
    // Authentication methods
    private function login() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['email']) || !isset($input['password'])) {
            $this->sendError('Email and password required');
        }

        $stmt = $this->db->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$input['email']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($input['password'], $user['password'])) {
            $this->sendError('Invalid credentials', 401);
        }

        // Create session token
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+4 hours'));

        $stmt = $this->db->prepare("INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)");
        $stmt->execute([$user['id'], $token, $expiresAt]);

        unset($user['password']); // Don't send password back

        $this->sendResponse([
            'user' => $user,
            'token' => $token,
            'expires_at' => $expiresAt
        ]);
    }

   private function logout() {
    $token = $this->getBearerToken();
    if (!$token) {
        $this->sendError('No token provided', 400);
    }

    // Delete session from database
    $stmt = $this->db->prepare("DELETE FROM sessions WHERE token = ?");
    $stmt->execute([$token]);

    if ($stmt->rowCount() === 0) {
        // Optional: Log that token wasn't found
    }

    $this->sendResponse(['message' => 'Logged out successfully']);
   }

    // User management methods
    private function getUsers() {
        $this->requireAdmin();

        $stmt = $this->db->prepare("SELECT id, email, role, created_at FROM users ORDER BY created_at DESC");
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $this->sendResponse(['users' => $users]);
    }

    private function createUser() {
        $this->requireAdmin();
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['email']) || !isset($input['password']) || !isset($input['role'])) {
            $this->sendError('Email, password, and role required');
        }

        $allowedRoles = ['Admin', 'Normal User', 'Editor', 'Associate', 'Ground Team', 'Super Admin'];
        if (!in_array($input['role'], $allowedRoles)) {
            $this->sendError('Invalid role');
        }

        try {
            $stmt = $this->db->prepare("INSERT INTO users (email, password, role) VALUES (?, ?, ?)");
            $stmt->execute([
                $input['email'],
                password_hash($input['password'], PASSWORD_DEFAULT),
                $input['role']
            ]);

            $userId = $this->db->lastInsertId();
            
            $stmt = $this->db->prepare("SELECT id, email, role, created_at FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            $this->sendResponse(['user' => $user], 201);
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) { // Unique constraint violation
                $this->sendError('Email already exists');
            }
            throw $e;
        }
    }

    private function getUser($userId) {
        $this->requireAdmin();

        $stmt = $this->db->prepare("SELECT id, email, role, created_at FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            $this->sendError('User not found', 404);
        }

        $this->sendResponse(['user' => $user]);
    }

    private function updateUser($userId) {
        $this->requireAdmin();
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $allowedFields = ['email', 'role'];
        $updateFields = [];
        $params = [];

        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $updateFields[] = "$field = ?";
                $params[] = $input[$field];
            }
        }

        if (empty($updateFields)) {
            $this->sendError('No valid fields to update');
        }

        if (isset($input['password'])) {
            $updateFields[] = "password = ?";
            $params[] = password_hash($input['password'], PASSWORD_DEFAULT);
        }

        $params[] = $userId;
        
        $stmt = $this->db->prepare("UPDATE users SET " . implode(', ', $updateFields) . ", updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute($params);

        if ($stmt->rowCount() == 0) {
            $this->sendError('User not found', 404);
        }

        $stmt = $this->db->prepare("SELECT id, email, role, created_at FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        $this->sendResponse(['user' => $user]);
    }

    private function deleteUser($userId) {
        $this->requireAdmin();

        $stmt = $this->db->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$userId]);

        if ($stmt->rowCount() == 0) {
            $this->sendError('User not found', 404);
        }

        $this->sendResponse(['message' => 'User deleted successfully']);
    }

    // Project management methods
    private function getProjects() {
        $user = $this->authenticate();
        if ($user['role'] === 'Admin' || $user['role'] === 'Super Admin' || $user['role'] === 'Editor') {
            // Admin can see all projects
            $stmt = $this->db->prepare("
                SELECT p.*, u.email as created_by_email,
                       COUNT(DISTINCT pu.user_id) as assigned_users_count,
                       COUNT(DISTINCT t.id) as tasks_count
                FROM projects p
                LEFT JOIN users u ON p.created_by = u.id
                LEFT JOIN project_users pu ON p.id = pu.project_id
                LEFT JOIN tasks t ON p.id = t.project_id
                GROUP BY p.id
                ORDER BY p.created_at DESC
            ");
            $stmt->execute();
        } else {
            // Normal users can only see assigned projects
            $stmt = $this->db->prepare("
                SELECT p.*, u.email as created_by_email,
                       COUNT(DISTINCT pu.user_id) as assigned_users_count,
                       COUNT(DISTINCT t.id) as tasks_count
                FROM projects p
                LEFT JOIN users u ON p.created_by = u.id
                LEFT JOIN project_users pu ON p.id = pu.project_id
                LEFT JOIN tasks t ON p.id = t.project_id
                WHERE p.id IN (SELECT project_id FROM project_users WHERE user_id = ?)
                GROUP BY p.id
                ORDER BY p.created_at DESC
            ");
            $stmt->execute([$user['id']]);
        }
        $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Add project status counts
        $statusCounts = [
    'all_projects' => count($projects),
    'll_wip' => 0,
    'fitout_wip' => 0,
    'completed' => 0,
    'llho_done' => 0,
    'project_ho_complete' => 0,
    'launched' => 0,
    'recce_completed' => 0,
    'loi_signed_yes' => 0,
    'token_released_yes' => 0,
    // Site Types
    'site_type_bts' => 0,
    'site_type_semi_bts' => 0,
    'site_type_rtm' => 0,
    'site_type_c_and_e' => 0,
];

foreach ($projects as $project) {
    // Status-based counts
    switch (strtolower($project['project_status'])) {
        case 'll wip':
            $statusCounts['ll_wip']++;
            break;
        case 'fitout wip':
            $statusCounts['fitout_wip']++;
            break;
        case 'completed':
        case 'project ho complete':
            $statusCounts['completed']++;
            $statusCounts['project_ho_complete']++;
            break;
        case 'llho done':
            $statusCounts['llho_done']++;
            break;
        case 'launched':
            $statusCounts['launched']++;
            break;
    }

    // Recce Status
    if (strtolower($project['recee_status']) == 'completed') {
        $statusCounts['recce_completed']++;
    }

    // LOI Signed (only YES)
    if (strtoupper($project['loi_signed_status']) == 'YES') {
        $statusCounts['loi_signed_yes']++;
    }

    // Token Released (only Yes)
    if ($project['token_released'] === 'Yes') {
        $statusCounts['token_released_yes']++;
    }

    // Site Type
    $siteType = strtolower($project['site_type'] ?? '');
    if ($siteType == 'bts') {
        $statusCounts['site_type_bts']++;
    } elseif ($siteType == 'semi bts') {
        $statusCounts['site_type_semi_bts']++;
    } elseif ($siteType == 'rtm') {
        $statusCounts['site_type_rtm']++;
    } elseif ($siteType == 'c & e') {
        $statusCounts['site_type_c_and_e']++;
    }
}

        
        $this->sendResponse([
            'projects' => $projects,
            'status_counts' => $statusCounts
        ]);
    }

    private function createProject() {
        $this->requireAdmin();
        $input = json_decode(file_get_contents('php://input'), true);
        $requiredFields = ['store_code', 'store_name', 'project_code'];
        
        foreach ($requiredFields as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                $this->sendError("Field '$field' is required");
            }
        }

        try {
            $this->db->beginTransaction();
            // Insert project - Updated with new fields
            $stmt = $this->db->prepare("
                INSERT INTO projects (
                    store_code, store_name, project_code, zone, city, state, site_lat_long,
                    store_type, site_type, ll_ho_date, launch_date, project_handover_date,
                    loi_release_date, token_release_date, recee_date, recee_status,
                    loi_signed_status, layout, project_status, property_area_sqft, created_by,
                    criticality, address,  actual_carpet_area_sqft, token_released, power_availability_kva
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?)
            ");
            $stmt->execute([
                $input['store_code'],
                $input['store_name'],
                $input['project_code'],
                $input['zone'] ?? null,
                $input['city'] ?? null,
                $input['state'] ?? null,
                $input['site_lat_long'] ?? null,
                $input['store_type'] ?? null,
                $input['site_type'] ?? null,
                $input['ll_ho_date'] ?? null,
                $input['launch_date'] ?? null,
                $input['project_handover_date'] ?? null,
                $input['loi_release_date'] ?? null,
                $input['token_release_date'] ?? null,
                $input['recee_date'] ?? null,
                $input['recee_status'] ?? null,
                $input['loi_signed_status'] ?? null,
                $input['layout'] ?? null,
                $input['project_status'] ?? 'LL WIP',
                $input['property_area_sqft'] ?? null,
                $this->currentUser['id'],
                $input['criticality'] ?? null, // New field
                $input['address'] ?? null    ,   // New field
                  $input['actual_carpet_area_sqft'] ?? null,
    $input['token_released'] ?? null,
    $input['power_availability_kva'] ?? null
            ]);
            $projectId = $this->db->lastInsertId();

            // Assign users to project
            if (isset($input['assigned_users']) && is_array($input['assigned_users'])) {
                $stmt = $this->db->prepare("INSERT INTO project_users (project_id, user_id, role) VALUES (?, ?, ?)");
                foreach ($input['assigned_users'] as $userAssignment) {
                    $stmt->execute([
                        $projectId,
                        $userAssignment['user_id'],
                        $userAssignment['role'] ?? 'Member'
                    ]);
                }
            }

            // Add documents
            if (isset($input['documents']) && is_array($input['documents'])) {
                $stmt = $this->db->prepare("INSERT INTO project_documents (project_id, document_name) VALUES (?, ?)");
                foreach ($input['documents'] as $document) {
                    $stmt->execute([$projectId, $document['name']]);
                }
            }

            $this->db->commit();

            // Get the created project with details
            $stmt = $this->db->prepare("SELECT * FROM projects WHERE id = ?");
            $stmt->execute([$projectId]);
            $project = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->sendResponse(['project' => $project], 201);
        } catch (Exception $e) {
            $this->db->rollBack();
            $this->logError("Error creating project: " . $e->getMessage());
            $this->sendError('Failed to create project: ' . $e->getMessage(), 500);
        }
    }

    private function getProject($projectId) {
        $user = $this->authenticate();
        // Check if user has access to this project
        if ($user['role'] !== 'Admin' && $user['role'] !== 'Super Admin' && $user['role'] !== 'Editor') {
            $stmt = $this->db->prepare("SELECT 1 FROM project_users WHERE project_id = ? AND user_id = ?");
            $stmt->execute([$projectId, $user['id']]);
            if (!$stmt->fetch()) {
                $this->sendError('Access denied to this project', 403);
            }
        }

        // Get project details
        $stmt = $this->db->prepare("
            SELECT p.*, u.email as created_by_email
            FROM projects p
            LEFT JOIN users u ON p.created_by = u.id
            WHERE p.id = ?
        ");
        $stmt->execute([$projectId]);
        $project = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$project) {
            $this->sendError('Project not found', 404);
        }

        // Get assigned users
        $stmt = $this->db->prepare("
            SELECT pu.*, u.email, u.role as user_role
            FROM project_users pu
            JOIN users u ON pu.user_id = u.id
            WHERE pu.project_id = ?
        ");
        $stmt->execute([$projectId]);
        $project['assigned_users'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get project documents
        $stmt = $this->db->prepare("SELECT * FROM project_documents WHERE project_id = ?");
        $stmt->execute([$projectId]);
        $project['documents'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get tasks count and progress
        $stmt = $this->db->prepare("
            SELECT
                COUNT(*) as total_tasks,
                AVG(progress_percentage) as avg_progress,
                SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks
            FROM tasks WHERE project_id = ?
        ");
        $stmt->execute([$projectId]);
        $project['task_stats'] = $stmt->fetch(PDO::FETCH_ASSOC);

        $this->sendResponse(['project' => $project]);
    }

    private function updateProject($projectId) {
    $this->requireAdmin();
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Updated list of allowed fields to include new ones
    $allowedFields = [
        'store_code', 'store_name', 'project_code', 'zone', 'city', 'state',
        'site_lat_long', 'store_type', 'site_type', 'll_ho_date', 'launch_date',
        'project_handover_date', 'loi_release_date', 'token_release_date',
        'recee_date', 'recee_status', 'loi_signed_status', 'layout',
        'project_status', 'property_area_sqft', 'criticality', 'address',
        'actual_carpet_area_sqft', 'token_released', 'power_availability_kva'
    ];
    
    try {
        $this->db->beginTransaction();
        
        // Update project fields
        $updateFields = [];
        $params = [];
        
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $updateFields[] = "$field = ?";
                $params[] = $input[$field];
            }
        }
        
        if (!empty($updateFields)) {
            $params[] = $projectId;
            $stmt = $this->db->prepare("UPDATE projects SET " . implode(', ', $updateFields) . ", updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $stmt->execute($params);
            
            if ($stmt->rowCount() == 0) {
                $this->db->rollBack();
                $this->sendError('Project not found', 404);
            }
        }
        
        // Handle user assignments (same structure as createProject)
        if (isset($input['assigned_users']) && is_array($input['assigned_users'])) {
            // First, remove existing user assignments
            $stmt = $this->db->prepare("DELETE FROM project_users WHERE project_id = ?");
            $stmt->execute([$projectId]);
            
            // Then, add new user assignments
            $stmt = $this->db->prepare("INSERT INTO project_users (project_id, user_id, role) VALUES (?, ?, ?)");
            foreach ($input['assigned_users'] as $userAssignment) {
                $stmt->execute([
                    $projectId,
                    $userAssignment['user_id'],
                    $userAssignment['role'] ?? 'Member'
                ]);
            }
        }
        
        // Handle documents update (same structure as createProject)
        if (isset($input['documents']) && is_array($input['documents'])) {
            // First, remove existing documents
            $stmt = $this->db->prepare("DELETE FROM project_documents WHERE project_id = ?");
            $stmt->execute([$projectId]);
            
            // Then, add new documents
            $stmt = $this->db->prepare("INSERT INTO project_documents (project_id, document_name) VALUES (?, ?)");
            foreach ($input['documents'] as $document) {
                $stmt->execute([$projectId, $document['name']]);
            }
        }
        
        $this->db->commit();
        
        // Return updated project with details
        $this->getProject($projectId);
        
    } catch (Exception $e) {
        $this->db->rollBack();
        $this->logError("Error updating project: " . $e->getMessage());
        $this->sendError('Failed to update project: ' . $e->getMessage(), 500);
    }
}

    private function deleteProject($projectId) {
        $this->requireAdmin();
        $stmt = $this->db->prepare("DELETE FROM projects WHERE id = ?");
        $stmt->execute([$projectId]);
        
        if ($stmt->rowCount() == 0) {
            $this->sendError('Project not found', 404);
        }
        
        $this->sendResponse(['message' => 'Project deleted successfully']);
    }

    private function assignUserToProject($projectId) {
        $this->requireAdmin();
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['user_id'])) {
            $this->sendError('User ID required');
        }
        
        try {
            $stmt = $this->db->prepare("INSERT INTO project_users (project_id, user_id, role) VALUES (?, ?, ?)");
            $stmt->execute([
                $projectId,
                $input['user_id'],
                $input['role'] ?? 'Member'
            ]);
            $this->sendResponse(['message' => 'User assigned to project successfully'], 201);
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) { // Unique constraint violation
                $this->sendError('User already assigned to this project');
            }
            $this->logError("Error assigning user: " . $e->getMessage());
            $this->sendError('Failed to assign user', 500);
        }
    }

    // Task management methods
    private function getTasks() {
        $user = $this->authenticate();
        if ($user['role'] === 'Admin' || $user['role'] === 'Super Admin' || $user['role'] === 'Editor') {
            // Admin can see all tasks
            $stmt = $this->db->prepare("
                SELECT t.*, p.store_name, p.project_code, u1.email as assigned_to_email, u2.email as created_by_email
                FROM tasks t
                LEFT JOIN projects p ON t.project_id = p.id
                LEFT JOIN users u1 ON t.assigned_to = u1.id
                LEFT JOIN users u2 ON t.created_by = u2.id
                ORDER BY t.created_at DESC
            ");
            $stmt->execute();
        } else {
            // Normal users can only see their assigned tasks
            $stmt = $this->db->prepare("
                SELECT t.*, p.store_name, p.project_code, u1.email as assigned_to_email, u2.email as created_by_email
                FROM tasks t
                LEFT JOIN projects p ON t.project_id = p.id
                LEFT JOIN users u1 ON t.assigned_to = u1.id
                LEFT JOIN users u2 ON t.created_by = u2.id
                WHERE t.assigned_to = ?
                ORDER BY t.created_at DESC
            ");
            $stmt->execute([$user['id']]);
        }
        $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $this->sendResponse(['tasks' => $tasks]);
    }

   private function createTask() {
    $user = $this->authenticate();
    if (!in_array($user['role'], ['Admin', 'Super Admin', 'Editor'])) {
        $this->sendError('Access denied. Only Admins, Super Admins, and Editors can create tasks.', 403);
    }

    $input = json_decode(file_get_contents('php://input'), true);
    
    // Debug: Log the received input
    error_log('Received task data: ' . json_encode($input));
    
    $requiredFields = ['project_id', 'title'];
    
    foreach ($requiredFields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            $this->sendError("Field '$field' is required");
        }
    }

    // Prepare parameters with proper null handling
    $params = [
        (int)$input['project_id'],
        $input['title'],
        $input['description'] ?? null,
        $input['status'] ?? 'To Do',
        $input['priority'] ?? 'Medium',
        isset($input['assigned_to']) && $input['assigned_to'] ? (int)$input['assigned_to'] : null,
        $user['id'],
        $input['due_date'] ?? null,
        // New fields with proper null handling
        $input['store_type'] ?? null,
        $input['property_type'] ?? null,
        isset($input['photo_video_capture']) ? (int)$input['photo_video_capture'] : 0,
        $input['comments'] ?? null,
        $input['earth_leveling_status'] ?? null,
        $input['footing_stone_status'] ?? null,
        $input['column_erection_status'] ?? null,
        $input['roofing_sheets_status'] ?? null,
        $input['roof_insulation_status'] ?? null,
        $input['sides_cladding_status'] ?? null,
        $input['roof_trusses_status'] ?? null,
        $input['wall_construction_status'] ?? null,
        $input['flooring_concrete_status'] ?? null,
        $input['plastering_painting_status'] ?? null,
        $input['plumbing_status'] ?? null,
        $input['parking_availability_status'] ?? null,
        $input['associates_restroom_status'] ?? null,
        $input['zeptons_restroom_status'] ?? null,
        $input['water_availability_status'] ?? null,
        $input['permanent_power_status'] ?? null,
        isset($input['temporary_connection_available']) ? (int)$input['temporary_connection_available'] : 0,
        $input['parking_work_status'] ?? null,
        $input['dg_bed_status'] ?? null,
        $input['store_shutters_status'] ?? null,
        $input['approach_road_status'] ?? null,
        $input['temporary_power_kva_status'] ?? null,
        $input['flooring_tiles_level_issues'] ?? null,
        $input['restroom_fixtures_status'] ?? null,
        $input['dg_installation_status'] ?? null,
        $input['cctv_installation_status'] ?? null,
        $input['lights_fans_installation_status'] ?? null,
        $input['racks_installation_status'] ?? null,
        $input['cold_room_installation_status'] ?? null,
        $input['panda_bin_installation_status'] ?? null,
        $input['crates_installation_status'] ?? null,
        $input['flykiller_installation_status'] ?? null,
        $input['dg_testing_status'] ?? null,
        $input['cleaning_status'] ?? null
    ];

    // Debug: Log parameter count
    error_log('Parameter count: ' . count($params));

    try {
        $stmt = $this->db->prepare("
            INSERT INTO tasks (
                project_id, title, description, status, priority, assigned_to, created_by, due_date,
                store_type, property_type, photo_video_capture, comments,
                earth_leveling_status, footing_stone_status, column_erection_status,
                roofing_sheets_status, roof_insulation_status, sides_cladding_status,
                roof_trusses_status, wall_construction_status, flooring_concrete_status,
                plastering_painting_status, plumbing_status, parking_availability_status,
                associates_restroom_status, zeptons_restroom_status, water_availability_status,
                permanent_power_status, temporary_connection_available, parking_work_status,
                dg_bed_status, store_shutters_status, approach_road_status,
                temporary_power_kva_status, flooring_tiles_level_issues, restroom_fixtures_status,
                dg_installation_status, cctv_installation_status, lights_fans_installation_status,
                racks_installation_status, cold_room_installation_status,
                panda_bin_installation_status, crates_installation_status,
                flykiller_installation_status, dg_testing_status, cleaning_status
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?, ?
            )
        ");

        $stmt->execute($params);
        $taskId = $this->db->lastInsertId();

        // Fetch and return the created task
        $stmt = $this->db->prepare("
            SELECT t.*, p.store_name, p.project_code, u1.email as assigned_to_email, u2.email as created_by_email
            FROM tasks t
            LEFT JOIN projects p ON t.project_id = p.id
            LEFT JOIN users u1 ON t.assigned_to = u1.id
            LEFT JOIN users u2 ON t.created_by = u2.id
            WHERE t.id = ?
        ");
        $stmt->execute([$taskId]);
        $task = $stmt->fetch(PDO::FETCH_ASSOC);
        $this->sendResponse(['task' => $task], 201);
        
    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        $this->sendError('Database error: ' . $e->getMessage(), 500);
    }
    }

    private function getTask($taskId) {
        $user = $this->authenticate();
        $stmt = $this->db->prepare("
            SELECT t.*, p.store_name, p.project_code, u1.email as assigned_to_email, u2.email as created_by_email
            FROM tasks t
            LEFT JOIN projects p ON t.project_id = p.id
            LEFT JOIN users u1 ON t.assigned_to = u1.id
            LEFT JOIN users u2 ON t.created_by = u2.id
            WHERE t.id = ?
        ");
        $stmt->execute([$taskId]);
        $task = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$task) {
            $this->sendError('Task not found', 404);
        }

        // Check access permissions
        if ($user['role'] !== 'Admin' && $user['role'] !== 'Super Admin' && $user['role'] !== 'Editor') {
            if ($task['assigned_to'] != $user['id']) {
                $this->sendError('Access denied to this task', 403);
            }
        }
        
        $this->sendResponse(['task' => $task]);
    }

    private function updateTask($taskId) {
        $user = $this->authenticate();
        $input = json_decode(file_get_contents('php://input'), true);

        // Get task to check permissions
        $stmt = $this->db->prepare("SELECT * FROM tasks WHERE id = ?");
        $stmt->execute([$taskId]);
        $task = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$task) {
            $this->sendError('Task not found', 404);
        }

        // Check permissions
        if ($user['role'] !== 'Admin' && $user['role'] !== 'Super Admin' && $user['role'] !== 'Editor') {
            if ($task['assigned_to'] != $user['id']) {
                $this->sendError('Access denied to update this task', 403);
            }
            // Normal users can only update status and progress
            $allowedFields = [
                 'description', 'status', 'priority', 'progress_percentage', 
                // New fields
                'store_type', 'property_type', 'photo_video_capture', 'comments',
                'earth_leveling_status', 'footing_stone_status', 'column_erection_status',
                'roofing_sheets_status', 'roof_insulation_status', 'sides_cladding_status',
                'roof_trusses_status', 'wall_construction_status', 'flooring_concrete_status',
                'plastering_painting_status', 'plumbing_status', 'parking_availability_status',
                'associates_restroom_status', 'zeptons_restroom_status', 'water_availability_status',
                'permanent_power_status', 'temporary_connection_available', 'parking_work_status',
                'dg_bed_status', 'store_shutters_status', 'approach_road_status',
                'temporary_power_kva_status', 'flooring_tiles_level_issues', 'restroom_fixtures_status',
                'dg_installation_status', 'cctv_installation_status', 'lights_fans_installation_status',
                'racks_installation_status', 'cold_room_installation_status',
                'panda_bin_installation_status', 'crates_installation_status',
                'flykiller_installation_status', 'dg_testing_status', 'cleaning_status'
            ];
        } else {
            // Admins can update all fields, including new ones
            $allowedFields = [
                'title', 'description', 'status', 'priority', 'progress_percentage', 'assigned_to', 'due_date',
                // New fields
                'store_type', 'property_type', 'photo_video_capture', 'comments',
                'earth_leveling_status', 'footing_stone_status', 'column_erection_status',
                'roofing_sheets_status', 'roof_insulation_status', 'sides_cladding_status',
                'roof_trusses_status', 'wall_construction_status', 'flooring_concrete_status',
                'plastering_painting_status', 'plumbing_status', 'parking_availability_status',
                'associates_restroom_status', 'zeptons_restroom_status', 'water_availability_status',
                'permanent_power_status', 'temporary_connection_available', 'parking_work_status',
                'dg_bed_status', 'store_shutters_status', 'approach_road_status',
                'temporary_power_kva_status', 'flooring_tiles_level_issues', 'restroom_fixtures_status',
                'dg_installation_status', 'cctv_installation_status', 'lights_fans_installation_status',
                'racks_installation_status', 'cold_room_installation_status',
                'panda_bin_installation_status', 'crates_installation_status',
                'flykiller_installation_status', 'dg_testing_status', 'cleaning_status'
            ];
        }

        $updateFields = [];
        $params = [];
        
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                // Handle boolean fields correctly
                if ($field === 'photo_video_capture' || $field === 'temporary_connection_available') {
                    $updateFields[] = "$field = ?";
                    $params[] = (int)$input[$field]; // Ensure boolean is stored as integer
                } else {
                    $updateFields[] = "$field = ?";
                    $params[] = $input[$field];
                }
            }
        }
        
        if (empty($updateFields)) {
            $this->sendError('No valid fields to update');
        }
        
        $params[] = $taskId;
        $stmt = $this->db->prepare("UPDATE tasks SET " . implode(', ', $updateFields) . ", updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute($params);

        // Return the updated task
        $this->getTask($taskId);
    }

    private function deleteTask($taskId) {
        $this->requireAdmin(); // Only Admin/Super Admin should delete tasks
        $stmt = $this->db->prepare("DELETE FROM tasks WHERE id = ?");
        $stmt->execute([$taskId]);
        
        if ($stmt->rowCount() == 0) {
            $this->sendError('Task not found', 404);
        }
        
        $this->sendResponse(['message' => 'Task deleted successfully']);
    }

    private function getProjectTasks($projectId) {
        $user = $this->authenticate();
        // Check project access
        if ($user['role'] !== 'Admin' && $user['role'] !== 'Super Admin' && $user['role'] !== 'Editor') {
            $stmt = $this->db->prepare("SELECT 1 FROM project_users WHERE project_id = ? AND user_id = ?");
            $stmt->execute([$projectId, $user['id']]);
            if (!$stmt->fetch()) {
                $this->sendError('Access denied to this project', 403);
            }
        }
        
        $stmt = $this->db->prepare("
            SELECT t.*, u1.email as assigned_to_email, u2.email as created_by_email
            FROM tasks t
            LEFT JOIN users u1 ON t.assigned_to = u1.id
            LEFT JOIN users u2 ON t.created_by = u2.id
            WHERE t.project_id = ?
            ORDER BY t.created_at DESC
        ");
        $stmt->execute([$projectId]);
        $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $this->sendResponse(['tasks' => $tasks]);
    }

    // Comment and media methods
    private function getComments() {
        $user = $this->authenticate();
        
        $taskId = $_GET['task_id'] ?? null;
        if (!$taskId) {
            $this->sendError('Task ID required');
        }

        // Check task access
        $stmt = $this->db->prepare("
            SELECT t.*, p.id as project_id 
            FROM tasks t 
            JOIN projects p ON t.project_id = p.id 
            WHERE t.id = ?
        ");
        $stmt->execute([$taskId]);
        $task = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$task) {
            $this->sendError('Task not found', 404);
        }

        // Check access permissions
        if ($user['role'] !== 'Admin' && $user['role'] !== 'Super Admin' && $user['role'] !== 'Editor') {
            $stmt = $this->db->prepare("SELECT 1 FROM project_users WHERE project_id = ? AND user_id = ?");
            $stmt->execute([$task['project_id'], $user['id']]);
            if (!$stmt->fetch() && $task['assigned_to'] != $user['id']) {
                $this->sendError('Access denied to view comments', 403);
            }
        }

        $this->getTaskComments($taskId);
    }

    private function getTaskComments($taskId) {
        $stmt = $this->db->prepare("
            SELECT c.*, u.email as user_email,
                   GROUP_CONCAT(
                       json_object(
                           'id', m.id,
                           'file_name', m.file_name,
                           'file_path', m.file_path,
                           'file_type', m.file_type,
                           'file_size', m.file_size
                       )
                   ) as media_files
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN media_files m ON c.id = m.comment_id
            WHERE c.task_id = ?
            GROUP BY c.id
            ORDER BY c.created_at ASC
        ");
        $stmt->execute([$taskId]);
        $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Parse media files JSON
        foreach ($comments as &$comment) {
            if ($comment['media_files']) {
                $comment['media_files'] = json_decode('[' . $comment['media_files'] . ']', true);
            } else {
                $comment['media_files'] = [];
            }
        }

        $this->sendResponse(['comments' => $comments]);
    }

    private function createComment() {
        $user = $this->authenticate();
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['task_id']) || !isset($input['comment_text'])) {
            $this->sendError('Task ID and comment text required');
        }

        // Check task access
        $stmt = $this->db->prepare("
            SELECT t.*, p.id as project_id 
            FROM tasks t 
            JOIN projects p ON t.project_id = p.id 
            WHERE t.id = ?
        ");
        $stmt->execute([$input['task_id']]);
        $task = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$task) {
            $this->sendError('Task not found', 404);
        }

        // Check access permissions
        if ($user['role'] !== 'Admin' && $user['role'] !== 'Super Admin' && $user['role'] !== 'Editor') {
            $stmt = $this->db->prepare("SELECT 1 FROM project_users WHERE project_id = ? AND user_id = ?");
            $stmt->execute([$task['project_id'], $user['id']]);
            if (!$stmt->fetch() && $task['assigned_to'] != $user['id']) {
                $this->sendError('Access denied to comment on this task', 403);
            }
        }

        $stmt = $this->db->prepare("INSERT INTO comments (task_id, user_id, comment_text) VALUES (?, ?, ?)");
        $stmt->execute([
            $input['task_id'],
            $user['id'],
            $input['comment_text']
        ]);

        $commentId = $this->db->lastInsertId();

        $stmt = $this->db->prepare("
            SELECT c.*, u.email as user_email
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        ");
        $stmt->execute([$commentId]);
        $comment = $stmt->fetch(PDO::FETCH_ASSOC);
        $comment['media_files'] = [];

        $this->sendResponse(['comment' => $comment], 201);
    }

    private function uploadMedia() {
        $user = $this->authenticate();

        if (!isset($_POST['comment_id'])) {
            $this->sendError('Comment ID required');
        }

        $commentId = $_POST['comment_id'];

        // Verify comment exists and user has access
        $stmt = $this->db->prepare("
            SELECT c.*, t.project_id, t.assigned_to
            FROM comments c
            JOIN tasks t ON c.task_id = t.id
            WHERE c.id = ?
        ");
        $stmt->execute([$commentId]);
        $comment = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$comment) {
            $this->sendError('Comment not found', 404);
        }

        // Check access permissions
        if ($user['role'] !== 'Admin' && $user['role'] !== 'Super Admin' && $user['role'] !== 'Editor') {
            if ($comment['user_id'] != $user['id']) {
                $this->sendError('Access denied to upload media to this comment', 403);
            }
        }

        if (!isset($_FILES['media']) || !is_array($_FILES['media']['name'])) {
            $this->sendError('No media files uploaded');
        }

        $uploadedFiles = [];
        $errors = [];

        for ($i = 0; $i < count($_FILES['media']['name']); $i++) {
            if ($_FILES['media']['error'][$i] !== UPLOAD_ERR_OK) {
                $errors[] = "Upload error for file " . $_FILES['media']['name'][$i];
                continue;
            }

            $fileName = $_FILES['media']['name'][$i];
            $fileSize = $_FILES['media']['size'][$i];
            $fileTmpName = $_FILES['media']['tmp_name'][$i];
            $fileType = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

            // Validate file type and size
            $allowedTypes = ['jpg', 'jpeg', 'png', 'mp4', 'mov', 'avi'];
            if (!in_array($fileType, $allowedTypes)) {
                $errors[] = "Invalid file type for $fileName. Allowed: JPG, PNG, MP4, MOV, AVI";
                continue;
            }

            // Check file size limits
            if (in_array($fileType, ['mp4', 'mov', 'avi']) && $fileSize > MAX_VIDEO_SIZE) {
                $errors[] = "Video file $fileName exceeds maximum size of 100MB";
                continue;
            }

            if (in_array($fileType, ['jpg', 'jpeg', 'png']) && $fileSize > MAX_PHOTO_SIZE) {
                $errors[] = "Photo file $fileName exceeds maximum size of 200KB";
                continue;
            }

            // Generate unique filename
            $uniqueFileName = uniqid() . '_' . time() . '.' . $fileType;
            $uploadPath = UPLOAD_PATH . $uniqueFileName;

            if (move_uploaded_file($fileTmpName, $uploadPath)) {
                // Save to database
                $stmt = $this->db->prepare("
                    INSERT INTO media_files (comment_id, file_name, file_path, file_type, file_size)
                    VALUES (?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $commentId,
                    $fileName,
                    $uploadPath,
                    $fileType,
                    $fileSize
                ]);

                $uploadedFiles[] = [
                    'id' => $this->db->lastInsertId(),
                    'original_name' => $fileName,
                    'file_name' => $uniqueFileName,
                    'file_type' => $fileType,
                    'file_size' => $fileSize,
                    'url' => '/uploads/' . $uniqueFileName
                ];
            } else {
                $errors[] = "Failed to upload $fileName";
            }
        }

        $response = ['uploaded_files' => $uploadedFiles];
        if (!empty($errors)) {
            $response['errors'] = $errors;
        }

        $this->sendResponse($response, 201);
    }

private function getAllComments() {
    // Authenticate the user. You might want to restrict this.
    // For example, only Admins or Super Admins can see ALL comments.
    // Or, you might allow any authenticated user, but filter results on the backend (more complex).
    // Let's start by requiring Admin/Super Admin for full access.
    $user = $this->authenticate();

    // --- Permission Check ---
    // Adjust roles as needed. This example restricts to Admin/Super Admin.
    $allowedRoles = ['Admin', 'Super Admin'];
    if (!in_array($user['role'], $allowedRoles)) {
         // Option 1: Deny access completely
         $this->sendError('Access denied. Insufficient permissions to view all comments.', 403);

         // Option 2: Allow access but potentially filter results later
         // (This requires more logic to determine which comments the user should see)
         // For now, Option 1 is simpler and more secure.
         // return;
    }
    // --- End Permission Check ---


    try {
        // --- SQL Query ---
        // This query fetches ALL comments and joins with users and media_files.
        // It's similar to getTaskComments but without the WHERE clause filtering by task_id.
        // It groups by comment ID to aggregate media files correctly.
        // It orders comments by creation date, newest first (you can change ASC/DESC).
        $stmt = $this->db->prepare("
            SELECT
                c.id,
                c.task_id,
                c.user_id,
                c.comment_text,
                c.created_at,
                u.email as user_email,
                GROUP_CONCAT(
                    json_object(
                        'id', m.id,
                        'file_name', m.file_name,
                        'file_path', m.file_path, // Ensure your frontend can access this path
                        'file_type', m.file_type,
                        'file_size', m.file_size,
                        'uploaded_at', m.uploaded_at
                    )
                ) as media_files
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN media_files m ON c.id = m.comment_id
            GROUP BY c.id
            ORDER BY c.created_at DESC -- Or ASC for oldest first
        ");
        $stmt->execute();
        $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // --- Process Media Files ---
        // Parse the concatenated JSON objects for media files for each comment.
        foreach ($comments as &$comment) { // Use reference &$comment to modify the original array
            if ($comment['media_files']) {
                // The GROUP_CONCAT might produce trailing commas or extra brackets
                // depending on your SQLite version/settings. Let's clean it up.
                $mediaJsonString = $comment['media_files'];

                // Split the concatenated JSON objects by '}{' (end of one object, start of another)
                // This handles the format produced by GROUP_CONCAT(json_object(...), ',')
                $mediaJsonParts = explode('},{', $mediaJsonString);

                $parsedMediaFiles = [];
                foreach ($mediaJsonParts as $index => $part) {
                    // Re-add the braces that were removed by explode for the first and last parts
                    if ($index === 0 && count($mediaJsonParts) > 1) {
                        $part .= '}'; // Add closing brace to the first part if there are multiple
                    } elseif ($index === count($mediaJsonParts) - 1 && count($mediaJsonParts) > 1) {
                        $part = '{' . $part; // Add opening brace to the last part if there are multiple
                    } elseif (count($mediaJsonParts) === 1) {
                         // If there's only one media file, the braces should already be there
                         // from GROUP_CONCAT, but let's ensure it's wrapped correctly.
                         $part = '{' . rtrim(ltrim($part, '{'), '}') . '}';
                    } else {
                        // Middle parts need both braces added back
                        $part = '{' . $part . '}';
                    }

                    // Now decode the individual JSON object
                    $decodedMedia = json_decode($part, true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($decodedMedia)) {
                        $parsedMediaFiles[] = $decodedMedia;
                    } else {
                         // Handle potential parsing errors for individual media objects
                         // Log the error or handle gracefully
                         error_log("Error decoding media JSON for comment {$comment['id']}: " . json_last_error_msg() . " - Input: " . $part);
                         // Optionally add an error placeholder or skip
                         // $parsedMediaFiles[] = ['error' => 'Failed to load media details'];
                    }
                }
                $comment['media_files'] = $parsedMediaFiles;
            } else {
                // If no media files, ensure the property is an empty array
                $comment['media_files'] = [];
            }
        }
        // --- End Process Media Files ---

        // Send the successful response with all comments
        $this->sendResponse(['comments' => $comments]);

    } catch (Exception $e) {
        // Log the error for debugging server-side
        error_log("Error fetching all comments: " . $e->getMessage());
        // Send a generic error response to the client
        $this->sendError('An error occurred while fetching comments.', 500);
    }
}

    // Dashboard methods
    private function getDashboardData() {
        $user = $this->authenticate();

        $data = [];

        if ($user['role'] === 'Admin' || $user['role'] === 'Super Admin' || $user['role'] === 'Editor') {
            // Admin dashboard data
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM projects");
            $stmt->execute();
            $data['total_projects'] = $stmt->fetchColumn();

            $stmt = $this->db->prepare("SELECT COUNT(*) FROM tasks");
            $stmt->execute();
            $data['total_tasks'] = $stmt->fetchColumn();

            $stmt = $this->db->prepare("SELECT COUNT(*) FROM users WHERE role != 'Admin'");
            $stmt->execute();
            $data['total_users'] = $stmt->fetchColumn();

            // Project status breakdown
            $stmt = $this->db->prepare("
                SELECT project_status, COUNT(*) as count 
                FROM projects 
                GROUP BY project_status
            ");
            $stmt->execute();
            $data['project_status_breakdown'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Recent activities
            $stmt = $this->db->prepare("
                SELECT 'project' as type, store_name as name, created_at 
                FROM projects 
                ORDER BY created_at DESC 
                LIMIT 5
            ");
            $stmt->execute();
            $recentProjects = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $stmt = $this->db->prepare("
                SELECT 'task' as type, title as name, updated_at as created_at 
                FROM tasks 
                ORDER BY updated_at DESC 
                LIMIT 5
            ");
            $stmt->execute();
            $recentTasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $data['recent_activities'] = array_merge($recentProjects, $recentTasks);
            usort($data['recent_activities'], function($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });
            $data['recent_activities'] = array_slice($data['recent_activities'], 0, 10);

        } else {
            // User dashboard data
            $stmt = $this->db->prepare("
                SELECT COUNT(*) 
                FROM tasks 
                WHERE assigned_to = ?
            ");
            $stmt->execute([$user['id']]);
            $data['my_tasks_count'] = $stmt->fetchColumn();

            $stmt = $this->db->prepare("
                SELECT COUNT(*) 
                FROM tasks 
                WHERE assigned_to = ? AND status = 'Completed'
            ");
            $stmt->execute([$user['id']]);
            $data['completed_tasks_count'] = $stmt->fetchColumn();

            $stmt = $this->db->prepare("
                SELECT COUNT(DISTINCT project_id) 
                FROM project_users 
                WHERE user_id = ?
            ");
            $stmt->execute([$user['id']]);
            $data['my_projects_count'] = $stmt->fetchColumn();

            // Task status breakdown
            $stmt = $this->db->prepare("
                SELECT status, COUNT(*) as count 
                FROM tasks 
                WHERE assigned_to = ?
                GROUP BY status
            ");
            $stmt->execute([$user['id']]);
            $data['task_status_breakdown'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        $this->sendResponse(['dashboard' => $data]);
    }

    // Excel File data
private function getStateCityData() {
    $csvFilePath = __DIR__ . '/data/StateCity.csv';

    if (!file_exists($csvFilePath)) {
        $this->sendError('State-City data file not found', 404);
    }

    try {
        // Read the CSV file content
        $csvContent = file_get_contents($csvFilePath);
        if ($csvContent === false) {
            $this->sendError('Failed to read CSV file', 500);
        }

        // Split into lines and remove empty lines
        $lines = array_filter(explode("\n", $csvContent), function($line) {
            return trim($line) !== '';
        });

        if (empty($lines)) {
            $this->sendError('CSV file is empty', 500);
        }

        // Get the header line (first line)
        $headerLine = array_shift($lines);
        
        // Parse as CSV (comma-separated)
        $headers = str_getcsv($headerLine);
        
        // Clean headers and map them properly
        $headers = array_map(function($h) {
            return trim($h, " \t\n\r\0\x0B\"'");
        }, $headers);

        // Log headers for debugging
        error_log("CSV Headers found: " . implode(' | ', $headers));
        error_log("Number of headers: " . count($headers));

        // Expected headers based on your CSV data
        $expectedHeaders = ['State', 'State_Code', 'District_Code', 'District_Name', 'Town_Code', 'Town_Name'];

        // Create arrays to store unique states and cities
        $statesMap = [];
        $citiesMap = [];

        $processedCount = 0;
        $errorCount = 0;

        foreach ($lines as $lineNumber => $line) {
            $line = trim($line);
            if (empty($line)) continue;

            // Parse as CSV (comma-separated)
            $row = str_getcsv($line);
            
            // Clean each field
            $row = array_map('trim', $row);

            // Ensure we have at least 6 columns (State, State Code, District Code, District Name, Town Code, Town Name)
            if (count($row) < 6) {
                error_log("Skipping line " . ($lineNumber + 2) . ": insufficient columns - " . $line);
                $errorCount++;
                continue;
            }

            // Pad array to ensure we have 6 elements
            while (count($row) < 6) {
                $row[] = '';
            }

            $state = trim($row[0] ?? '');
            $stateCode = trim($row[1] ?? '');
            $districtCode = trim($row[2] ?? '');
            $districtName = trim($row[3] ?? '');
            $townCode = trim($row[4] ?? '');
            $townName = trim($row[5] ?? '');

            // Skip if essential data is missing (now checking for town name instead of district name)
            if (empty($state) || empty($townName)) {
                error_log("Skipping line " . ($lineNumber + 2) . ": empty state or town - State: '$state', Town: '$townName'");
                $errorCount++;
                continue;
            }

            // Add state to map (avoid duplicates)
            $stateKey = strtolower($state);
            if (!isset($statesMap[$stateKey])) {
                $statesMap[$stateKey] = [
                    'name' => $state,
                    'code' => $stateCode
                ];
            }

            // Add city/town to map (avoid duplicates) - now using town name as the primary identifier
            $cityKey = strtolower($townName) . '|' . strtolower($state);
            if (!isset($citiesMap[$cityKey])) {
                $citiesMap[$cityKey] = [
                    'name' => $townName, // Changed from $districtName to $townName
                    'state_name' => $state,
                    'district_code' => $districtCode,
                    'district_name' => $districtName, // Keep district name as additional info
                    'town_code' => $townCode,
                    'town_name' => $townName
                ];
            }

            $processedCount++;
        }

        // Convert maps to arrays and sort
        $statesList = array_values($statesMap);
        usort($statesList, function($a, $b) {
            return strcmp($a['name'], $b['name']);
        });

        $citiesList = array_values($citiesMap);
        usort($citiesList, function($a, $b) {
            $stateCompare = strcmp($a['state_name'], $b['state_name']);
            return $stateCompare !== 0 ? $stateCompare : strcmp($a['name'], $b['name']);
        });

        // Log processing results
        error_log("CSV Processing completed:");
        error_log("- Total lines processed: $processedCount");
        error_log("- Errors encountered: $errorCount");
        error_log("- Unique states found: " . count($statesList));
        error_log("- Unique towns found: " . count($citiesList)); // Updated log message

        // Sample data for debugging
        if (!empty($statesList)) {
            error_log("Sample states: " . json_encode(array_slice($statesList, 0, 3)));
        }
        if (!empty($citiesList)) {
            error_log("Sample towns: " . json_encode(array_slice($citiesList, 0, 3))); // Updated log message
        }

        $this->sendResponse([
            'states' => $statesList,
            'cities' => $citiesList, // Keep the same key name for consistency
            'stats' => [
                'total_processed' => $processedCount,
                'errors' => $errorCount,
                'states_count' => count($statesList),
                'cities_count' => count($citiesList) // Keep same key name for consistency
            ]
        ]);

    } catch (Exception $e) {
        error_log("Error in getStateCityData: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        $this->sendError('Failed to process State-City data: ' . $e->getMessage(), 500);
    }
 }
}
// Initialize and handle request
try {
    $system = new ProjectManagementSystem();
    $system->handleRequest();
} catch (Exception $e) {
    error_log("Fatal error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
?>
