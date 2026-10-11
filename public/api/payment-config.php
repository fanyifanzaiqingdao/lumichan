<?php
/**
 * Public payment provider flags (safe to expose).
 */
require __DIR__ . '/_lib.php';

api_cors_and_method(['GET']);

$c = api_config();
$pct = (float) ($c['deposit_percent'] ?? 0.2);
$paymentLink = trim((string) ($c['paypal_payment_link'] ?? ''));
$paypalApi = paypal_configured();
$paypalEnabled = $paymentLink !== '' || $paypalApi;

api_json(200, [
    'ok' => true,
    'paypal' => [
        'enabled' => $paypalEnabled,
        // Prefer Payment Link (Personal / no API keys). Empty when using REST API only.
        'payment_link' => $paymentLink,
        'client_id' => $paypalApi ? (string) ($c['paypal_client_id'] ?? '') : '',
        'mode' => (string) ($c['paypal_mode'] ?? 'sandbox'),
    ],
    'stripe' => [
        'enabled' => stripe_configured(),
        'publishable_key' => (string) ($c['stripe_publishable_key'] ?? ''),
        'alipay' => !array_key_exists('stripe_alipay', $c) || !empty($c['stripe_alipay']),
        'card' => !array_key_exists('stripe_card', $c) || !empty($c['stripe_card']),
    ],
    'deposit_percent' => $pct,
]);
