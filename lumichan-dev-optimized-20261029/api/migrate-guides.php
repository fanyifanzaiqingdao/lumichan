<?php
/**
 * One-time import: guides.json -> MySQL
 *   /api/migrate-guides.php?token=YOUR_ADMIN_PASSWORD
 * Optional: &force=1  to clear guides then re-import
 */
require __DIR__ . '/_lib.php';

$token = (string) ($_GET['token'] ?? '');
if (!admin_password_ok($token)) {
    api_json(401, ['ok' => false, 'error' => 'Invalid token']);
}

$force = isset($_GET['force']) && $_GET['force'] === '1';
$seedFile = __DIR__ . '/data/guides.json';
if (!is_file($seedFile)) {
    api_json(404, ['ok' => false, 'error' => 'Missing api/data/guides.json seed file']);
}

$raw = json_decode((string) file_get_contents($seedFile), true);
if (!is_array($raw)) {
    api_json(500, ['ok' => false, 'error' => 'Invalid guides.json']);
}

try {
    $pdo = db();
    db_ensure_schema();

    if ($force) {
        $pdo->exec('DELETE FROM guides');
    }

    $count = (int) $pdo->query('SELECT COUNT(*) FROM guides')->fetchColumn();
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
        $item = guide_normalize($row);
        if ($item['full_name'] === '' || $item['email'] === '') {
            continue;
        }
        if (($item['status'] ?? '') === '') {
            $item['status'] = 'approved';
        }
        guides_insert($item);
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
