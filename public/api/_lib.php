<?php
/**
 * Shared helpers for Lumichan API (MySQL products).
 */

declare(strict_types=1);

function api_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }
    $file = __DIR__ . '/config.php';
    if (!is_file($file)) {
        api_json(500, ['ok' => false, 'error' => 'Missing api/config.php']);
    }
    $config = require $file;
    return is_array($config) ? $config : [];
}

function api_json(int $code, array $payload): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function api_read_json_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function api_cors_and_method(array $allow): void
{
    header('Content-Type: application/json; charset=utf-8');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        header('Access-Control-Allow-Methods: ' . implode(', ', $allow) . ', OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
        header('Access-Control-Allow-Credentials: true');
        http_response_code(204);
        exit;
    }
    if (!in_array($_SERVER['REQUEST_METHOD'], $allow, true)) {
        api_json(405, ['ok' => false, 'error' => 'Method not allowed']);
    }
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $c = api_config();
    $host = (string) ($c['db_host'] ?? '127.0.0.1');
    $port = (int) ($c['db_port'] ?? 3306);
    $name = (string) ($c['db_name'] ?? '');
    $user = (string) ($c['db_user'] ?? '');
    $pass = (string) ($c['db_pass'] ?? '');
    $charset = (string) ($c['db_charset'] ?? 'utf8mb4');

    if ($name === '' || $user === '') {
        api_json(500, ['ok' => false, 'error' => 'Database not configured in config.php']);
    }

    try {
        $dsn = "mysql:host={$host};port={$port};dbname={$name};charset={$charset}";
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (Throwable $e) {
        api_json(500, ['ok' => false, 'error' => 'Database connection failed']);
    }

    return $pdo;
}

function json_col(mixed $value): array
{
    if (is_array($value)) {
        return $value;
    }
    if ($value === null || $value === '') {
        return [];
    }
    if (is_string($value)) {
        $decoded = json_decode($value, true);
        return is_array($decoded) ? $decoded : [];
    }
    return [];
}

function product_from_row(array $row): array
{
    return [
        'id' => (string) $row['id'],
        'title' => (string) ($row['title'] ?? ''),
        'subtitle' => (string) ($row['subtitle'] ?? ''),
        'description' => (string) ($row['description'] ?? ''),
        'long_description' => $row['long_description'] ?? null,
        'duration' => (string) ($row['duration'] ?? ''),
        'price' => (string) ($row['price'] ?? ''),
        'rating' => isset($row['rating']) ? (float) $row['rating'] : 5.0,
        'review_count' => (int) ($row['review_count'] ?? 0),
        'max_altitude' => (string) ($row['max_altitude'] ?? ''),
        'group_size' => (string) ($row['group_size'] ?? ''),
        'highlights' => json_col($row['highlights'] ?? []),
        'itinerary' => json_col($row['itinerary'] ?? []),
        'inclusions' => json_col($row['inclusions'] ?? []),
        'exclusions' => json_col($row['exclusions'] ?? []),
        'sort_order' => (int) ($row['sort_order'] ?? 0),
        'image' => (string) ($row['image'] ?? ''),
        'is_published' => (bool) ($row['is_published'] ?? 0),
        'created_at' => $row['created_at'] ?? null,
        'updated_at' => $row['updated_at'] ?? null,
    ];
}

/** @return list<array> */
function products_load(bool $publishedOnly = false): array
{
    $sql = 'SELECT * FROM products';
    if ($publishedOnly) {
        $sql .= ' WHERE is_published = 1';
    }
    $sql .= ' ORDER BY sort_order ASC, created_at ASC';
    $stmt = db()->query($sql);
    $rows = $stmt->fetchAll();
    return array_map('product_from_row', $rows);
}

function products_find(string $id): ?array
{
    $stmt = db()->prepare('SELECT * FROM products WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ? product_from_row($row) : null;
}

function products_max_sort_order(): int
{
    $val = db()->query('SELECT COALESCE(MAX(sort_order), 0) FROM products')->fetchColumn();
    return (int) $val;
}

function products_insert(array $item): array
{
    $sql = 'INSERT INTO products (
        id, title, subtitle, description, long_description, duration, price, rating, review_count,
        max_altitude, group_size, highlights, itinerary, inclusions, exclusions,
        sort_order, image, is_published, created_at, updated_at
    ) VALUES (
        :id, :title, :subtitle, :description, :long_description, :duration, :price, :rating, :review_count,
        :max_altitude, :group_size, :highlights, :itinerary, :inclusions, :exclusions,
        :sort_order, :image, :is_published, :created_at, :updated_at
    )';
    db()->prepare($sql)->execute(product_bind($item));
    return $item;
}

function products_update(array $item): array
{
    $sql = 'UPDATE products SET
        title = :title,
        subtitle = :subtitle,
        description = :description,
        long_description = :long_description,
        duration = :duration,
        price = :price,
        rating = :rating,
        review_count = :review_count,
        max_altitude = :max_altitude,
        group_size = :group_size,
        highlights = :highlights,
        itinerary = :itinerary,
        inclusions = :inclusions,
        exclusions = :exclusions,
        sort_order = :sort_order,
        image = :image,
        is_published = :is_published,
        updated_at = :updated_at
      WHERE id = :id';
    $bind = product_bind($item);
    unset($bind[':created_at']);
    db()->prepare($sql)->execute($bind);
    return $item;
}

function products_set_published(string $id, bool $published): ?array
{
    $stmt = db()->prepare('UPDATE products SET is_published = ?, updated_at = ? WHERE id = ?');
    $stmt->execute([$published ? 1 : 0, gmdate('c'), $id]);
    return products_find($id);
}

function products_delete(string $id): bool
{
    $stmt = db()->prepare('DELETE FROM products WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->rowCount() > 0;
}

function product_bind(array $item): array
{
    return [
        ':id' => $item['id'],
        ':title' => $item['title'],
        ':subtitle' => $item['subtitle'],
        ':description' => $item['description'],
        ':long_description' => $item['long_description'],
        ':duration' => $item['duration'],
        ':price' => $item['price'],
        ':rating' => $item['rating'],
        ':review_count' => $item['review_count'],
        ':max_altitude' => $item['max_altitude'],
        ':group_size' => $item['group_size'],
        ':highlights' => json_encode($item['highlights'] ?? [], JSON_UNESCAPED_UNICODE),
        ':itinerary' => json_encode($item['itinerary'] ?? [], JSON_UNESCAPED_UNICODE),
        ':inclusions' => json_encode($item['inclusions'] ?? [], JSON_UNESCAPED_UNICODE),
        ':exclusions' => json_encode($item['exclusions'] ?? [], JSON_UNESCAPED_UNICODE),
        ':sort_order' => $item['sort_order'],
        ':image' => $item['image'],
        ':is_published' => !empty($item['is_published']) ? 1 : 0,
        ':created_at' => $item['created_at'],
        ':updated_at' => $item['updated_at'],
    ];
}

function product_normalize(array $input, ?array $existing = null): array
{
    $base = $existing ?? [];
    $highlights = $input['highlights'] ?? ($base['highlights'] ?? []);
    if (is_string($highlights)) {
        $highlights = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n|,/', $highlights) ?: [])));
    }
    if (!is_array($highlights)) {
        $highlights = [];
    }

    $id = (string) ($input['id'] ?? ($base['id'] ?? ''));
    if ($id === '') {
        $hex = bin2hex(random_bytes(16));
        $id = substr($hex, 0, 8) . '-' . substr($hex, 8, 4) . '-' . substr($hex, 12, 4) . '-' . substr($hex, 16, 4) . '-' . substr($hex, 20, 12);
    }

    $now = gmdate('c');
    $published = $input['is_published'] ?? ($base['is_published'] ?? true);
    if (is_string($published)) {
        $published = in_array(strtolower($published), ['1', 'true', 'yes', 'on'], true);
    }

    $long = $input['long_description'] ?? ($base['long_description'] ?? null);
    if ($long === '') {
        $long = null;
    }

    return [
        'id' => $id,
        'title' => trim((string) ($input['title'] ?? ($base['title'] ?? ''))),
        'subtitle' => trim((string) ($input['subtitle'] ?? ($base['subtitle'] ?? ''))),
        'description' => trim((string) ($input['description'] ?? ($base['description'] ?? ''))),
        'long_description' => $long,
        'duration' => trim((string) ($input['duration'] ?? ($base['duration'] ?? ''))),
        'price' => trim((string) ($input['price'] ?? ($base['price'] ?? ''))),
        'rating' => isset($input['rating']) ? (float) $input['rating'] : (isset($base['rating']) ? (float) $base['rating'] : 5.0),
        'review_count' => isset($input['review_count']) ? (int) $input['review_count'] : (int) ($base['review_count'] ?? 0),
        'max_altitude' => trim((string) ($input['max_altitude'] ?? ($base['max_altitude'] ?? ''))),
        'group_size' => trim((string) ($input['group_size'] ?? ($base['group_size'] ?? ''))),
        'highlights' => array_values($highlights),
        'itinerary' => is_array($input['itinerary'] ?? null) ? $input['itinerary'] : ($base['itinerary'] ?? []),
        'inclusions' => is_array($input['inclusions'] ?? null) ? $input['inclusions'] : ($base['inclusions'] ?? []),
        'exclusions' => is_array($input['exclusions'] ?? null) ? $input['exclusions'] : ($base['exclusions'] ?? []),
        'sort_order' => isset($input['sort_order']) ? (int) $input['sort_order'] : (int) ($base['sort_order'] ?? 0),
        'image' => trim((string) ($input['image'] ?? ($base['image'] ?? ''))),
        'is_published' => (bool) $published,
        'created_at' => $base['created_at'] ?? $now,
        'updated_at' => $now,
    ];
}

function admin_session_start(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_name('lumichan_admin');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function admin_require(): void
{
    admin_session_start();
    if (empty($_SESSION['admin_ok'])) {
        api_json(401, ['ok' => false, 'error' => 'Unauthorized']);
    }
}

function admin_password_ok(string $password): bool
{
    $config = api_config();
    $expected = (string) ($config['admin_password'] ?? '');
    if ($expected === '') {
        return false;
    }
    return hash_equals($expected, $password);
}

/**
 * Send email via SMTP (preferred) or PHP mail().
 * QQ mail: smtp.qq.com:465 ssl, smtp_user=QQ邮箱, smtp_pass=授权码（不是QQ登录密码）
 */
function api_send_mail(string $to, string $subject, string $body, ?string $replyTo = null): bool
{
    $config = api_config();
    if (empty($config['send_mail'])) {
        return false;
    }

    $from = (string) ($config['from_email'] ?? '');
    $smtpUser = trim((string) ($config['smtp_user'] ?? ''));
    $smtpPass = (string) ($config['smtp_pass'] ?? '');
    $smtpHost = trim((string) ($config['smtp_host'] ?? ''));

    // If SMTP is configured, From should match the mailbox (esp. QQ).
    if ($smtpUser !== '' && $smtpPass !== '' && $smtpHost !== '') {
        if ($from === '' || !filter_var($from, FILTER_VALIDATE_EMAIL)) {
            $from = $smtpUser;
        }
        return smtp_send_mail([
            'host' => $smtpHost,
            'port' => (int) ($config['smtp_port'] ?? 465),
            'secure' => (string) ($config['smtp_secure'] ?? 'ssl'), // ssl | tls | ''
            'user' => $smtpUser,
            'pass' => $smtpPass,
            'from' => $from,
            'to' => $to,
            'subject' => $subject,
            'body' => $body,
            'reply_to' => $replyTo,
        ]);
    }

    if ($from === '') {
        $from = 'noreply@localhost';
    }
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'From: ' . $from,
        'X-Mailer: Lumichan',
    ];
    if ($replyTo && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
        $headers[] = 'Reply-To: ' . $replyTo;
    }
    return @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers));
}

function smtp_send_mail(array $o): bool
{
    $host = $o['host'];
    $port = (int) $o['port'];
    $secure = strtolower((string) $o['secure']);
    $timeout = 20;

    $remote = ($secure === 'ssl' ? 'ssl://' : '') . $host . ':' . $port;
    $fp = @stream_socket_client($remote, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT);
    if (!$fp) {
        return false;
    }
    stream_set_timeout($fp, $timeout);

    $read = static function () use ($fp): string {
        $data = '';
        while (!feof($fp)) {
            $line = fgets($fp, 515);
            if ($line === false) {
                break;
            }
            $data .= $line;
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
        }
        return $data;
    };
    $write = static function (string $cmd) use ($fp): void {
        fwrite($fp, $cmd . "\r\n");
    };
    $expect = static function (string $resp, string $code): bool {
        return str_starts_with($resp, $code);
    };

    try {
        if (!$expect($read(), '220')) {
            fclose($fp);
            return false;
        }
        $write('EHLO lumichan.local');
        $ehlo = $read();
        if (!$expect($ehlo, '250')) {
            $write('HELO lumichan.local');
            if (!$expect($read(), '250')) {
                fclose($fp);
                return false;
            }
        }

        if ($secure === 'tls') {
            $write('STARTTLS');
            if (!$expect($read(), '220')) {
                fclose($fp);
                return false;
            }
            if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                fclose($fp);
                return false;
            }
            $write('EHLO lumichan.local');
            if (!$expect($read(), '250')) {
                fclose($fp);
                return false;
            }
        }

        $write('AUTH LOGIN');
        if (!$expect($read(), '334')) {
            fclose($fp);
            return false;
        }
        $write(base64_encode($o['user']));
        if (!$expect($read(), '334')) {
            fclose($fp);
            return false;
        }
        $write(base64_encode($o['pass']));
        if (!$expect($read(), '235')) {
            fclose($fp);
            return false;
        }

        $write('MAIL FROM:<' . $o['from'] . '>');
        if (!$expect($read(), '250')) {
            fclose($fp);
            return false;
        }
        $write('RCPT TO:<' . $o['to'] . '>');
        if (!$expect($read(), '250')) {
            fclose($fp);
            return false;
        }
        $write('DATA');
        if (!$expect($read(), '354')) {
            fclose($fp);
            return false;
        }

        $subject = '=?UTF-8?B?' . base64_encode($o['subject']) . '?=';
        $headers = [
            'Date: ' . date('r'),
            'From: ' . $o['from'],
            'To: ' . $o['to'],
            'Subject: ' . $subject,
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
        ];
        if (!empty($o['reply_to']) && filter_var($o['reply_to'], FILTER_VALIDATE_EMAIL)) {
            $headers[] = 'Reply-To: ' . $o['reply_to'];
        }

        $body = chunk_split(base64_encode($o['body']));
        $data = implode("\r\n", $headers) . "\r\n\r\n" . $body;
        // Dot-stuffing
        $data = preg_replace('/^\./m', '..', $data) ?? $data;
        $write($data . "\r\n.");
        if (!$expect($read(), '250')) {
            fclose($fp);
            return false;
        }
        $write('QUIT');
        fclose($fp);
        return true;
    } catch (Throwable $e) {
        fclose($fp);
        return false;
    }
}

function api_new_id(): string
{
    $hex = bin2hex(random_bytes(16));
    return substr($hex, 0, 8) . '-' . substr($hex, 8, 4) . '-' . substr($hex, 12, 4) . '-' . substr($hex, 16, 4) . '-' . substr($hex, 20, 12);
}

/** Run each statement from schema.sql (PDO often rejects multi-query). */
function db_ensure_schema(): void
{
    $sql = (string) file_get_contents(__DIR__ . '/schema.sql');
    if ($sql === '') {
        return;
    }
    $lines = explode("\n", $sql);
    $clean = [];
    foreach ($lines as $line) {
        if (str_starts_with(ltrim($line), '--')) {
            continue;
        }
        $clean[] = $line;
    }
    $pdo = db();
    foreach (explode(';', implode("\n", $clean)) as $stmt) {
        $stmt = trim($stmt);
        if ($stmt !== '') {
            $pdo->exec($stmt);
        }
    }
}

function guide_from_row(array $row, bool $public = false): array
{
    $item = [
        'id' => (string) $row['id'],
        'full_name' => (string) ($row['full_name'] ?? ''),
        'location' => (string) ($row['location'] ?? ''),
        'photo_url' => $row['photo_url'] ?? null,
        'has_vehicle' => (bool) ($row['has_vehicle'] ?? 0),
        'vehicle_type' => $row['vehicle_type'] ?? null,
        'languages' => json_col($row['languages'] ?? []),
        'specialties' => json_col($row['specialties'] ?? []),
        'experience' => (string) ($row['experience'] ?? ''),
        'bio' => (string) ($row['bio'] ?? ''),
        'intro_video_url' => $row['intro_video_url'] ?? null,
        'price_per_day' => isset($row['price_per_day']) && $row['price_per_day'] !== null
            ? (float) $row['price_per_day']
            : null,
        'rating' => isset($row['rating']) ? (float) $row['rating'] : 5.0,
        'reviews_count' => (int) ($row['reviews_count'] ?? 0),
        'status' => (string) ($row['status'] ?? 'pending'),
        'created_at' => $row['created_at'] ?? null,
        'updated_at' => $row['updated_at'] ?? null,
    ];

    if (!$public) {
        $item['email'] = (string) ($row['email'] ?? '');
        $item['phone'] = (string) ($row['phone'] ?? '');
        $item['id_document_url'] = $row['id_document_url'] ?? null;
        $item['vehicle_plate'] = $row['vehicle_plate'] ?? null;
        $item['vehicle_photo_url'] = $row['vehicle_photo_url'] ?? null;
        $item['insurance_document_url'] = $row['insurance_document_url'] ?? null;
        $item['admin_notes'] = $row['admin_notes'] ?? null;
    }

    return $item;
}

/** @return list<array> */
function guides_load(?string $status = null, bool $public = false): array
{
    if ($status !== null && $status !== '' && $status !== 'all') {
        $stmt = db()->prepare('SELECT * FROM guides WHERE status = ? ORDER BY created_at DESC');
        $stmt->execute([$status]);
    } else {
        $stmt = db()->query('SELECT * FROM guides ORDER BY created_at DESC');
    }
    $rows = $stmt->fetchAll();
    return array_map(static fn(array $row) => guide_from_row($row, $public), $rows);
}

function guides_find(string $id, bool $public = false): ?array
{
    $stmt = db()->prepare('SELECT * FROM guides WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    return $row ? guide_from_row($row, $public) : null;
}

function guides_counts(): array
{
    $pdo = db();
    $all = (int) $pdo->query('SELECT COUNT(*) FROM guides')->fetchColumn();
    $pending = (int) $pdo->query("SELECT COUNT(*) FROM guides WHERE status = 'pending'")->fetchColumn();
    $approved = (int) $pdo->query("SELECT COUNT(*) FROM guides WHERE status = 'approved'")->fetchColumn();
    $rejected = (int) $pdo->query("SELECT COUNT(*) FROM guides WHERE status = 'rejected'")->fetchColumn();
    return [
        'all' => $all,
        'pending' => $pending,
        'approved' => $approved,
        'rejected' => $rejected,
    ];
}

function guide_bind(array $item): array
{
    return [
        ':id' => $item['id'],
        ':full_name' => $item['full_name'],
        ':email' => $item['email'],
        ':phone' => $item['phone'],
        ':location' => $item['location'],
        ':photo_url' => $item['photo_url'],
        ':id_document_url' => $item['id_document_url'],
        ':has_vehicle' => !empty($item['has_vehicle']) ? 1 : 0,
        ':vehicle_type' => $item['vehicle_type'],
        ':vehicle_plate' => $item['vehicle_plate'],
        ':vehicle_photo_url' => $item['vehicle_photo_url'],
        ':insurance_document_url' => $item['insurance_document_url'],
        ':languages' => json_encode($item['languages'] ?? [], JSON_UNESCAPED_UNICODE),
        ':specialties' => json_encode($item['specialties'] ?? [], JSON_UNESCAPED_UNICODE),
        ':experience' => $item['experience'],
        ':bio' => $item['bio'],
        ':intro_video_url' => $item['intro_video_url'],
        ':price_per_day' => $item['price_per_day'],
        ':rating' => $item['rating'],
        ':reviews_count' => $item['reviews_count'],
        ':status' => $item['status'],
        ':admin_notes' => $item['admin_notes'],
        ':created_at' => $item['created_at'],
        ':updated_at' => $item['updated_at'],
    ];
}

function guides_insert(array $item): array
{
    $sql = 'INSERT INTO guides (
        id, full_name, email, phone, location, photo_url, id_document_url,
        has_vehicle, vehicle_type, vehicle_plate, vehicle_photo_url, insurance_document_url,
        languages, specialties, experience, bio, intro_video_url,
        price_per_day, rating, reviews_count, status, admin_notes, created_at, updated_at
    ) VALUES (
        :id, :full_name, :email, :phone, :location, :photo_url, :id_document_url,
        :has_vehicle, :vehicle_type, :vehicle_plate, :vehicle_photo_url, :insurance_document_url,
        :languages, :specialties, :experience, :bio, :intro_video_url,
        :price_per_day, :rating, :reviews_count, :status, :admin_notes, :created_at, :updated_at
    )';
    db()->prepare($sql)->execute(guide_bind($item));
    return $item;
}

function guides_update(array $item): array
{
    $sql = 'UPDATE guides SET
        full_name = :full_name,
        email = :email,
        phone = :phone,
        location = :location,
        photo_url = :photo_url,
        id_document_url = :id_document_url,
        has_vehicle = :has_vehicle,
        vehicle_type = :vehicle_type,
        vehicle_plate = :vehicle_plate,
        vehicle_photo_url = :vehicle_photo_url,
        insurance_document_url = :insurance_document_url,
        languages = :languages,
        specialties = :specialties,
        experience = :experience,
        bio = :bio,
        intro_video_url = :intro_video_url,
        price_per_day = :price_per_day,
        rating = :rating,
        reviews_count = :reviews_count,
        status = :status,
        admin_notes = :admin_notes,
        updated_at = :updated_at
      WHERE id = :id';
    $bind = guide_bind($item);
    unset($bind[':created_at']);
    db()->prepare($sql)->execute($bind);
    return $item;
}

function guides_set_status(string $id, string $status, ?string $adminNotes = null, ?float $pricePerDay = null): ?array
{
    $current = guides_find($id);
    if ($current === null) {
        return null;
    }
    $allowed = ['pending', 'approved', 'rejected'];
    if (!in_array($status, $allowed, true)) {
        throw new InvalidArgumentException('Invalid status');
    }
    $current['status'] = $status;
    if ($adminNotes !== null) {
        $current['admin_notes'] = $adminNotes;
    }
    if ($pricePerDay !== null) {
        $current['price_per_day'] = $pricePerDay;
    }
    $current['updated_at'] = gmdate('c');
    guides_update($current);
    return guides_find($id);
}

function guides_delete(string $id): bool
{
    $stmt = db()->prepare('DELETE FROM guides WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->rowCount() > 0;
}

function guide_normalize(array $input, ?array $existing = null): array
{
    $base = $existing ?? [];

    $languages = $input['languages'] ?? ($base['languages'] ?? []);
    if (is_string($languages)) {
        $languages = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n|,/', $languages) ?: [])));
    }
    if (!is_array($languages)) {
        $languages = [];
    }

    $specialties = $input['specialties'] ?? ($base['specialties'] ?? []);
    if (is_string($specialties)) {
        $specialties = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n|,/', $specialties) ?: [])));
    }
    if (!is_array($specialties)) {
        $specialties = [];
    }

    $id = (string) ($input['id'] ?? ($base['id'] ?? ''));
    if ($id === '') {
        $id = api_new_id();
    }

    $now = gmdate('c');
    $hasVehicle = $input['has_vehicle'] ?? ($base['has_vehicle'] ?? false);
    if (is_string($hasVehicle)) {
        $hasVehicle = in_array(strtolower($hasVehicle), ['1', 'true', 'yes', 'on'], true);
    }

    $status = (string) ($input['status'] ?? ($base['status'] ?? 'pending'));
    if (!in_array($status, ['pending', 'approved', 'rejected'], true)) {
        $status = 'pending';
    }

    $price = $input['price_per_day'] ?? ($base['price_per_day'] ?? null);
    if ($price === '' || $price === null) {
        $price = null;
    } else {
        $price = (float) $price;
    }

    $nullableUrl = static function (mixed $v): ?string {
        if ($v === null) {
            return null;
        }
        $s = trim((string) $v);
        return $s === '' ? null : $s;
    };

    return [
        'id' => $id,
        'full_name' => trim((string) ($input['full_name'] ?? ($base['full_name'] ?? ''))),
        'email' => trim((string) ($input['email'] ?? ($base['email'] ?? ''))),
        'phone' => trim((string) ($input['phone'] ?? ($base['phone'] ?? ''))),
        'location' => trim((string) ($input['location'] ?? ($base['location'] ?? ''))),
        'photo_url' => $nullableUrl($input['photo_url'] ?? ($base['photo_url'] ?? null)),
        'id_document_url' => $nullableUrl($input['id_document_url'] ?? ($base['id_document_url'] ?? null)),
        'has_vehicle' => (bool) $hasVehicle,
        'vehicle_type' => $hasVehicle
            ? $nullableUrl($input['vehicle_type'] ?? ($base['vehicle_type'] ?? null))
            : null,
        'vehicle_plate' => $hasVehicle
            ? $nullableUrl($input['vehicle_plate'] ?? ($base['vehicle_plate'] ?? null))
            : null,
        'vehicle_photo_url' => $nullableUrl($input['vehicle_photo_url'] ?? ($base['vehicle_photo_url'] ?? null)),
        'insurance_document_url' => $nullableUrl($input['insurance_document_url'] ?? ($base['insurance_document_url'] ?? null)),
        'languages' => array_values($languages),
        'specialties' => array_values($specialties),
        'experience' => trim((string) ($input['experience'] ?? ($base['experience'] ?? ''))),
        'bio' => trim((string) ($input['bio'] ?? ($base['bio'] ?? ''))),
        'intro_video_url' => $nullableUrl($input['intro_video_url'] ?? ($base['intro_video_url'] ?? null)),
        'price_per_day' => $price,
        'rating' => isset($input['rating']) ? (float) $input['rating'] : (isset($base['rating']) ? (float) $base['rating'] : 5.0),
        'reviews_count' => isset($input['reviews_count']) ? (int) $input['reviews_count'] : (int) ($base['reviews_count'] ?? 0),
        'status' => $status,
        'admin_notes' => isset($input['admin_notes'])
            ? (($input['admin_notes'] === '' || $input['admin_notes'] === null) ? null : (string) $input['admin_notes'])
            : ($base['admin_notes'] ?? null),
        'created_at' => $base['created_at'] ?? ($input['created_at'] ?? $now),
        'updated_at' => $now,
    ];
}

/**
 * Save an uploaded file under public/uploads/guides/{folder}/.
 * @return string|null public URL path like /uploads/guides/photos/xxx.jpg
 */
function guide_store_upload(array $file, string $folder): ?string
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Upload failed for ' . $folder);
    }
    if (($file['size'] ?? 0) > 20 * 1024 * 1024) {
        throw new RuntimeException('File too large');
    }

    $allowed = ['photos', 'ids', 'vehicles', 'insurance', 'videos'];
    if (!in_array($folder, $allowed, true)) {
        throw new RuntimeException('Invalid upload folder');
    }

    $ext = strtolower(pathinfo((string) ($file['name'] ?? ''), PATHINFO_EXTENSION));
    $safeExt = preg_replace('/[^a-z0-9]/', '', $ext) ?: 'bin';
    $name = api_new_id() . '.' . $safeExt;

    $dir = dirname(__DIR__) . '/uploads/guides/' . $folder;
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        throw new RuntimeException('Cannot create upload directory');
    }

    $dest = $dir . '/' . $name;
    if (!move_uploaded_file((string) $file['tmp_name'], $dest)) {
        throw new RuntimeException('Could not store upload');
    }

    return '/uploads/guides/' . $folder . '/' . $name;
}

/** Parse product price string → ['amount'=>float,'currency'=>'USD'|'EUR'|'CNY']|null */
function parse_price_string(?string $price): ?array
{
    if ($price === null || trim($price) === '') {
        return null;
    }
    $currency = 'USD';
    if (preg_match('/¥|CNY|RMB/i', $price)) {
        $currency = 'CNY';
    } elseif (preg_match('/€|EUR/i', $price)) {
        $currency = 'EUR';
    }
    $normalized = str_replace(',', '', $price);
    if (!preg_match('/(\d+(?:\.\d+)?)/', $normalized, $m)) {
        return null;
    }
    return [
        'amount' => round((float) $m[1], 2),
        'currency' => $currency,
    ];
}

function deposit_amount_for_product(array $product): ?array
{
    $parsed = parse_price_string((string) ($product['price'] ?? ''));
    if ($parsed === null || $parsed['amount'] <= 0) {
        return null;
    }
    $config = api_config();
    $pct = (float) ($config['deposit_percent'] ?? 0.2);
    if ($pct <= 0) {
        $pct = 1.0;
    }
    if ($pct > 1) {
        $pct = $pct / 100.0;
    }
    $parsed['amount'] = round($parsed['amount'] * $pct, 2);
    return $parsed;
}

function payment_log(array $record): void
{
    $dir = __DIR__ . '/data';
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    $record['time'] = $record['time'] ?? gmdate('c');
    file_put_contents(
        $dir . '/payments.jsonl',
        json_encode($record, JSON_UNESCAPED_UNICODE) . "\n",
        FILE_APPEND | LOCK_EX
    );
}

function payment_notify_admin(string $title, string $body): void
{
    $config = api_config();
    $to = (string) ($config['to_email'] ?? '');
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        return;
    }
    $prefix = (string) ($config['subject_prefix'] ?? '[Lumichan]');
    api_send_mail($to, $prefix . ' ' . $title, $body);
}

function http_json_request(string $method, string $url, array $headers, $body = null, ?string $user = null, ?string $pass = null): array
{
    $ch = curl_init($url);
    $hdrs = $headers;
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => strtoupper($method),
        CURLOPT_TIMEOUT => 45,
    ];
    if ($user !== null) {
        $opts[CURLOPT_USERPWD] = $user . ':' . ($pass ?? '');
    }
    if ($body !== null) {
        if (is_array($body) || is_object($body)) {
            $payload = json_encode($body, JSON_UNESCAPED_UNICODE);
            $hdrs[] = 'Content-Type: application/json';
        } else {
            $payload = (string) $body;
        }
        $opts[CURLOPT_POSTFIELDS] = $payload;
    }
    $opts[CURLOPT_HTTPHEADER] = $hdrs;
    curl_setopt_array($ch, $opts);
    $raw = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($raw === false) {
        throw new RuntimeException('HTTP request failed: ' . $err);
    }
    $json = json_decode($raw, true);
    return [
        'code' => $code,
        'json' => is_array($json) ? $json : null,
        'raw' => $raw,
    ];
}

function paypal_base_url(): string
{
    $config = api_config();
    $mode = strtolower((string) ($config['paypal_mode'] ?? 'sandbox'));
    return $mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

function paypal_configured(): bool
{
    $c = api_config();
    return trim((string) ($c['paypal_client_id'] ?? '')) !== ''
        && trim((string) ($c['paypal_secret'] ?? '')) !== '';
}

function paypal_access_token(): string
{
    $c = api_config();
    $client = trim((string) ($c['paypal_client_id'] ?? ''));
    $secret = trim((string) ($c['paypal_secret'] ?? ''));
    if ($client === '' || $secret === '') {
        throw new RuntimeException('PayPal not configured');
    }
    $ch = curl_init(paypal_base_url() . '/v1/oauth2/token');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_USERPWD => $client . ':' . $secret,
        CURLOPT_POSTFIELDS => 'grant_type=client_credentials',
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Content-Type: application/x-www-form-urlencoded',
        ],
        CURLOPT_TIMEOUT => 45,
    ]);
    $raw = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $json = json_decode((string) $raw, true);
    if ($code < 200 || $code >= 300 || empty($json['access_token'])) {
        throw new RuntimeException('PayPal auth failed');
    }
    return (string) $json['access_token'];
}

function paypal_api(string $method, string $path, ?array $body = null): array
{
    $token = paypal_access_token();
    $res = http_json_request(
        $method,
        paypal_base_url() . $path,
        [
            'Authorization: Bearer ' . $token,
            'Content-Type: application/json',
        ],
        $body
    );
    if ($res['code'] < 200 || $res['code'] >= 300) {
        $msg = $res['json']['message'] ?? $res['json']['error_description'] ?? ('PayPal API ' . $res['code']);
        throw new RuntimeException(is_string($msg) ? $msg : 'PayPal API error');
    }
    return $res['json'] ?? [];
}

function stripe_configured(): bool
{
    $c = api_config();
    return trim((string) ($c['stripe_secret_key'] ?? '')) !== '';
}

function stripe_api(string $method, string $path, array $formFields = []): array
{
    $c = api_config();
    $secret = trim((string) ($c['stripe_secret_key'] ?? ''));
    if ($secret === '') {
        throw new RuntimeException('Stripe not configured');
    }
    $ch = curl_init('https://api.stripe.com/v1' . $path);
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => strtoupper($method),
        CURLOPT_USERPWD => $secret . ':',
        CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
        CURLOPT_TIMEOUT => 45,
    ];
    if ($formFields !== []) {
        $opts[CURLOPT_POSTFIELDS] = http_build_query($formFields);
    }
    curl_setopt_array($ch, $opts);
    $raw = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $json = json_decode((string) $raw, true);
    if ($code < 200 || $code >= 300 || !is_array($json)) {
        $msg = is_array($json) ? ($json['error']['message'] ?? 'Stripe API error') : 'Stripe API error';
        throw new RuntimeException((string) $msg);
    }
    return $json;
}
