<?php
require __DIR__ . '/_lib.php';
require __DIR__ . '/_inquiry.php';

api_cors_and_method(['POST']);
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 12000) api_json(413, ['ok' => false, 'error' => 'Request too large']);
$input = api_read_json_body();
if (trim((string) ($input['website'] ?? '')) !== '') api_json(200, ['ok' => true, 'inquiry_id' => 'received']);
try {
    $record = inquiry_validate($input);
} catch (InvalidArgumentException $e) {
    api_json(400, ['ok' => false, 'error' => $e->getMessage()]);
}
$live = __DIR__ . '/data/homepage.live.json';
$homepageFile = is_file($live) ? $live : __DIR__ . '/data/homepage.json';
$homepage = json_decode((string) file_get_contents($homepageFile), true);
$currentConsent = (string) ($homepage['formConfig']['consentVersion'] ?? 'homepage-v1.1-2026-10-10');
if ($record['consent_version'] !== $currentConsent) api_json(409, ['ok' => false, 'error' => 'Consent notice has changed. Please refresh the page.']);

try {
    $pdo = db();
    $existing = $pdo->prepare('SELECT inquiry_id FROM inquiries WHERE request_id = ?');
    $existing->execute([$record['request_id']]);
    $inquiryId = $existing->fetchColumn();
    if (!$inquiryId) {
        if (!inquiry_rate_limit_ok($pdo, (int) (api_config()['max_per_hour_per_ip'] ?? 10))) {
            api_json(429, ['ok' => false, 'error' => 'Too many requests. Please try later.']);
        }
        $inquiryId = bin2hex(random_bytes(12));
        $columns = array_keys($record);
        $sql = 'INSERT INTO inquiries (inquiry_id, created_at, consent_at, ' . implode(', ', $columns) . ') VALUES (?, UTC_TIMESTAMP(), UTC_TIMESTAMP(), ' . implode(', ', array_fill(0, count($columns), '?')) . ')';
        try {
            $pdo->prepare($sql)->execute(array_merge([$inquiryId], array_values($record)));
        } catch (PDOException $e) {
            if ($e->getCode() !== '23000') throw $e;
            $existing->execute([$record['request_id']]);
            $inquiryId = $existing->fetchColumn();
            if (!$inquiryId) throw $e;
        }
    }
    try {
        inquiry_notify($pdo, $inquiryId);
    } catch (Throwable $e) {
        error_log('Lumichan inquiry notification queue failure: ' . get_class($e));
    }
    api_json(200, ['ok' => true, 'inquiry_id' => $inquiryId]);
} catch (Throwable $e) {
    error_log('Lumichan inquiry storage/notification failure: ' . get_class($e));
    api_json(500, ['ok' => false, 'error' => 'Could not save inquiry']);
}
