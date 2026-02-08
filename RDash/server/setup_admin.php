<?php
// setup_admin.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/html');

echo "<h2>RDash Admin Setup</h2>";

try {
    require_once __DIR__ . '/config.php';
    
    echo "Connecting to database...<br>";
    
    if (DB_TYPE === 'pgsql') {
        $dsn = sprintf("pgsql:host=%s;port=%d;dbname=%s", DB_HOST_FINAL, DB_PORT_FINAL, DB_NAME_FINAL);
        $db = new PDO($dsn, DB_USER_FINAL, DB_PASS_FINAL);
    } else {
        $db = new PDO('sqlite:' . __DIR__ . '/dbo/data/app.db');
    }
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Database connected.<br>";

    // Ensure table exists
    $db->exec("CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'Normal User',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    echo "✅ Users table checked.<br>";

    // Upsert Admin
    $email = 'admin@example.com';
    $raw_pass = 'adminpass';
    $hash = password_hash($raw_pass, PASSWORD_DEFAULT);

    // Check if exists
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        $db->prepare("UPDATE users SET password = ?, role = 'Admin' WHERE email = ?")->execute([$hash, $email]);
        echo "✅ Admin user UPDATED.<br>";
    } else {
        $db->prepare("INSERT INTO users (email, password, role) VALUES (?, ?, 'Admin')")->execute([$email, $hash]);
        echo "✅ Admin user CREATED.<br>";
    }

    echo "<h3>Login Credentials Configured:</h3>";
    echo "Email: <b>admin@example.com</b><br>";
    echo "Password: <b>adminpass</b><br>";
    echo "<br><a href='https://rdash-frontend.onrender.com'>Go to Login</a>";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage();
}
?>
