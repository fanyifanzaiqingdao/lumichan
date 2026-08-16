<?php
/** Confirm Stripe Checkout session after redirect (sends admin email once). */
require __DIR__ . '/_lib.php';

api_cors_and_method(['POST']);

if (!stripe_configured()) {
    api_json(503, ['ok' => false, 'error' => 'Stripe not configured']);
}

$body = api_read_json_body();
$sessionId = trim((string) ($body['session_id'] ?? ''));
if ($sessionId === '' || !preg_match('/^cs_/', $sessionId)) {
    api_json(400, ['ok' => false, 'error' => 'Missing session_id']);
}

try {
    $session = stripe_api('GET', '/checkout/sessions/' . rawurlencode($sessionId));
} catch (Throwable $e) {
    api_json(502, ['ok' => false, 'error' => $e->getMessage()]);
}

$paid = (($session['payment_status'] ?? '') === 'paid') || (($session['status'] ?? '') === 'complete');
$productId = (string) (($session['metadata']['product_id'] ?? ''));
$amountTotal = isset($session['amount_total']) ? ((int) $session['amount_total']) / 100 : null;
$currency = strtoupper((string) ($session['currency'] ?? ''));
$customerEmail = (string) ($session['customer_details']['email'] ?? ($session['customer_email'] ?? ''));

payment_log([
    'event' => 'stripe_confirm',
    'provider' => 'stripe',
    'session_id' => $sessionId,
    'paid' => $paid,
    'product_id' => $productId,
    'amount' => $amountTotal,
    'currency' => $currency,
    'customer_email' => $customerEmail,
]);

if ($paid) {
    $product = $productId !== '' ? products_find($productId) : null;
    $title = $product['title'] ?? ($productId ?: 'Trip');
    payment_notify_admin(
        'Stripe deposit received',
        "Session: {$sessionId}\nProduct: {$title}\nAmount: {$amountTotal} {$currency}\nCustomer: {$customerEmail}\n"
    );
}

api_json(200, [
    'ok' => true,
    'paid' => $paid,
    'amount' => $amountTotal,
    'currency' => $currency,
]);
