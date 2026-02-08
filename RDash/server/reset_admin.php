<?php
// reset_admin.php - Manual Admin Creation Tool

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Admin User Reset Tool</h1>";

try {
    // Load configuration
    require_once __DIR__ . '/config.php';
    
    // Connect to Database
    if (DB_TYPE === 'pgsql') {
        $dsn = sprintf(
            "pgsql:host=%s;port=%d;dbname=%s",
            DB_HOST_FINAL,
            DB_PORT_FINAL,
            DB_NAME_FINAL
        );
        $db = new PDO($dsn, DB_USER_FINAL, DB_PASS_FINAL);
    } else {
        $dbPath = __DIR__ . '/dbo/data/app.db';
        $db = new PDO('sqlite:' . $dbPath);
    }
    
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<p>✅ Database Connected successfully.</p>";
    
    // Check if users table exists
    try {
        $db->query("SELECT 1 FROM users LIMIT 1");
        echo "<p>✅ Users table exists.</p>";
    } catch (PDOException $e) {
        echo "<p>❌ Users table does not exist! Running migration...</p>";
        // Create table logic if needed, but route.php should handle this.
        // Let's manually create it to be safe.
        $isPgsql = (DB_TYPE === 'pgsql');
        $autoIncrement = $isPgsql ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
        $datetime = $isPgsql ? 'TIMESTAMP' : 'DATETIME';
        $currentTimestamp = $isPgsql ? 'CURRENT_TIMESTAMP' : 'CURRENT_TIMESTAMP';
        
        $sql = "CREATE TABLE IF NOT EXISTS users (
            id $autoIncrement,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'Normal User',
            created_at $datetime DEFAULT $currentTimestamp,
            updated_at $datetime DEFAULT $currentTimestamp" .
            ($isPgsql ? "" : ", PRIMARY KEY (id)") . "
        )";
        $db->exec($sql);
        echo "<p>✅ Users table created.</p>";
    }

    // Check for existing Admin
    $email = 'admin@example.com';
    $password = 'adminpass';
    $hash = password_hash($password, PASSWORD_DEFAULT);
    
    $stmt = $db->prepare("SELECT id, role FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        // User exists - Update password
        $update = $db->prepare("UPDATE users SET password = ?, role = 'Admin' WHERE email = ?");
        $update->execute([$hash, $email]);
        echo "<p>✅ Admin user found. Password UPDATED to: <strong>$password</strong></p>";
    } else {
        // User does not exist - Create
        $insert = $db->prepare("INSERT INTO users (email, password, role) VALUES (?, ?, 'Admin')");
        $insert->execute([$email, $hash]);
        echo "<p>✅ Admin user CREATED with password: <strong>$password</strong></p>";
    }
    
    echo "<h3>Login Credentials:</h3>";
    echo "<ul>";
    echo "<li>Email: <strong>$email</strong></li>";
    echo "<li>Password: <strong>$password</strong></li>";
    echo "</ul>";
    
} catch (PDOException $e) {
    echo "<h2>❌ Database Error:</h2>";
    echo "<pre>" . $e->getMessage() . "</pre>";
    echo "<p>Check your DATABASE_URL environment variable.</p>";
} catch (Exception $e) {
    echo "<h2>❌ General Error:</h2>";
    echo "<pre>" . $e->getMessage() . "</pre>";
}
?>
