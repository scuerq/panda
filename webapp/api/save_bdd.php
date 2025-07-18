<?php
// Empêcher toute mise en cache de la réponse
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');


$input = file_get_contents('php://input');
if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Aucune donnée reçue']);
    exit();
}
$file = __DIR__ . '/../bdd.json';
if (file_put_contents($file, $input) !== false) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la sauvegarde']);
}
