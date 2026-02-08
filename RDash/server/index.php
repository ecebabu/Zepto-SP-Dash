<?php
// index.php - Debug file listing
echo "<h1>File Listing</h1>";
echo "<ul>";
$files = scandir(__DIR__);
foreach ($files as $file) {
    if ($file != "." && $file != "..") {
        echo "<li><a href='$file'>$file</a></li>";
    }
}
echo "</ul>";
?>
