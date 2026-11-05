<?php
/**
 * Become a Guide — same flow as original site:
 * upload files -> insert guides row with status=pending
 */
require __DIR__ . '/_lib.php';

api_cors_and_method(['POST']);

$config = api_config();
$toEmail = (string) ($config['to_email'] ?? '');
$subjectPrefix = (string) ($config['subject_prefix'] ?? '[Lumichan]');
$sendMail = (bool) ($config['send_mail'] ?? true);

$fullName = trim((string) ($_POST['fullName'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$phone = trim((string) ($_POST['phone'] ?? ''));
$location = trim((string) ($_POST['location'] ?? ''));
$hasVehicle = ($_POST['hasVehicle'] ?? '0') === '1';
$vehicleType = trim((string) ($_POST['vehicleType'] ?? ''));
$vehiclePlate = trim((string) ($_POST['vehiclePlate'] ?? ''));
$experience = trim((string) ($_POST['experience'] ?? ''));
$bio = trim((string) ($_POST['bio'] ?? ''));
$languages = decode_post_list($_POST['languages'] ?? '[]');
$specialties = decode_post_list($_POST['specialties'] ?? '[]');

if ($fullName === '' || $email === '' || $phone === '' || $location === '' || $bio === '') {
    api_json(400, ['ok' => false, 'error' => 'Missing required fields']);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    api_json(400, ['ok' => false, 'error' => 'Invalid email']);
}
if ($languages === [] || $specialties === []) {
    api_json(400, ['ok' => false, 'error' => 'Languages and specialties are required']);
}
if ($hasVehicle && ($vehicleType === '' || $vehiclePlate === '')) {
    api_json(400, ['ok' => false, 'error' => 'Vehicle details required']);
}

try {
    db_ensure_schema();

    $photoUrl = isset($_FILES['photo']) ? guide_store_upload($_FILES['photo'], 'photos') : null;
    $idDocUrl = isset($_FILES['idDocument']) ? guide_store_upload($_FILES['idDocument'], 'ids') : null;
    $vehiclePhotoUrl = isset($_FILES['vehiclePhoto']) ? guide_store_upload($_FILES['vehiclePhoto'], 'vehicles') : null;
    $insuranceUrl = isset($_FILES['insuranceDocument']) ? guide_store_upload($_FILES['insuranceDocument'], 'insurance') : null;
    $videoUrl = isset($_FILES['introVideo']) ? guide_store_upload($_FILES['introVideo'], 'videos') : null;

    $item = guide_normalize([
        'full_name' => $fullName,
        'email' => $email,
        'phone' => $phone,
        'location' => $location,
        'photo_url' => $photoUrl,
        'id_document_url' => $idDocUrl,
        'has_vehicle' => $hasVehicle,
        'vehicle_type' => $hasVehicle ? $vehicleType : null,
        'vehicle_plate' => $hasVehicle ? $vehiclePlate : null,
        'vehicle_photo_url' => $vehiclePhotoUrl,
        'insurance_document_url' => $insuranceUrl,
        'languages' => $languages,
        'specialties' => $specialties,
        'experience' => $experience,
        'bio' => $bio,
        'intro_video_url' => $videoUrl,
        'status' => 'pending',
        'rating' => 5.0,
        'reviews_count' => 0,
    ]);

    guides_insert($item);
} catch (Throwable $e) {
    api_json(500, ['ok' => false, 'error' => $e->getMessage() ?: 'Failed to save application']);
}

$mailOk = true;
if ($sendMail && filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
    $subject = $subjectPrefix . ' Guide application from ' . $fullName;
    $body = "Name: {$fullName}\nEmail: {$email}\nPhone: {$phone}\nLocation: {$location}\n"
        . 'Languages: ' . implode(', ', $languages) . "\n"
        . 'Specialties: ' . implode(', ', $specialties) . "\n"
        . "Experience: {$experience}\n"
        . 'Vehicle: ' . ($hasVehicle ? "{$vehicleType} / {$vehiclePlate}" : 'none') . "\n"
        . "Status: pending (review in /admin)\n\n"
        . "Bio:\n{$bio}\n";
    $mailOk = api_send_mail($toEmail, $subject, $body, $email);
}

api_json(200, ['ok' => true, 'mail' => $mailOk, 'id' => $item['id']]);

function decode_post_list(mixed $raw): array
{
    if (is_array($raw)) {
        return array_values(array_filter(array_map('strval', $raw)));
    }
    $decoded = json_decode((string) $raw, true);
    if (!is_array($decoded)) {
        return [];
    }
    return array_values(array_filter(array_map('strval', $decoded)));
}
