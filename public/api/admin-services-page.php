<?php
require __DIR__ . '/_lib.php';
require __DIR__ . '/_services_page.php';
api_cors_and_method(['GET', 'PUT']);
admin_require();
header('Cache-Control: no-store');
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $_SESSION['services_csrf'] ??= bin2hex(random_bytes(24));
    api_json(200, ['ok' => true, 'page' => services_page_load(), 'csrf' => $_SESSION['services_csrf']]);
}
if (empty($_SESSION['services_csrf']) || !hash_equals($_SESSION['services_csrf'], (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''))) api_json(403, ['ok' => false, 'error' => 'Refresh the editor before saving']);
$body = api_read_json_body();
$page = $body['page'] ?? null;
if (!is_array($page)) api_json(400, ['ok' => false, 'error' => 'Invalid page']);
$error = services_page_validate($page);
if ($error !== null) api_json(400, ['ok' => false, 'error' => $error]);
$file = __DIR__ . '/data/services-page.live.json';
$temp = tempnam(dirname($file), 'service-');
try {
    $encoded = json_encode($page, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    if ($temp === false || file_put_contents($temp, $encoded . "\n", LOCK_EX) === false || !rename($temp, $file)) throw new RuntimeException('Write failed');
    chmod($file, 0640);
} catch (Throwable $e) {
    if ($temp && is_file($temp)) unlink($temp);
    api_json(500, ['ok' => false, 'error' => 'Could not save services page']);
}
api_json(200, ['ok' => true, 'page' => $page]);
