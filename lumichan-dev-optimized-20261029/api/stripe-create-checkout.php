<?php
require __DIR__ . '/_lib.php';

api_cors_and_method(['POST']);

if (!stripe_configured()) {
    api_json(503, ['ok' => false, 'error' => 'Stripe not configured']);
}

$body = api_read_json_body();
$productId = trim((string) ($body['product_id'] ?? ''));
$method = strtolower(trim((string) ($body['method'] ?? 'card'))); // card | alipay | auto
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

$zeroDecimal = ['JPY', 'KRW'];
$currencyCode = strtoupper($deposit['currency']);
$currency = strtolower($deposit['currency']);
$unitAmount = in_array($currencyCode, $zeroDecimal, true)
    ? (int) round($deposit['amount'])
    : (int) round($deposit['amount'] * 100);

if ($unitAmount < 1) {
    api_json(400, ['ok' => false, 'error' => 'Amount too small']);
}

$origin = trim((string) ($body['origin'] ?? ''));
if ($origin === '' || !preg_match('#^https?://#i', $origin)) {
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $origin = ($https ? 'https://' : 'http://') . $host;
}
$origin = rtrim($origin, '/');

$success = $origin . '/traveler/itineraries?paid=1&provider=stripe&session_id={CHECKOUT_SESSION_ID}';
$cancel = $origin . '/traveler/itineraries?paid=0&provider=stripe';

$config = api_config();
$allowCard = !array_key_exists('stripe_card', $config) || !empty($config['stripe_card']);
$allowAlipay = !array_key_exists('stripe_alipay', $config) || !empty($config['stripe_alipay']);

$methods = [];
if ($method === 'alipay') {
    if (!$allowAlipay) {
        api_json(400, ['ok' => false, 'error' => 'Alipay is disabled']);
    }
    $methods = ['alipay'];
} elseif ($method === 'card') {
    if (!$allowCard) {
        api_json(400, ['ok' => false, 'error' => 'Card payments are disabled']);
    }
    $methods = ['card'];
} else {
    // auto: offer both when enabled
    if ($allowCard) {
        $methods[] = 'card';
    }
    if ($allowAlipay) {
        $methods[] = 'alipay';
    }
}

if ($methods === []) {
    api_json(400, ['ok' => false, 'error' => 'No Stripe payment methods enabled']);
}

$pct = (float) ($config['deposit_percent'] ?? 0.2);
$pctLabel = ($pct > 1 ? $pct : $pct * 100);
$pctLabel = rtrim(rtrim(number_format($pctLabel, 2, '.', ''), '0'), '.');

$fields = [
    'mode' => 'payment',
    'success_url' => $success,
    'cancel_url' => $cancel,
    'line_items[0][quantity]' => 1,
    'line_items[0][price_data][currency]' => $currency,
    'line_items[0][price_data][unit_amount]' => $unitAmount,
    'line_items[0][price_data][product_data][name]' => "Lumichan {$pctLabel}% deposit – " . $product['title'],
    'line_items[0][price_data][product_data][description]' => 'Trip deposit only. Balance due before travel.',
    'metadata[product_id]' => $productId,
    'metadata[type]' => 'deposit',
    'metadata[deposit_percent]' => (string) $pct,
    'metadata[full_price]' => (string) ($product['price'] ?? ''),
];

foreach ($methods as $i => $m) {
    $fields["payment_method_types[{$i}]"] = $m;
}

try {
    $session = stripe_api('POST', '/checkout/sessions', $fields);
} catch (Throwable $e) {
    api_json(502, ['ok' => false, 'error' => $e->getMessage()]);
}

payment_log([
    'event' => 'stripe_checkout_create',
    'provider' => 'stripe',
    'method' => $method,
    'methods' => $methods,
    'product_id' => $productId,
    'session_id' => $session['id'] ?? null,
    'amount' => $deposit['amount'],
    'currency' => $deposit['currency'],
    'deposit_percent' => $pct,
]);

api_json(200, [
    'ok' => true,
    'url' => $session['url'] ?? null,
    'id' => $session['id'] ?? null,
    'amount' => $deposit['amount'],
    'currency' => $deposit['currency'],
]);
