<?php
require __DIR__ . '/_lib.php';
require __DIR__ . '/_homepage.php';

api_cors_and_method(['GET', 'PUT']);
admin_require();

$live = __DIR__ . '/data/homepage.live.json';
$file = is_file($live) ? $live : __DIR__ . '/data/homepage.json';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $json = is_file($file) ? json_decode((string) file_get_contents($file), true) : [];
    api_json(200, ['ok' => true, 'homepage' => is_array($json) ? homepage_upgrade($json) : []]);
}

$body = api_read_json_body();
$homepage = $body['homepage'] ?? $body;
if (!is_array($homepage)) {
    api_json(400, ['ok' => false, 'error' => 'Invalid homepage payload']);
}

$error = homepage_validate($homepage);
if ($error !== null) api_json(400, ['ok' => false, 'error' => $error]);

if (!is_dir(dirname($file))) {
    mkdir(dirname($file), 0755, true);
}

$encoded = json_encode($homepage, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
if ($encoded === false) {
    api_json(500, ['ok' => false, 'error' => 'Failed to encode homepage config']);
}
$temp = tempnam(dirname($live), 'home-');
if ($temp === false || file_put_contents($temp, $encoded . "\n", LOCK_EX) === false || !rename($temp, $live)) {
    api_json(500, ['ok' => false, 'error' => 'Failed to save homepage config']);
}

api_json(200, ['ok' => true, 'homepage' => $homepage]);
