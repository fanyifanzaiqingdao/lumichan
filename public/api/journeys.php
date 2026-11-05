<?php
require __DIR__ . "/_public_content.php";
require __DIR__ . '/_lib.php';
require __DIR__ . '/_journeys.php';
api_cors_and_method(['GET']);

try { public_content_json( ['ok' => true, 'page' => journeys_public(journeys_load())]); }
catch (Throwable $e) { api_json(500, ['ok' => false, 'error' => 'Journeys configuration unavailable']); }
