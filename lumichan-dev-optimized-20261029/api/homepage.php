<?php
require __DIR__ . '/_lib.php';
require __DIR__ . '/_homepage.php';

api_cors_and_method(['GET']);

$live = __DIR__ . '/data/homepage.live.json';
$file = is_file($live) ? $live : __DIR__ . '/data/homepage.json';
if (!is_file($file)) {
    api_json(404, ['ok' => false, 'error' => 'Homepage config not found']);
}

$json = json_decode((string) file_get_contents($file), true);
if (!is_array($json)) {
    api_json(500, ['ok' => false, 'error' => 'Homepage config is invalid']);
}

api_json(200, ['ok' => true, 'homepage' => homepage_public($json)]);
