<?php
/**
 * Test site only: copy to config.php in the separate test site's api directory.
 * Keep config.example.php alongside this file. Never reuse production credentials.
 */
return array_replace(require __DIR__ . '/config.example.php', [
    'to_email' => '',
    'from_email' => '',
    'subject_prefix' => '[Lumichan TEST]',
    'send_mail' => false,
    'smtp_host' => '',
    'smtp_user' => '',
    'smtp_pass' => '',
    'admin_password' => '',
    'rate_limit_secret' => '',
    'db_name' => 'lumichan_test',
    'db_user' => 'lumichan_test',
    'db_pass' => '',
    'paypal_payment_link' => '',
    'paypal_mode' => 'sandbox',
    'paypal_client_id' => '',
    'paypal_secret' => '',
    'stripe_publishable_key' => '',
    'stripe_secret_key' => '',
]);
