<?php
require __DIR__ . '/_lib.php';
require __DIR__ . '/_homepage.php';

api_cors_and_method(['GET', 'PUT']);
admin_require();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    api_json(200, ['ok'=>true,'homepage'=>homepage_upgrade(content_homepage())]);
}

$body = api_read_json_body();
$homepage = $body['homepage'] ?? $body;
if (!is_array($homepage)) {
    api_json(400, ['ok' => false, 'error' => 'Invalid homepage payload']);
}

$error = homepage_validate($homepage);
if ($error !== null) api_json(400, ['ok' => false, 'error' => $error]);

content_save('homepage', $homepage);

api_json(200, ['ok' => true, 'homepage' => $homepage]);
