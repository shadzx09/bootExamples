<?php
header('Content-Type: application/json');
include 'db.php'; // Make sure $pdo is defined here

$data = json_decode(file_get_contents('php://input'), true);

$location = $data['location'] ?? '';
$destination = $data['destination'] ?? '';
$date = $data['date'] ?? '';

if (!$location || !$destination || !$date) {
    echo json_encode(['success' => false, 'message' => 'Missing search parameters']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT bus_id, bus_number, location, destination, bus_type, `date`, time, available_seats, price 
    FROM buses WHERE location = :location AND destination = :destination AND `date` = :date");
    $stmt->execute([':location' => $location, ':destination' => $destination, ':date' => $date]);
    $buses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'buses' => $buses]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>