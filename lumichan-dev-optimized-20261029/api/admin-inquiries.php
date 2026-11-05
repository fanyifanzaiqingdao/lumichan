<?php
require __DIR__ . '/_lib.php';
require __DIR__ . '/_inquiry.php';

api_cors_and_method(['GET', 'POST']);
admin_require();
$pdo = db();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = api_read_json_body();
    $id = (string) ($body['inquiry_id'] ?? '');
    if (!preg_match('/^[a-f0-9]{24}$/', $id)) api_json(400, ['ok' => false, 'error' => 'Invalid inquiry ID']);
    $stmt = $pdo->prepare("UPDATE inquiries SET notification_status = 'pending' WHERE inquiry_id = ? AND notification_status IN ('pending', 'sending')");
    $stmt->execute([$id]);
    api_json(200, ['ok' => true, 'mail' => inquiry_notify($pdo, $id)]);
}

$rows = $pdo->query('SELECT inquiry_id, created_at, name, email, preferred_contact, contact_handle, travelers, travel_dates, destinations, preferred_service, message, notification_status, notification_attempts FROM inquiries ORDER BY created_at DESC LIMIT 100')->fetchAll();
api_json(200, ['ok' => true, 'inquiries' => $rows]);
