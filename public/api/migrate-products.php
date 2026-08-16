<?php
/**
 * One-time import: products.json -> MySQL
 * Usage (browser or curl):
 *   /api/migrate-products.php?token=YOUR_ADMIN_PASSWORD
 * Optional: &force=1  to clear table then re-import
 */
require __DIR__ . '/_lib.php';

$token = (string) ($_GET['token'] ?? '');
if (!admin_password_ok($token)) {
    api_json(401, ['ok' => false, 'error' => 'Invalid token']);
}

$force = isset($_GET['force']) && $_GET['force'] === '1';
$seedFile = __DIR__ . '/data/products.json';
if (!is_file($seedFile)) {
    api_json(404, ['ok' => false, 'error' => 'Missing api/data/products.json seed file']);
}

$raw = json_decode((string) file_get_contents($seedFile), true);
if (!is_array($raw)) {
    api_json(500, ['ok' => false, 'error' => 'Invalid products.json']);
}

try {
    $pdo = db();
    db_ensure_schema();

    if ($force) {
        $pdo->exec('DELETE FROM products');
    }

    $count = (int) $pdo->query('SELECT COUNT(*) FROM products')->fetchColumn();
    if ($count > 0 && !$force) {
        api_json(200, [
            'ok' => true,
            'skipped' => true,
            'message' => 'Table already has data. Use &force=1 to wipe and re-import.',
            'existing' => $count,
        ]);
    }

    $imported = 0;
    foreach ($raw as $row) {
        $item = product_normalize($row);
        if ($item['title'] === '') {
            continue;
        }
        products_insert($item);
        $imported++;
    }

    api_json(200, [
        'ok' => true,
        'imported' => $imported,
        'force' => $force,
    ]);
} catch (Throwable $e) {
    api_json(500, ['ok' => false, 'error' => 'Migration failed: ' . $e->getMessage()]);
}
