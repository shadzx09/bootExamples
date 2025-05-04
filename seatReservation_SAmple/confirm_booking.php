<?php
header('Content-Type: application/json');
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Get content type
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

// Parse input based on content type
if (stripos($contentType, 'application/json') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    $reference = $input['reference'] ?? '';
} else {
    // Assume form-encoded or multipart POST
    $reference = $_POST['reference'] ?? '';
}

if (!$reference) {
    echo json_encode(['success' => false, 'message' => 'Reference number not specified']);
    exit;
}

// Validate reference format
if (!preg_match('/^[A-F0-9]{8}$/', $reference)) {
    echo json_encode(['success' => false, 'message' => 'Invalid reference format']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE bookings SET status = 'confirmed' WHERE reference = :reference");
    $stmt->execute([':reference' => $reference]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Booking not found or already confirmed']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>