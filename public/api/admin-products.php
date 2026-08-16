<?php
require __DIR__ . '/_lib.php';

api_cors_and_method(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
admin_require();

$method = $_SERVER['REQUEST_METHOD'];
$body = api_read_json_body();

if ($method === 'GET') {
    api_json(200, ['ok' => true, 'products' => products_load(false)]);
}

if ($method === 'POST') {
    $item = product_normalize($body);
    if ($item['title'] === '') {
        api_json(400, ['ok' => false, 'error' => '标题不能为空']);
    }
    if ((int) $item['sort_order'] === 0) {
        $item['sort_order'] = products_max_sort_order() + 1;
    }
    try {
        products_insert($item);
    } catch (Throwable $e) {
        api_json(500, ['ok' => false, 'error' => '创建失败（可能是 ID 重复）']);
    }
    api_json(200, ['ok' => true, 'product' => $item]);
}

$id = (string) ($_GET['id'] ?? ($body['id'] ?? ''));
if ($id === '') {
    api_json(400, ['ok' => false, 'error' => 'Missing product id']);
}

$current = products_find($id);
if ($current === null) {
    api_json(404, ['ok' => false, 'error' => 'Product not found']);
}

if ($method === 'DELETE') {
    products_delete($id);
    api_json(200, ['ok' => true]);
}

if ($method === 'PATCH') {
    if (array_key_exists('is_published', $body) && count($body) <= 2) {
        $updated = products_set_published($id, (bool) $body['is_published']);
        api_json(200, ['ok' => true, 'product' => $updated]);
    }
    $item = product_normalize($body, $current);
    if ($item['title'] === '') {
        api_json(400, ['ok' => false, 'error' => '标题不能为空']);
    }
    products_update($item);
    api_json(200, ['ok' => true, 'product' => $item]);
}

if ($method === 'PUT') {
    $item = product_normalize($body, $current);
    if ($item['title'] === '') {
        api_json(400, ['ok' => false, 'error' => '标题不能为空']);
    }
    products_update($item);
    api_json(200, ['ok' => true, 'product' => $item]);
}

api_json(405, ['ok' => false, 'error' => 'Method not allowed']);
