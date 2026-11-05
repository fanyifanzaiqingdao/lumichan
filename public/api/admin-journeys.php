<?php
require __DIR__ . '/_lib.php';
require __DIR__ . '/_journeys.php';
api_cors_and_method(['GET', 'PUT']);
admin_require();
header('Cache-Control: no-store');
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 600000) api_json(413, ['ok'=>false,'error'=>'Journey configuration too large']);
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $_SESSION['journeys_csrf'] ??= bin2hex(random_bytes(24));
    try { $record = journeys_record(); } catch (Throwable $e) { api_json(503, ['ok'=>false,'error'=>'Journeys database unavailable: check schema and content_environment']); }
    api_json(200, ['ok' => true, ...$record, 'csrf' => $_SESSION['journeys_csrf']]);
}
if (empty($_SESSION['journeys_csrf']) || !hash_equals($_SESSION['journeys_csrf'], (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''))) api_json(403, ['ok' => false, 'error' => 'Refresh the editor before saving']);
$body = api_read_json_body();
$page = $body['page'] ?? null;
if (!is_array($page)) api_json(400, ['ok' => false, 'error' => 'Invalid page']);
$error = journeys_validate($page);
if ($error !== null) api_json(400, ['ok' => false, 'error' => $error]);
$revision = $body['revision'] ?? null;
if (!is_int($revision) || $revision < 1) api_json(400, ['ok'=>false,'error'=>'Reload the editor before saving']);
try {
    if (!journeys_save($page, $revision)) api_json(409, ['ok'=>false,'error'=>'Content changed in another session. Reload before saving.']);
} catch (Throwable $e) {
    api_json(503, ['ok'=>false,'error'=>'Could not save journeys to database']);
}
api_json(200, ['ok'=>true,'page'=>$page,'revision'=>$revision+1]);
