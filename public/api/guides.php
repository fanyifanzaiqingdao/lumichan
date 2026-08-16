<?php
/**
 * Public guides list — approved only (like original Supabase query).
 */
require __DIR__ . '/_lib.php';

api_cors_and_method(['GET']);

try {
    $guides = guides_load('approved', true);
    api_json(200, ['ok' => true, 'guides' => $guides]);
} catch (Throwable $e) {
    api_json(500, ['ok' => false, 'error' => 'Failed to load guides']);
}
