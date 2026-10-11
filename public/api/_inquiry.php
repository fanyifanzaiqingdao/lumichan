<?php
declare(strict_types=1);

function inquiry_text(array $input, string $key, int $max, bool $required = false): string
{
    $value = $input[$key] ?? '';
    if (!is_string($value)) {
        throw new InvalidArgumentException("Invalid {$key}");
    }
    $value = trim($value);
    if (($required && $value === '') || mb_strlen($value) > $max || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', $value) || ($key !== 'message' && preg_match('/[\r\n]/', $value))) {
        throw new InvalidArgumentException("Invalid {$key}");
    }
    return $value;
}

function inquiry_validate(array $input): array
{
    $requestId = inquiry_text($input, 'request_id', 36, true);
    if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $requestId)) {
        throw new InvalidArgumentException('Invalid request_id');
    }
    $name = inquiry_text($input, 'name', 100, true);
    if (mb_strlen($name) < 2) throw new InvalidArgumentException('Invalid name');
    $email = inquiry_text($input, 'email', 200, true);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) throw new InvalidArgumentException('Invalid email');
    $contact = inquiry_text($input, 'preferred_contact', 20, true);
    if (!in_array($contact, ['Email', 'WhatsApp', 'WeChat', 'LINE'], true)) throw new InvalidArgumentException('Invalid preferred_contact');
    $handle = inquiry_text($input, 'contact_handle', 80);
    if ($contact !== 'Email' && $handle === '') throw new InvalidArgumentException('Contact handle required');
    $travelers = filter_var($input['travelers'] ?? null, FILTER_VALIDATE_INT);
    if ($travelers === false || $travelers < 1 || $travelers > 999) throw new InvalidArgumentException('Invalid travelers');
    $service = inquiry_text($input, 'preferred_service', 100);
    $allowedServices = ['Not sure yet', 'Journey Planning & Local Support', 'Private Road Trip', 'Signature Private Journey', 'Educational & Cultural Journeys'];
    if ($service !== '' && !in_array($service, $allowedServices, true)) throw new InvalidArgumentException('Invalid preferred_service');
    if ($service === 'Educational & Cultural Journeys' && $travelers < 6) throw new InvalidArgumentException('Educational journeys require six travelers');
    if (($input['privacy_consent'] ?? false) !== true) throw new InvalidArgumentException('Privacy consent required');
    $consentVersion = inquiry_text($input, 'consent_version', 80, true);
    $interests = $input['interests'] ?? [];
    $allowedInterests = ['Flexibility', 'Comfort', 'Culture', 'Nature', 'Budget clarity', 'Easy planning'];
    if (!is_array($interests) || count($interests) > 6) throw new InvalidArgumentException('Invalid interests');
    foreach ($interests as $interest) {
        if (!is_string($interest) || !in_array($interest, $allowedInterests, true)) throw new InvalidArgumentException('Invalid interests');
    }
    $utm = $input['utm'] ?? [];
    if (!is_array($utm)) throw new InvalidArgumentException('Invalid utm');
    $cleanUtm = [];
    foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as $key) {
        if (isset($utm[$key])) {
            if (!is_string($utm[$key]) || mb_strlen($utm[$key]) > 200) throw new InvalidArgumentException('Invalid utm');
            $cleanUtm[$key] = trim($utm[$key]);
        }
    }
    $children = ($input['traveling_with_children'] ?? false) === true;
    $guide = inquiry_text($input, 'english_guide', 20);
    if ($guide !== '' && !in_array($guide, ['Yes', 'No', 'Not sure'], true)) throw new InvalidArgumentException('Invalid english_guide');
    $ageBand = inquiry_text($input, 'child_age_band', 20);
    if ($ageBand !== '' && !in_array($ageBand, ['0-5', '6-12', '13-17'], true)) throw new InvalidArgumentException('Invalid child_age_band');

    return [
        'request_id' => $requestId,
        'name' => $name,
        'email' => $email,
        'preferred_contact' => $contact,
        'contact_handle' => $contact === 'Email' ? '' : $handle,
        'country' => inquiry_text($input, 'country', 100),
        'travelers' => $travelers,
        'travel_dates' => inquiry_text($input, 'travel_dates', 100, true),
        'destinations' => inquiry_text($input, 'destinations', 200),
        'preferred_service' => $service ?: 'Not sure yet',
        'traveling_with_children' => $children ? 1 : 0,
        'child_age_band' => $children ? $ageBand : '',
        'english_guide' => $guide ?: 'Not sure',
        'interests_json' => json_encode(array_values($interests), JSON_UNESCAPED_UNICODE),
        'message' => inquiry_text($input, 'message', 1000),
        'consent_version' => $consentVersion,
        'source_page' => inquiry_text($input, 'source_page', 255, true),
        'utm_json' => json_encode($cleanUtm, JSON_UNESCAPED_UNICODE),
        'language' => inquiry_text($input, 'language', 10, true),
    ];
}

function inquiry_notify(PDO $pdo, string $inquiryId): bool
{
    $claim = $pdo->prepare("UPDATE inquiries SET notification_status = 'sending', notification_attempts = notification_attempts + 1, notification_claimed_at = UTC_TIMESTAMP() WHERE inquiry_id = ? AND notification_status = 'pending'");
    $claim->execute([$inquiryId]);
    if ($claim->rowCount() !== 1) return false;
    $stmt = $pdo->prepare('SELECT * FROM inquiries WHERE inquiry_id = ?');
    $stmt->execute([$inquiryId]);
    $row = $stmt->fetch();
    if (!$row) return false;
    $config = api_config();
    $to = (string) ($config['to_email'] ?? '');
    $body = "Inquiry ID: {$row['inquiry_id']}\nName: {$row['name']}\nEmail: {$row['email']}\nPreferred contact: {$row['preferred_contact']} {$row['contact_handle']}\nCountry: {$row['country']}\nTravelers: {$row['travelers']}\nTravel dates: {$row['travel_dates']}\nDestinations: {$row['destinations']}\nService: {$row['preferred_service']}\nChildren: " . ($row['traveling_with_children'] ? 'Yes' : 'No') . "\nGuide: {$row['english_guide']}\nInterests: {$row['interests_json']}\n\nMessage:\n{$row['message']}\n";
    try {
        $sent = filter_var($to, FILTER_VALIDATE_EMAIL) && api_send_mail($to, '[Lumichan] New journey inquiry ' . $inquiryId, $body, $row['email']);
    } catch (Throwable $e) {
        error_log('Lumichan inquiry notification failure: ' . get_class($e));
        $sent = false;
    }
    $update = $pdo->prepare("UPDATE inquiries SET notification_status = ?, notification_claimed_at = NULL, notified_at = IF(? = 'sent', UTC_TIMESTAMP(), NULL) WHERE inquiry_id = ?");
    $update->execute([$sent ? 'sent' : 'pending', $sent ? 'sent' : 'pending', $inquiryId]);
    return (bool) $sent;
}

function inquiry_rate_limit_ok(PDO $pdo, int $maximum): bool
{
    if ($maximum <= 0) return true;
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    $secret = (string) (api_config()['rate_limit_secret'] ?? api_config()['admin_password'] ?? '');
    $bucket = hash_hmac('sha256', $ip . ':' . gmdate('Y-m-d-H'), $secret);
    $stmt = $pdo->prepare('INSERT INTO inquiry_rate_limits (bucket_hash, hit_count, expires_at) VALUES (?, 1, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 2 HOUR)) ON DUPLICATE KEY UPDATE hit_count = hit_count + 1');
    $stmt->execute([$bucket]);
    $count = $pdo->prepare('SELECT hit_count FROM inquiry_rate_limits WHERE bucket_hash = ?');
    $count->execute([$bucket]);
    return (int) $count->fetchColumn() <= $maximum;
}
