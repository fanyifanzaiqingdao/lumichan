<?php
declare(strict_types=1);

function services_page_load(): array
{
    $file = __DIR__ . '/data/services-page.live.json';
    if (!is_file($file)) $file = __DIR__ . '/data/services-page.json';
    $page = json_decode((string) file_get_contents($file), true);
    if (!is_array($page)) throw new RuntimeException('Invalid services page configuration');
    return $page;
}
function services_page_media_error(mixed $media): ?string
{
    if (!is_array($media)) return 'Image must be an object';
    $src = $media['src'] ?? '';
    if (!is_string($src) || ($src !== '' && !preg_match('~^(?:/(?!/)(?!.*\.\.)[^\\\\\s]+|https://[^\s]+)$~', $src))) return 'Invalid image URL';
    foreach (['published', 'authorized', 'aiGenerated'] as $key) if (!is_bool($media[$key] ?? null)) return 'Image flags must be booleans';
    foreach (['alt', 'focalPoint', 'licenseRecord'] as $key) if (!is_string($media[$key] ?? null) || strlen($media[$key]) > 3000) return 'Invalid image metadata';
    if ($src && $media['published'] && trim($media['alt']) === '') return 'Published images require alt text';
    if (!preg_match('/^(?:100|\d{1,2})% (?:100|\d{1,2})%$/', $media['focalPoint'])) return 'Image focal point must use percentages, for example 50% 50%';
    if ($media['authorized'] && trim($media['licenseRecord']) === '') return 'Authorized images require a permission or license record';
    return null;
}
function services_page_review_approved(array $review): bool
{
    return ($review['status'] ?? '') === 'published' && ($review['verified'] ?? false) === true && ($review['aiSample'] ?? false) === false
        && trim($review['text'] ?? '') !== '' && trim($review['source'] ?? '') !== '' && trim($review['permission'] ?? '') !== ''
        && (empty($review['image']['src']) || (($review['image']['authorized'] ?? false) === true && ($review['image']['aiGenerated'] ?? true) === false && trim($review['image']['licenseRecord'] ?? '') !== ''));
}
function services_page_validate(array $page): ?string
{
    if (($page['schemaVersion'] ?? null) !== 1) return 'Unsupported services page version';
    foreach (['modules', 'services', 'gallery', 'reviews'] as $key) if (!isset($page[$key]) || !is_array($page[$key]) || !array_is_list($page[$key]) || count($page[$key]) > 50) return 'Invalid ' . $key;
    if (count($page['modules']) !== 8 || count($page['services']) !== 3) return 'Keep all eight modules and three service records; use visibility to hide them';
    $moduleIds = ['hero','why','services','pricing','vehicles','idea','reviews','final'];
    $serviceIds = ['planning','road-trip','signature'];
    foreach (['modules' => $moduleIds, 'services' => $serviceIds] as $collection => $allowed) {
        $seen = [];
        foreach ($page[$collection] as $item) {
            if (!is_array($item) || !in_array($item['id'] ?? null, $allowed, true) || in_array($item['id'], $seen, true)) return 'Invalid or duplicate ' . $collection . ' ID';
            $seen[] = $item['id'];
            if (!is_int($item['order'] ?? null) || $item['order'] < 0 || $item['order'] > 100 || !is_bool($item['visible'] ?? null)) return 'Invalid order or visibility';
        }
    }
    $walk = function (mixed $value, string $key = '') use (&$walk): ?string {
        if (is_string($value)) {
            if (strlen($value) > 12000 || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', $value)) return 'Text too long or contains control characters';
            if (in_array($key, ['ctaUrl','primaryUrl','secondaryUrl'], true) && !preg_match('~^/traveler(?:[/?#]|$)[^\s\\\\]*$~', $value)) return 'CTA URLs must point to a local /traveler page';
            return null;
        }
        if (is_array($value)) {
            if (count($value) > 100) return 'Too many content fields';
            foreach ($value as $childKey => $child) if (($error = $walk($child, (string) $childKey)) !== null) return $error;
            return null;
        }
        return is_bool($value) || is_int($value) || is_float($value) || $value === null ? null : 'Invalid content type';
    };
    if (($error = $walk($page)) !== null) return $error;
    foreach ($page['modules'] as $module) {
        foreach (['title','eyebrow','body','ctaLabel','ctaUrl'] as $key) if (!is_string($module[$key] ?? null)) return 'Module text fields must be strings';
        if (in_array($module['id'], ['hero','idea'], true) && ($error = services_page_media_error($module['image'] ?? null)) !== null) return $error;
        if (in_array($module['id'], ['why','pricing','idea'], true)) {
            $count = $module['id'] === 'idea' ? 3 : 4;
            if (!is_array($module['items'] ?? null) || count($module['items']) !== $count) return 'Incorrect module item count';
            foreach ($module['items'] as $item) if (!is_array($item) || !is_string($item['title'] ?? null) || !is_string($item['body'] ?? null)) return 'Invalid module item';
        }
        if ($module['id'] === 'vehicles' && (!is_array($module['points'] ?? null) || count($module['points']) !== 4 || count(array_filter($module['points'], 'is_string')) !== 4)) return 'Vehicles require four text points';
        $required = match ($module['id']) { 'hero','services','vehicles' => ['note'], 'pricing' => ['stripTitle','stripBody'], 'reviews' => ['note','emptyText'], 'final' => ['primaryLabel','primaryUrl','secondaryLabel','secondaryUrl'], default => [] };
        foreach ($required as $key) if (!is_string($module[$key] ?? null)) return 'Missing module field: ' . $key;
    }
    $anchors = ['planning'=>'planning-support','road-trip'=>'private-road-trip','signature'=>'signature-private-journey'];
    foreach ($page['services'] as $service) {
        if (($service['anchor'] ?? null) !== $anchors[$service['id']]) return 'Service anchors are fixed to preserve existing links';
        foreach (['title','subtitle','bestFor','ctaLabel','ctaUrl'] as $key) if (!is_string($service[$key] ?? null)) return 'Invalid service text';
        foreach (['points','included'] as $key) if (!is_array($service[$key] ?? null) || !array_is_list($service[$key]) || count($service[$key]) > 25 || count(array_filter($service[$key], 'is_string')) !== count($service[$key])) return 'Invalid service list';
        if (($error = services_page_media_error($service['image'] ?? null)) !== null) return $error;
    }
    foreach ($page['gallery'] as $image) if (($error = services_page_media_error($image)) !== null) return $error;
    foreach ($page['reviews'] as $review) {
        if (!is_array($review) || ($review['aiSample'] ?? false) !== false) return 'AI review examples cannot be stored as customer reviews';
        foreach (['text','source','permission','displayName','status'] as $key) if (!is_string($review[$key] ?? null)) return 'Invalid review field';
        if (!is_bool($review['verified'] ?? null) || !in_array($review['status'], ['draft','published'], true)) return 'Invalid review status';
        if (($error = services_page_media_error($review['image'] ?? null)) !== null) return $error;
        if ($review['status'] === 'published' && !services_page_review_approved($review)) return 'Published reviews require a verified source, permission record and authorized non-AI photo';
    }
    return null;
}
function services_page_public(array $page): array
{
    $page['reviews'] = array_values(array_map(static function ($review) {
        return ['text' => $review['text'], 'displayName' => $review['displayName'], 'image' => $review['image'], 'status' => 'published', 'verified' => true, 'aiSample' => false,
            // Do not disclose private consent records or source details to visitors.
            'source' => 'verified', 'permission' => 'verified'];
    }, array_filter($page['reviews'] ?? [], 'services_page_review_approved')));
    $redact = function (array &$node) use (&$redact): void {
        if (isset($node['licenseRecord'])) $node['licenseRecord'] = $node['licenseRecord'] !== '' ? 'verified' : '';
        foreach ($node as &$value) if (is_array($value)) $redact($value);
    };
    $redact($page);
    return $page;
}
