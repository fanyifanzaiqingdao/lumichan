<?php
/**
 * Copy this file to config.php on the server and edit values.
 * Do not commit config.php if it contains real secrets.
 */
return [
    'to_email' => 'you@example.com',
    'from_email' => 'you@example.com',
    'subject_prefix' => '[Lumichan]',

    'save_to_file' => true,
    'send_mail' => true,
    'max_per_hour_per_ip' => 10,

    'smtp_host' => 'smtp.gmail.com',
    'smtp_port' => 465,
    'smtp_secure' => 'ssl',
    'smtp_user' => 'you@example.com',
    'smtp_pass' => 'your-app-password',

    'admin_password' => 'change-me-now',

    'db_host' => '127.0.0.1',
    'db_port' => 3306,
    'db_name' => 'lumingchan',
    'db_user' => 'lumingchan',
    'db_pass' => 'your-db-password',
    'db_charset' => 'utf8mb4',

    // 只收定金：订单金额的 20%（产品 price 字段 × 0.2）
    // 例：$599 → 定金约 $119.80
    'deposit_percent' => 0.2,

    // PayPal https://developer.paypal.com/
    'paypal_mode' => 'sandbox', // sandbox | live
    'paypal_client_id' => '',
    'paypal_secret' => '',

    // Stripe https://dashboard.stripe.com/apikeys
    // 信用卡 + 支付宝国际版（Dashboard 里启用 Alipay）
    'stripe_publishable_key' => '',
    'stripe_secret_key' => '',
    'stripe_card' => true,
    'stripe_alipay' => true,
];
