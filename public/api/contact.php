<?php
/**
 * Lumichan contact form endpoint for Baota (LNMP).
 */
require __DIR__ . '/_lib.php';

api_cors_and_method(['POST']);

$config = api_config();
$toEmail = (string) ($config['to_email'] ?? '');
$subjectPrefix = (string) ($config['subject_prefix'] ?? '[Lumichan]');
$saveToFile = (bool) ($config['save_to_file'] ?? true);
$sendMail = (bool) ($config['send_mail'] ?? true);
$maxPerHour = (int) ($config['max_per_hour_per_ip'] ?? 10);

if ($toEmail === '' || !filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
    api_json(500, ['ok' => false, 'error' => 'Invalid to_email in config.php']);
}

$input = contact_read_input();
$name = trim((string) ($input['name'] ?? ''));
$email = trim((string) ($input['email'] ?? ''));
$phone = trim((string) ($input['phone'] ?? ''));
$subjectInput = trim((string) ($input['subject'] ?? ''));
$message = trim((string) ($input['message'] ?? ''));
$honeypot = trim((string) ($input['website'] ?? ''));

if ($honeypot !== '') {
    api_json(200, ['ok' => true]);
}

if ($name === '' || mb_strlen($name) > 120) {
    api_json(400, ['ok' => false, 'error' => 'Invalid name']);
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 200) {
    api_json(400, ['ok' => false, 'error' => 'Invalid email']);
}
if ($phone !== '' && (mb_strlen($phone) > 60 || contact_header_injection($phone))) {
    api_json(400, ['ok' => false, 'error' => 'Invalid phone']);
}
if ($subjectInput === '' || mb_strlen($subjectInput) > 200 || contact_header_injection($subjectInput)) {
    api_json(400, ['ok' => false, 'error' => 'Invalid subject']);
}
if ($message === '' || mb_strlen($message) > 5000) {
    api_json(400, ['ok' => false, 'error' => 'Invalid message']);
}
if (contact_header_injection($name) || contact_header_injection($email)) {
    api_json(400, ['ok' => false, 'error' => 'Invalid input']);
}

$ip = contact_client_ip();
if (!contact_rate_limit_ok($ip, $maxPerHour)) {
    api_json(429, ['ok' => false, 'error' => 'Too many requests. Please try later.']);
}

$record = [
    'time' => gmdate('c'),
    'ip' => $ip,
    'name' => $name,
    'email' => $email,
    'phone' => $phone,
    'subject' => $subjectInput,
    'message' => $message,
];

$dataDir = __DIR__ . '/data';
if ($saveToFile) {
    if (!is_dir($dataDir) && !mkdir($dataDir, 0750, true) && !is_dir($dataDir)) {
        api_json(500, ['ok' => false, 'error' => 'Cannot create data directory']);
    }
    $line = json_encode($record, JSON_UNESCAPED_UNICODE) . "\n";
    if (file_put_contents($dataDir . '/submissions.jsonl', $line, FILE_APPEND | LOCK_EX) === false) {
        api_json(500, ['ok' => false, 'error' => 'Failed to save message']);
    }
}

$mailOk = true;
if ($sendMail) {
    $subject = $subjectPrefix . ' ' . $subjectInput;
    $body = "Name: {$name}\nEmail: {$email}\nPhone: {$phone}\nSubject: {$subjectInput}\nIP: {$ip}\nTime: {$record['time']}\n\nMessage:\n{$message}\n";
    $mailOk = api_send_mail($toEmail, $subject, $body, $email);
}

if (!$saveToFile && !$mailOk) {
    api_json(500, ['ok' => false, 'error' => 'Failed to deliver message']);
}

api_json(200, [
    'ok' => true,
    'mail' => $mailOk,
]);

function contact_read_input(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input') ?: '';
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }
    return $_POST;
}

function contact_header_injection(string $value): bool
{
    return (bool) preg_match('/[\r\n]/', $value);
}

function contact_client_ip(): string
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : '0.0.0.0';
}

function contact_rate_limit_ok(string $ip, int $maxPerHour): bool
{
    if ($maxPerHour <= 0) {
        return true;
    }
    $dir = __DIR__ . '/data';
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    $file = $dir . '/rate_' . hash('sha256', $ip) . '.json';
    $now = time();
    $window = 3600;
    $hits = [];
    if (is_file($file)) {
        $decoded = json_decode((string) file_get_contents($file), true);
        if (is_array($decoded)) {
            $hits = array_values(array_filter($decoded, static fn($t) => is_int($t) && $t > $now - $window));
        }
    }
    if (count($hits) >= $maxPerHour) {
        return false;
    }
    $hits[] = $now;
    file_put_contents($file, json_encode($hits), LOCK_EX);
    return true;
}
