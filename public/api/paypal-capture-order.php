<?php
require __DIR__ . '/_lib.php';

api_cors_and_method(['POST']);

if (!paypal_configured()) {
    api_json(503, ['ok' => false, 'error' => 'PayPal not configured']);
}

$body = api_read_json_body();
$orderId = trim((string) ($body['order_id'] ?? ''));
if ($orderId === '') {
    api_json(400, ['ok' => false, 'error' => 'Missing order_id']);
}

try {
    $captured = paypal_api('POST', '/v2/checkout/orders/' . rawurlencode($orderId) . '/capture', (object) []);
} catch (Throwable $e) {
    api_json(502, ['ok' => false, 'error' => $e->getMessage()]);
}

$status = (string) ($captured['status'] ?? '');
$unit = $captured['purchase_units'][0] ?? [];
$capture = $unit['payments']['captures'][0] ?? [];
$amount = $capture['amount']['value'] ?? null;
$currency = $capture['amount']['currency_code'] ?? null;
$productId = (string) ($unit['custom_id'] ?? '');
$payerEmail = $captured['payer']['email_address'] ?? '';

payment_log([
    'event' => 'paypal_capture',
    'provider' => 'paypal',
    'order_id' => $orderId,
    'status' => $status,
    'product_id' => $productId,
    'amount' => $amount,
    'currency' => $currency,
    'payer_email' => $payerEmail,
    'raw_id' => $capture['id'] ?? null,
]);

if ($status === 'COMPLETED') {
    $product = $productId !== '' ? products_find($productId) : null;
    $title = $product['title'] ?? ($productId ?: 'Trip');
    payment_notify_admin(
        'PayPal deposit received',
        "Status: {$status}\nOrder: {$orderId}\nProduct: {$title}\nAmount: {$amount} {$currency}\nPayer: {$payerEmail}\n"
    );
}

api_json(200, [
    'ok' => true,
    'status' => $status,
    'amount' => $amount,
    'currency' => $currency,
]);
