<?php
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit;
}
require __DIR__ . '/_lib.php';
require __DIR__ . '/_inquiry.php';

$pdo = db();
$pdo->exec('DELETE FROM inquiry_rate_limits WHERE expires_at < UTC_TIMESTAMP()');
$pdo->exec("UPDATE inquiries SET notification_status = 'pending', notification_claimed_at = NULL WHERE notification_status = 'sending' AND notification_claimed_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 10 MINUTE)");
$ids = $pdo->query("SELECT inquiry_id FROM inquiries WHERE notification_status = 'pending' AND notification_attempts < 5 ORDER BY created_at ASC LIMIT 20")->fetchAll(PDO::FETCH_COLUMN);
$sent = 0;
foreach ($ids as $id) {
    if (inquiry_notify($pdo, $id)) $sent++;
}
echo 'Processed ' . count($ids) . ', sent ' . $sent . "\n";
