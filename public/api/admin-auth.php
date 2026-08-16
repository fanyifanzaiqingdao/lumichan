<?php
require __DIR__ . '/_lib.php';

api_cors_and_method(['GET', 'POST']);
admin_session_start();

$action = $_GET['action'] ?? '';
$body = api_read_json_body();
if ($action === '' && isset($body['action'])) {
    $action = (string) $body['action'];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' || $action === 'me') {
    api_json(200, [
        'ok' => true,
        'logged_in' => !empty($_SESSION['admin_ok']),
    ]);
}

if ($action === 'login') {
    $password = (string) ($body['password'] ?? '');
    if (!admin_password_ok($password)) {
        api_json(401, ['ok' => false, 'error' => '密码错误']);
    }
    $_SESSION['admin_ok'] = true;
    $_SESSION['admin_at'] = time();
    api_json(200, ['ok' => true, 'logged_in' => true]);
}

if ($action === 'logout') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'] ?? '', (bool) $p['secure'], (bool) $p['httponly']);
    }
    session_destroy();
    api_json(200, ['ok' => true, 'logged_in' => false]);
}

api_json(400, ['ok' => false, 'error' => 'Unknown action']);
