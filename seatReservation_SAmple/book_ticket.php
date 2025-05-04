<?php
header('Content-Type: application/json');
include 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$bus_id = $_POST['bus_id'] ?? null;
$name = $_POST['name'] ?? null;
$passenger_type = $_POST['passenger_type'] ?? null;
$seat_number = $_POST['seat_number'] ?? null;
$remarks = $_POST['remarks'] ?? '';
$id_upload_path = null;

if (!$bus_id || !$name || !$passenger_type || !$seat_number) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

$bus_id = intval($bus_id);
$seat_number = intval($seat_number);

try {
    // Check if seat is already booked
    $stmtCheck = $pdo->prepare("SELECT booking_id FROM bookings WHERE bus_id = :bus_id AND seat_number = :seat_number AND status = 'confirmed'");
    $stmtCheck->execute([':bus_id' => $bus_id, ':seat_number' => $seat_number]);
    if ($stmtCheck->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Seat already booked']);
        exit;
    }

    // Handle ID upload if required
    if (($passenger_type === 'PWD/Senior Citizen' || $passenger_type === 'Student') && isset($_FILES['id_upload']) && is_uploaded_file($_FILES['id_upload']['tmp_name'])) {
        $uploadDir = 'uploads/';
        if (!is_dir($uploadDir)) {
            if (!mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
                echo json_encode(['success' => false, 'message' => 'Failed to create upload directory']);
                exit;
            }
        }

        // Generate safe file name
        $ext = pathinfo($_FILES['id_upload']['name'], PATHINFO_EXTENSION);
        $safeName = uniqid('id_', true) . '.' . strtolower($ext);
        $targetFile = $uploadDir . $safeName;

        if (move_uploaded_file($_FILES['id_upload']['tmp_name'], $targetFile)) {
            $id_upload_path = $targetFile;
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to upload ID']);
            exit;
        }
    }

    // Get bus price
    $stmtBus = $pdo->prepare("SELECT price FROM buses WHERE bus_id = :bus_id");
    $stmtBus->execute([':bus_id' => $bus_id]);
    $bus = $stmtBus->fetch();
    if (!$bus) {
        echo json_encode(['success' => false, 'message' => 'Bus not found']);
        exit;
    }
    $price = floatval($bus['price']);

    // Apply discount
    if ($passenger_type === 'PWD/Senior Citizen' || $passenger_type === 'Student') {
        $price *= 0.8; // 20% discount
    }

    // Generate reference number and check for collision (rare)
    do {
        $reference = strtoupper(bin2hex(random_bytes(4)));
        $stmtRef = $pdo->prepare("SELECT booking_id FROM bookings WHERE reference = :reference");
        $stmtRef->execute([':reference' => $reference]);
    } while ($stmtRef->fetch());

    // Insert booking
    $stmtInsert = $pdo->prepare("
        INSERT INTO bookings 
        (bus_id, name, passenger_type, seat_number, id_upload_path, remarks, reference, status, price)
        VALUES
        (:bus_id, :name, :passenger_type, :seat_number, :id_upload_path, :remarks, :reference, 'pending', :price)
    ");
    $stmtInsert->execute([
        ':bus_id' => $bus_id,
        ':name' => $name,
        ':passenger_type' => $passenger_type,
        ':seat_number' => $seat_number,
        ':id_upload_path' => $id_upload_path,
        ':remarks' => $remarks,
        ':reference' => $reference,
        ':price' => $price,
    ]);

    echo json_encode(['success' => true, 'reference' => $reference]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>