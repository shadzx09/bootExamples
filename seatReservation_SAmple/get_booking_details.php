<?php
header('Content-Type: application/json');
require 'db.php';

$reference = $_GET['reference'] ?? '';

if (!$reference) {
    echo json_encode(['success' => false, 'message' => 'Reference number not specified']);
    exit;
}

// Validate the format of the reference
if (!preg_match('/^[A-F0-9]{8}$/', $reference)) {
    echo json_encode(['success' => false, 'message' => 'Invalid reference format']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT b.reference, b.status, b.seat_number, b.passenger_type, b.price, b.remarks, bus.bus_number, bus.location, bus.destination, bus.bus_type, bus.date, bus.time 
    FROM bookings b 
    JOIN buses bus ON b.bus_id = bus.bus_id WHERE b.reference = :reference");
    $stmt->execute([':reference' => $reference]);
    $booking = $stmt->fetch();

    if ($booking) {
        echo json_encode(['success' => true, 'booking' => $booking]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Booking not found']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>