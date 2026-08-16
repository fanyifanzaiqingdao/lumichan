<?php
require __DIR__ . '/_lib.php';

api_cors_and_method(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
admin_require();

$method = $_SERVER['REQUEST_METHOD'];
$body = api_read_json_body();

if ($method === 'GET') {
    $status = (string) ($_GET['status'] ?? 'all');
    api_json(200, [
        'ok' => true,
        'guides' => guides_load($status === 'all' ? null : $status, false),
        'counts' => guides_counts(),
    ]);
}

if ($method === 'POST') {
    $item = guide_normalize($body);
    if ($item['full_name'] === '' || $item['email'] === '') {
        api_json(400, ['ok' => false, 'error' => '姓名和邮箱不能为空']);
    }
    if ($item['status'] === '') {
        $item['status'] = 'pending';
    }
    try {
        guides_insert($item);
    } catch (Throwable $e) {
        api_json(500, ['ok' => false, 'error' => '创建失败（可能是 ID 重复）']);
    }
    api_json(200, ['ok' => true, 'guide' => $item]);
}

$id = (string) ($_GET['id'] ?? ($body['id'] ?? ''));
if ($id === '') {
    api_json(400, ['ok' => false, 'error' => 'Missing guide id']);
}

$current = guides_find($id);
if ($current === null) {
    api_json(404, ['ok' => false, 'error' => 'Guide not found']);
}

if ($method === 'DELETE') {
    guides_delete($id);
    api_json(200, ['ok' => true]);
}

if ($method === 'PATCH') {
    // Quick approve / reject / update status (+ optional notes & price)
    if (isset($body['status']) && count(array_diff_key($body, array_flip(['id', 'status', 'admin_notes', 'price_per_day']))) === 0) {
        $notes = array_key_exists('admin_notes', $body) ? (string) $body['admin_notes'] : null;
        $price = array_key_exists('price_per_day', $body)
            ? ($body['price_per_day'] === null || $body['price_per_day'] === '' ? null : (float) $body['price_per_day'])
            : null;
        try {
            $updated = guides_set_status($id, (string) $body['status'], $notes, $price);
        } catch (InvalidArgumentException $e) {
            api_json(400, ['ok' => false, 'error' => $e->getMessage()]);
        }
        api_json(200, ['ok' => true, 'guide' => $updated]);
    }
    $item = guide_normalize($body, $current);
    if ($item['full_name'] === '' || $item['email'] === '') {
        api_json(400, ['ok' => false, 'error' => '姓名和邮箱不能为空']);
    }
    guides_update($item);
    api_json(200, ['ok' => true, 'guide' => $item]);
}

if ($method === 'PUT') {
    $item = guide_normalize($body, $current);
    if ($item['full_name'] === '' || $item['email'] === '') {
        api_json(400, ['ok' => false, 'error' => '姓名和邮箱不能为空']);
    }
    guides_update($item);
    api_json(200, ['ok' => true, 'guide' => $item]);
}

api_json(405, ['ok' => false, 'error' => 'Method not allowed']);
