<?php
// config.php - Environment Configuration

// Load environment variables
function get_env_var($key, $default = null) {
    $value = getenv($key);
    return $value !== false ? $value : $default;
}

// Application Configuration (Must be first to determine defaults)
define('APP_ENV', get_env_var('APP_ENV', 'development'));
define('DEBUG_MODE', APP_ENV === 'development');

// Database Configuration
define('DB_TYPE', get_env_var('DB_TYPE', (APP_ENV === 'development' ? 'sqlite' : 'pgsql'))); // Default to sqlite in dev

define('DB_HOST', get_env_var('DB_HOST', 'localhost'));
define('DB_PORT', get_env_var('DB_PORT', '5432'));
define('DB_NAME', get_env_var('DB_NAME', 'rdash'));
define('DB_USER', get_env_var('DB_USER', 'postgres'));
define('DB_PASS', get_env_var('DB_PASS', ''));

// Build DATABASE_URL if provided (Render.com format)
$database_url = get_env_var('DATABASE_URL');
if ($database_url) {
    $db_parts = parse_url($database_url);
    define('DB_HOST_FINAL', $db_parts['host']);
    define('DB_PORT_FINAL', $db_parts['port'] ?? 5432);
    define('DB_NAME_FINAL', ltrim($db_parts['path'], '/'));
    define('DB_USER_FINAL', $db_parts['user']);
    define('DB_PASS_FINAL', $db_parts['pass']);
} else {
    // Only use these if not using SQLite (or if explicitly set)
    define('DB_HOST_FINAL', DB_HOST);
    define('DB_PORT_FINAL', DB_PORT);
    define('DB_NAME_FINAL', DB_NAME);
    define('DB_USER_FINAL', DB_USER);
    define('DB_PASS_FINAL', DB_PASS);
}

// Security Configuration
define('JWT_SECRET', get_env_var('JWT_SECRET', 'change-this-secret-key-in-production'));
define('SESSION_LIFETIME', get_env_var('SESSION_LIFETIME', 14400)); // 4 hours in seconds

// CORS Configuration
define('ALLOWED_ORIGINS', get_env_var('ALLOWED_ORIGINS', 'http://localhost:4200'));

// Upload Configuration
define('MAX_UPLOAD_SIZE', get_env_var('MAX_UPLOAD_SIZE', 10485760)); // 10MB
define('UPLOAD_PATH', get_env_var('UPLOAD_PATH', __DIR__ . '/uploads/'));

// Ensure upload directory exists
if (!file_exists(UPLOAD_PATH)) {
    mkdir(UPLOAD_PATH, 0755, true);
}
