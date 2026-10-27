<?php
require __DIR__ . '/_lib.php';
require __DIR__ . '/_services_page.php';
api_cors_and_method(['GET']);
header('Cache-Control: no-store');
try { api_json(200, ['ok' => true, 'page' => services_page_public(services_page_load())]); }
catch (Throwable $e) { api_json(500, ['ok' => false, 'error' => 'Services page configuration unavailable']); }
