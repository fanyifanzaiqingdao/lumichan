<?php
require __DIR__ . '/_lib.php';
require __DIR__ . '/_translations.php';
api_cors_and_method(['GET']);
header('Cache-Control: no-store');
$entries = array_values(array_filter(translations_load(), fn($entry) => ($entry['enabled'] ?? false) === true));
api_json(200, ['ok' => true, 'entries' => $entries]);
