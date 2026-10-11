<?php
declare(strict_types=1);

function homepage_is_placeholder(mixed $value): bool
{
    return is_string($value) && (bool) preg_match('/\[PRICE\]|\[GROUP SIZE\]|\[N\]|TEST PLACEHOLDER|CONTENT PLACEHOLDER|RMB\s*[—-]\s*\//i', $value);
}

function homepage_valid_media(mixed $value): bool
{
    if (!is_string($value) || $value === '' || preg_match('/[\r\n]/', $value)) return false;
    if (str_starts_with($value, '/')) return !str_starts_with($value, '//') && !str_contains($value, '..');
    return (bool) filter_var($value, FILTER_VALIDATE_URL) && str_starts_with($value, 'https://');
}

function homepage_public(array $homepage): array
{
    foreach ($homepage['services'] ?? [] as $index => $service) {
        if (empty($service['bookingApproved']) || empty($homepage['bookingPolicyVersion'])) {
            $homepage['services'][$index]['booking'] = 'Changes and cancellation terms are confirmed before booking.';
        }
    }
    foreach ($homepage['journeys'] ?? [] as $index => $journey) {
        if (empty($journey['priceApproved']) || homepage_is_placeholder($journey['price'] ?? null) || homepage_is_placeholder($journey['groupBasis'] ?? null)) {
            $homepage['journeys'][$index]['price'] = null;
            $homepage['journeys'][$index]['groupBasis'] = null;
            $homepage['journeys'][$index]['priceApproved'] = false;
        }
        if (empty($journey['detailsApproved'])) unset($homepage['journeys'][$index]['details']);
    }
    $homepage['vlogs'] = array_values(array_filter($homepage['vlogs'] ?? [], static fn($item) =>
        !empty($item['published']) && !empty($item['cover']) && !empty($item['video']) &&
        !empty($item['subtitle']) && !empty($item['caption']) && !empty($item['alt']) && !empty($item['consentRecord'])
    ));
    $homepage['reviews'] = array_values(array_filter($homepage['reviews'] ?? [], static fn($item) =>
        !empty($item['published']) && !empty($item['quote']) && !empty($item['identity']) &&
        !empty($item['tripType']) && !empty($item['tripDate']) &&
        !empty($item['sourceRecord']) && !empty($item['consentRecord']) &&
        (empty($item['photo']) || !empty($item['photoAlt']))
    ));
    return $homepage;
}

function homepage_validate(array $homepage): ?string
{
    foreach (['hero' => null, 'services' => 4, 'journeys' => 3, 'whyItems' => 4, 'steps' => 6, 'faqs' => 8] as $key => $count) {
        if (!isset($homepage[$key]) || !is_array($homepage[$key]) || ($count !== null && count($homepage[$key]) !== $count)) {
            return "Invalid {$key} structure";
        }
    }
    $hero = $homepage['hero'];
    foreach (['eyebrow', 'title', 'subtitle', 'image'] as $key) {
        if (empty($hero[$key]) || !is_string($hero[$key]) || mb_strlen($hero[$key]) > 500) return "Invalid hero {$key}";
    }
    if (!homepage_valid_media($hero['image'])) return 'Invalid hero image';
    if (empty($hero['primaryCta']['label']) || !in_array($hero['primaryCta']['href'] ?? '', ['#inquiry', '/traveler#inquiry'], true)) return 'Invalid primary CTA';
    if (empty($hero['secondaryCta']['label']) || ($hero['secondaryCta']['href'] ?? '') !== '/traveler/services') return 'Invalid secondary CTA';
    if (!is_array($hero['trustPoints'] ?? null) || count($hero['trustPoints']) !== 4) return 'Hero needs four trust points';
    foreach ($hero['trustPoints'] as $point) if (!is_string($point) || trim($point) === '') return 'Invalid trust point';
    $copyFields = [
        'services' => ['eyebrow', 'title', 'intro'],
        'journeys' => ['eyebrow', 'title', 'intro'],
        'why' => ['eyebrow', 'title', 'intro'],
        'process' => ['eyebrow', 'title', 'intro'],
        'faq' => ['eyebrow', 'title'],
        'inquiry' => ['eyebrow', 'title', 'intro', 'reassurance'],
    ];
    foreach ($copyFields as $section => $fields) {
        foreach ($fields as $field) {
            $value = $homepage['copy'][$section][$field] ?? null;
            if (!is_string($value) || trim($value) === '' || mb_strlen($value) > 500) return "Invalid {$section} {$field}";
        }
    }
    foreach (['consentVersion', 'submitLabel', 'successTitle', 'successBody', 'errorMessage'] as $field) {
        $value = $homepage['formConfig'][$field] ?? null;
        if (!is_string($value) || trim($value) === '' || mb_strlen($value) > 500) return "Invalid form {$field}";
    }
    if (empty($homepage['seo']['title']) || mb_strlen($homepage['seo']['title']) > 80 || empty($homepage['seo']['description']) || mb_strlen($homepage['seo']['description']) > 180) return 'Invalid SEO fields';
    if (!homepage_valid_media($homepage['whyImage'] ?? null) || empty($homepage['whyImageAlt'])) return 'Why image and alt are required';
    $ids = ['planning', 'road-trip', 'signature', 'education'];
    foreach ($homepage['services'] as $index => $service) {
        if (($service['id'] ?? '') !== $ids[$index] || empty($service['title']) || empty($service['summary']) || empty($service['price'])) return 'Invalid service order or fields';
        $anchor = ['planning-support', 'private-road-trip', 'signature-private-journey', 'educational-cultural-journeys'][$index];
        if (($service['href'] ?? '') !== '/traveler/services#' . $anchor) return 'Invalid service route';
        if (homepage_is_placeholder($service['price'])) return 'Service price cannot be a placeholder';
        if (!empty($service['image']) && (!homepage_valid_media($service['image']) || empty($service['imageAlt']))) return 'Service image and alt are required';
        if (!empty($service['bookingApproved']) && empty($homepage['bookingPolicyVersion'])) return 'Approved booking terms require a policy version';
    }
    $slugs = ['chengdu-cultural-gateway', 'western-sichuan-private-road-trip', 'deep-cultural-journey'];
    foreach ($homepage['journeys'] as $index => $journey) {
        if (($journey['slug'] ?? '') !== $slugs[$index] || empty($journey['title']) || empty($journey['duration']) || empty($journey['image'])) return 'Invalid journey order or fields';
        if (!homepage_valid_media($journey['image']) || empty($journey['imageAlt'])) return 'Journey image and alt are required';
        if (!empty($journey['priceApproved']) && (empty($journey['price']) || empty($journey['groupBasis']) || homepage_is_placeholder($journey['price']) || homepage_is_placeholder($journey['groupBasis']))) return 'Approved journey price and group basis are required';
        if (!empty($journey['detailsApproved'])) {
            $details = $journey['details'] ?? null;
            if (!is_array($details) || empty($details['highlights']) || !is_array($details['highlights']) || empty($details['idealFor']) || empty($details['note'])) return 'Approved journey details are incomplete';
            foreach ($details['gallery'] ?? [] as $image) {
                if (!homepage_valid_media($image['src'] ?? null) || empty($image['alt'])) return 'Journey gallery image and alt are required';
            }
        }
    }
    foreach ($homepage['steps'] as $index => $step) {
        if (!is_array($step) || count($step) < 4 || ($step[0] ?? '') !== str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT) || empty($step[1]) || empty($step[2]) || empty($step[3])) return 'Six numbered journey steps are required';
    }
    foreach ($homepage['whyItems'] as $item) {
        if (!is_array($item) || count($item) < 2 || empty($item[0]) || empty($item[1])) return 'Four complete Why items are required';
    }
    foreach ($homepage['faqs'] as $faq) {
        if (!is_array($faq) || count($faq) < 2 || empty($faq[0]) || empty($faq[1])) return 'Eight complete FAQs are required';
    }
    foreach (['vlogs' => ['title', 'cover', 'video', 'subtitle', 'caption', 'alt', 'consentRecord'], 'reviews' => ['quote', 'identity', 'tripType', 'tripDate', 'sourceRecord', 'consentRecord']] as $key => $required) {
        foreach ($homepage[$key] ?? [] as $item) {
            if (empty($item['published'])) continue;
            foreach ($required as $field) if (empty($item[$field])) return "Published {$key} need {$field}";
            if ($key === 'reviews' && !empty($item['photo']) && empty($item['photoAlt'])) return 'Review photo alt is required';
            foreach ($key === 'vlogs' ? ['cover', 'video', 'subtitle'] : ['photo'] as $mediaField) {
                if (!empty($item[$mediaField]) && !homepage_valid_media($item[$mediaField])) return "Invalid {$key} {$mediaField}";
            }
        }
    }
    return null;
}
