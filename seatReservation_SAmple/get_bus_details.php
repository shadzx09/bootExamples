<?php
header('Content-Type: application/json');

include 'db.php'; // Make sure this file defines $pdo as a valid PDO connection

$bus_id = isset($_GET['bus_id']) ? intval($_GET['bus_id']) : 0;

if (!$bus_id) {
    http_response_code(400); // Bad Request
    echo json_encode([
        'success' => false,
        'message' => 'Bus ID not specified'
    ]);
    exit;
}

try {
    // Fetch bus details
    $stmt = $pdo->prepare("SELECT bus_id, bus_number, location, destination, bus_type, date, time, available_seats, price FROM buses WHERE bus_id = :bus_id");
    $stmt->execute([':bus_id' => $bus_id]);
    $bus = $stmt->fetch(PDO::FETCH_ASSOC); // Use FETCH_ASSOC to get an associative array

    if ($bus) {
        // Fetch occupied seats
        $stmtSeats = $pdo->prepare("SELECT seat_number FROM bookings WHERE bus_id = :bus_id AND status = 'confirmed'");
        $stmtSeats->execute([':bus_id' => $bus_id]);
        $occupied_seats = $stmtSeats->fetchAll(PDO::FETCH_COLUMN);

        // Convert seat numbers to integers
        $bus['occupied_seats'] = array_map('intval', $occupied_seats);

        http_response_code(200); // OK
        echo json_encode([
            'success' => true,
            'bus' => $bus
        ]);
    } else {
        http_response_code(404); // Not Found
        echo json_encode([
            'success' => false,
            'message' => 'Bus not found'
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500); // Internal Server Error
    // Log $e->getMessage() internally instead of exposing it
    error_log('Database error: ' . $e->getMessage());

    echo json_encode([
        'success' => false,
        'message' => 'Internal server error'
    ]);
}
?>