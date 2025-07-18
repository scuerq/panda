<?php
// Empêcher le cache côté navigateur
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');


$file = __DIR__ . '/../bdd.json';
if (!file_exists($file)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'bdd.json non trouvé']);
    exit();
}
$content = file_get_contents($file);
echo $content;
