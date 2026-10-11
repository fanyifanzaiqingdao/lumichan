<?php
require __DIR__ . '/_lib.php';

api_cors_and_method(['POST']);
admin_require();

$file = $_FILES['image'] ?? null;
if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    api_json(400, ['ok' => false, 'error' => 'Please choose an image']);
}
if (($file['size'] ?? 0) < 1 || $file['size'] > 5 * 1024 * 1024) {
    api_json(400, ['ok' => false, 'error' => 'Image must be under 5 MB']);
}
$mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
$extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
$dimensions = getimagesize($file['tmp_name']);
if (!isset($extensions[$mime]) || !$dimensions || $dimensions[0] > 8000 || $dimensions[1] > 8000) {
    api_json(400, ['ok' => false, 'error' => 'Only JPEG, PNG or WebP images are allowed']);
}
$directory = dirname(__DIR__) . '/uploads/homepage';
if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
    api_json(500, ['ok' => false, 'error' => 'Upload directory is not writable']);
}
$name = bin2hex(random_bytes(16)) . '.' . $extensions[$mime];
$destination = $directory . '/' . $name;
if (!move_uploaded_file($file['tmp_name'], $destination)) {
    api_json(500, ['ok' => false, 'error' => 'Could not save image']);
}
chmod($destination, 0644);
api_json(200, ['ok' => true, 'path' => '/uploads/homepage/' . $name]);
