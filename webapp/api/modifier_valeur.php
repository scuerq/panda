<?php
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// Lire le fichier bdd.json
$bdd = json_decode(file_get_contents('../../bdd.json'), true);
if (!$bdd || !isset($bdd['operations'])) {
    http_response_code(500);
    echo json_encode(['error' => 'Base de données invalide']);
    exit;
}

// Récupérer les paramètres
$data = json_decode(file_get_contents('php://input'), true);
$idx = $data['idx'] ?? null;
$tab = $data['tab'] ?? null;
$id2 = $data['id2'] ?? null;
$key = $data['key'] ?? null;
$value = $data['value'] ?? null;

// Vérifier les paramètres
if ($idx === null || $tab === null || $id2 === null || $key === null || $value === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Paramètres manquants']);
    exit;
}

// Vérifier l'index
if (!isset($bdd['operations'][$idx])) {
    http_response_code(404);
    echo json_encode(['error' => 'Opération non trouvée']);
    exit;
}

// Trouver la ligne spécifique
$operation = &$bdd['operations'][$idx];
if (!isset($operation[$tab])) {
    $operation[$tab] = [];
}

// Trouver la ligne avec l'id2 spécifique
$found = false;
foreach ($operation[$tab] as &$row) {
    if (isset($row['id2']) && $row['id2'] == $id2) {
        $found = true;
        $oldValue = isset($row[$key]) ? $row[$key] : '';
        $row[$key] = $value;
        break;
    }
}

// Si la ligne n'existe pas, la créer
if (!$found) {
    $operation[$tab][] = [
        'id2' => $id2,
        $key => $value
    ];
}

// Sauvegarder la base
file_put_contents('../../bdd.json', json_encode($bdd, JSON_PRETTY_PRINT));

// Retourner la réponse
http_response_code(200);
echo json_encode([
    'success' => true,
    'oldValue' => $oldValue
]);
