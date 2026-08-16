<?php
/**
 * Public payment provider flags + PayPal client id (safe to expose).
 */
require __DIR__ . '/_lib.php';

api_cors_and_method(['GET']);

$c = api_config();
$pct = (float) ($c['deposit_percent'] ?? 0.2);
api_json(200, [
    'ok' => true,
    'paypal' => [
        'enabled' => paypal_configured(),
        'client_id' => paypal_configured() ? (string) ($c['paypal_client_id'] ?? '') : '',
        'mode' => (string) ($c['paypal_mode'] ?? 'sandbox'),
    ],
    'stripe' => [
        'enabled' => stripe_configured(),
        'publishable_key' => (string) ($c['stripe_publishable_key'] ?? ''),
        // Alipay International via Stripe (enable Alipay in Stripe Dashboard)
        'alipay' => !array_key_exists('stripe_alipay', $c) || !empty($c['stripe_alipay']),
        'card' => !array_key_exists('stripe_card', $c) || !empty($c['stripe_card']),
    ],
    'deposit_percent' => $pct,
]);
