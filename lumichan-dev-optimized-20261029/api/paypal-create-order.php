<?php
require __DIR__ . '/_lib.php';

api_cors_and_method(['POST']);

if (!paypal_configured()) {
    api_json(503, ['ok' => false, 'error' => 'PayPal not configured']);
}

$body = api_read_json_body();
$productId = trim((string) ($body['product_id'] ?? ''));
if ($productId === '') {
    api_json(400, ['ok' => false, 'error' => 'Missing product_id']);
}

$product = products_find($productId);
if ($product === null || empty($product['is_published'])) {
    api_json(404, ['ok' => false, 'error' => 'Product not found']);
}

$deposit = deposit_amount_for_product($product);
if ($deposit === null) {
    api_json(400, ['ok' => false, 'error' => 'Invalid product price']);
}
if ($deposit['currency'] === 'CNY') {
    api_json(400, ['ok' => false, 'error' => 'PayPal deposit is not available for CNY prices']);
}

$amount = number_format($deposit['amount'], 2, '.', '');
$currency = $deposit['currency'];
$description = 'Lumichan – ' . $product['title'];

try {
    $order = paypal_api('POST', '/v2/checkout/orders', [
        'intent' => 'CAPTURE',
        'purchase_units' => [[
            'reference_id' => 'trip-' . $productId,
            'description' => mb_substr($description, 0, 120),
            'custom_id' => $productId,
            'amount' => [
                'currency_code' => $currency,
                'value' => $amount,
            ],
        ]],
        'application_context' => [
            'shipping_preference' => 'NO_SHIPPING',
            'user_action' => 'PAY_NOW',
            'brand_name' => 'Lumichan',
        ],
    ]);
} catch (Throwable $e) {
    api_json(502, ['ok' => false, 'error' => $e->getMessage()]);
}

payment_log([
    'event' => 'paypal_create',
    'provider' => 'paypal',
    'product_id' => $productId,
    'order_id' => $order['id'] ?? null,
    'amount' => $deposit['amount'],
    'currency' => $currency,
]);

api_json(200, [
    'ok' => true,
    'id' => $order['id'] ?? null,
    'amount' => $deposit['amount'],
    'currency' => $currency,
]);
