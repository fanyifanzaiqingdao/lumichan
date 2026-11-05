<?php
require __DIR__ . '/_lib.php';
require __DIR__ . '/_translations.php';
api_cors_and_method(['GET','PUT']);
admin_require();
header('Cache-Control: no-store');
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $_SESSION['translations_csrf'] ??= bin2hex(random_bytes(24));
    api_json(200, ['ok'=>true, 'entries'=>translations_load(), 'inventory'=>translations_inventory(), 'csrf'=>$_SESSION['translations_csrf']]);
}
if (empty($_SESSION['translations_csrf']) || !hash_equals($_SESSION['translations_csrf'], (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''))) api_json(403, ['ok'=>false,'error'=>'Refresh the editor before saving']);
$length = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($length > 4000000) api_json(413, ['ok'=>false,'error'=>'Translation payload too large']);
$entries = api_read_json_body()['entries'] ?? null;
if (($error = translations_validate($entries)) !== null) api_json(400, ['ok'=>false,'error'=>$error]);
content_save('translations', ['schemaVersion'=>1,'entries'=>$entries]);
api_json(200, ['ok'=>true,'entries'=>$entries]);
