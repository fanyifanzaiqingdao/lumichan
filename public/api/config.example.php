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
    'rate_limit_secret' => 'replace-with-a-long-random-value',

    'smtp_host' => 'smtp.gmail.com',
    'smtp_port' => 465,
    'smtp_secure' => 'ssl',
    'smtp_user' => 'you@example.com',
    'smtp_pass' => 'your-app-password',

    'admin_password' => 'change-me-now',
    // Enable only after importing support-schema.sql and scheduling support-maintenance.php.
    'support_enabled' => false,
    'deepseek_api_key' => '', // Prefer the DEEPSEEK_API_KEY server environment variable.
    'deepseek_support_model' => 'deepseek-flash',
    'support_daily_ai_limit' => 200,
    'support_public_url' => 'https://test.lumichan.com.cn',
    'support_wecom_webhook' => '', // Private enterprise WeChat group robot webhook.
    'support_reply_emails' => ['jin.lu@lumichan.com.cn'],
    'support_disabled_emails' => [], // Revoke departed employees here.
    // Travel Lead Finder AI drafts read DeepSeek from the server environment:
    // DEEPSEEK_API_KEY=your-private-key
    // Do not put this key in frontend code or commit it to git.

    'db_host' => '127.0.0.1',
    'db_port' => 3306,
    'db_name' => 'lumingchan',
    'db_user' => 'lumingchan',
    'db_pass' => 'your-db-password',
    'db_charset' => 'utf8mb4',

    // 只收定金：展示用参考比例（产品 price × 比例）
    // PayPal Payment Link 金额以链接里设定为准（个人账户可用，无需 Client ID）
    'deposit_percent' => 0.2,
    'paypal_payment_link' => 'https://www.paypal.com/ncp/payment/84Y8LAY8N457A',

    // PayPal REST API（Business 账号才有；有 payment_link 时前端优先用链接）
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
