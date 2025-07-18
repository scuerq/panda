<?php
// upload.php : réception et stockage des fichiers XLSB
header('Content-Type: application/json');

$targetDir = __DIR__ . '/../xlsb/';
if (!is_dir($targetDir)) {
    mkdir($targetDir, 0775, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
    $file = $_FILES['file'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if ($ext !== 'xlsb') {
        http_response_code(400);
        echo json_encode(['error' => 'Seuls les fichiers XLSB sont acceptés.']);
        exit;
    }
    $filename = uniqid('xlsb_', true) . '.xlsb';
    $targetFile = $targetDir . $filename;
    if (move_uploaded_file($file['tmp_name'], $targetFile)) {
        echo json_encode(['success' => true, 'filename' => $filename]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors du stockage du fichier.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée ou fichier manquant.']);
}
