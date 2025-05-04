<?php
session_start();
header('Content-Type: application/json');
include 'db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    $stmtUser = $pdo->prepare("SELECT user_id, name, email, phone FROM users WHERE user_id = :user_id");
    $stmtUser->execute([':user_id' => $user_id]);
    $user = $stmtUser->fetch();

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }

    $stmtBookings = $pdo->prepare("
        SELECT b.reference, b.status, b.seat_number, b.passenger_type, b.price,bus.bus_number, bus.location, bus.destination, bus.date
        FROM bookings b
        JOIN buses bus ON b.bus_id = bus.bus_id
        WHERE b.user_id = :user_id
        ORDER BY b.created_at DESC
    ");
    $stmtBookings->execute([':user_id' => $user_id]);
    $bookings = $stmtBookings->fetchAll();

    echo json_encode(['success' => true, 'user' => $user, 'bookings' => $bookings]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>