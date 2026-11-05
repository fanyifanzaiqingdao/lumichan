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
content_save('services-page', $page);
api_json(200, ['ok' => true, 'page' => $page]);
