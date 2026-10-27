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
    $homepage = homepage_upgrade($homepage);
    foreach ($homepage['services'] ?? [] as $index => $service) {
        if (($service['media']['published'] ?? true) === false || homepage_service_media_error($service) !== null) {
            $homepage['services'][$index]['image'] = '';
            $homepage['services'][$index]['imageAlt'] = '';
            $homepage['services'][$index]['imageCaption'] = '';
            $homepage['services'][$index]['media'] = ['published' => false];
        }
        if (!homepage_policy_approved($service, $homepage['bookingPolicyVersion'] ?? '')) {
            $homepage['services'][$index]['booking'] = 'Changes and cancellation terms are confirmed before booking.';
            $homepage['services'][$index]['bookingApproved'] = false;
            unset($homepage['services'][$index]['bookingPolicy']);
        }
    }
    foreach ($homepage['journeys'] ?? [] as $index => $journey) {
        if (($journey['priceBadgeApproved'] ?? false) !== true || !preg_match('/^From USD [1-9][\d,]*(?:\.\d{2})?$/', $journey['priceBadge'] ?? '')) {
            $homepage['journeys'][$index]['priceBadge'] = '';
            $homepage['journeys'][$index]['priceBadgeApproved'] = false;
        }
        if (empty($journey['priceApproved']) || homepage_is_placeholder($journey['price'] ?? null) || homepage_is_placeholder($journey['groupBasis'] ?? null)) {
            $homepage['journeys'][$index]['price'] = null;
            $homepage['journeys'][$index]['groupBasis'] = null;
            $homepage['journeys'][$index]['priceApproved'] = false;
        }
        if (empty($journey['detailsApproved'])) unset($homepage['journeys'][$index]['details']);
    }
    if (($homepage['legalIdentity']['status'] ?? '') !== 'approved') unset($homepage['legalIdentity']);
    $homepage['vlogs'] = [];
    $homepage['reviews'] = array_values(array_filter($homepage['reviews'] ?? [], 'homepage_review_approved'));
    foreach ($homepage['reviews'] as &$review) foreach (['imageConsentRecord','reviewConsentRecord','reviewSource'] as $field) $review[$field] = 'verified';
    unset($review);
    return $homepage;
}

function homepage_service_media_error(array $service): ?string
{
    $media = $service['media'] ?? [];
    if (!is_array($media) || (array_key_exists('published', $media) && !is_bool($media['published']))) return 'Service image published must be a boolean';
    $image = $service['image'] ?? '';
    if ($image !== '' && !homepage_valid_media($image)) return 'Invalid service image';
    if (($media['published'] ?? true) === false) return null;
    if ($image === '' || !is_string($service['imageAlt'] ?? null) || trim($service['imageAlt']) === '') return 'Published service image and alt are required';
    static $seed = null;
    $seed ??= json_decode((string) file_get_contents(__DIR__ . '/data/homepage.json'), true);
    $original = null;
    foreach ($seed['services'] as $item) if ($item['id'] === ($service['id'] ?? '')) $original = $item['image'];
    if ($image !== $original) {
        foreach (['source', 'consentOrLicenseRecord'] as $field) {
            if (!is_string($media[$field] ?? null) || trim($media[$field]) === '') return 'Replacement service photos need source and license records before publishing';
        }
    }
    return null;
}

// Upgrade old saved content in memory; never overwrite the live file on a GET.
function homepage_upgrade(array $homepage): array
{
    $seed = json_decode((string) file_get_contents(__DIR__ . '/data/homepage.json'), true);
    if (($homepage['schemaVersion'] ?? 0) !== 3) {
        $seed = json_decode((string) file_get_contents(__DIR__ . '/data/homepage.json'), true);
        $homepage['services'] = array_map(static function ($service) use ($homepage) {
            foreach ($homepage['services'] ?? [] as $old) {
                if (($old['id'] ?? '') !== $service['id']) continue;
                foreach (['image', 'imageAlt', 'imageFocalPoint', 'media'] as $field) {
                    if (!empty($old[$field])) $service[$field] = $old[$field];
                }
            }
            return $service;
        }, $seed['services']);
        $homepage['bookingPolicyVersion'] = $seed['bookingPolicyVersion'];
        $homepage['schemaVersion'] = 3;
    }
    if (!isset($homepage['process']['steps'])) {
        $homepage['process']['steps'] = array_map(static fn($step) => [
            'order' => (int) $step[0], 'number' => $step[0], 'title' => $step[1],
            'body' => $step[2], 'reassurance' => $step[3],
        ], $homepage['steps'] ?? []);
    }
    $homepage['process']['videoEnabled'] = false;
    foreach ($homepage['services'] ?? [] as $i => $service) {
        if (($service['id'] ?? '') === 'planning' && in_array($service['priceNote'] ?? '', ['1–5 days: RMB 999 · 5–10 days: RMB 1,599', '1-5 days: RMB 999 · 5-10 days: RMB 1,599'], true)) {
            $homepage['services'][$i]['priceNote'] = '1–5 days: RMB 999 · 6–10 days: RMB 1,599';
        }
    }
    $homepage['process']['videos'] = [];
    $homepage['copy']['process']['eyebrow'] ??= $seed['copy']['process']['eyebrow'];
    $homepage['copy']['services']['disclaimer'] ??= $seed['copy']['services']['disclaimer'];
    if (($homepage['contentRevision'] ?? '') !== $seed['contentRevision']) {
        foreach ($homepage['services'] ?? [] as $index => $service) {
            foreach ($seed['services'] as $current) {
                if ($current['id'] !== ($service['id'] ?? '')) continue;
                $fields = ['price', 'unit', 'priceNote'];
                if ($service['id'] !== 'planning') $fields = array_merge($fields, ['image', 'imageAlt', 'imageFocalPoint', 'media']);
                foreach ($fields as $key) $homepage['services'][$index][$key] = $current[$key];
                if (isset($service['details'])) $homepage['services'][$index]['details']['priceDetail'] = $current['priceNote'];
            }
        }
        foreach ($homepage['journeys'] ?? [] as $index => $journey) {
            foreach ($seed['journeys'] as $current) {
                if ($current['slug'] !== ($journey['slug'] ?? '')) continue;
                foreach (['title', 'summary', 'tags', 'priceBadge', 'priceBadgeApproved'] as $key) $homepage['journeys'][$index][$key] = $current[$key];
            }
        }
        foreach ($homepage['faqs'] ?? [] as $index => $faq) {
            if ($faq[0] === $seed['faqs'][0][0]) $homepage['faqs'][$index] = $seed['faqs'][0];
        }
        $homepage['whyGallery'] = $seed['whyGallery'];
        $homepage['contentRevision'] = $seed['contentRevision'];
    }
    foreach ($homepage['services'] ?? [] as $i => $service) {
        if (in_array($service['id'] ?? '', ['road-trip','signature'], true) && ($service['unitApproved'] ?? false) !== true && ($service['unit'] ?? '') === '/ day / vehicle') {
            $homepage['services'][$i]['unit'] = 'Starting reference';
            $homepage['services'][$i]['unitApproved'] = false;
            $homepage['services'][$i]['priceNote'] = 'Final pricing basis confirmed in your written quote';
        }
    }
    foreach ($homepage['faqs'] ?? [] as $i => $faq) {
        if (($faq[0] ?? '') === $seed['faqs'][0][0] && str_contains($faq[1] ?? '', 'per day per vehicle')) $homepage['faqs'][$i] = $seed['faqs'][0];
    }
    if (($homepage['homepageLayoutRevision'] ?? '') !== ($seed['homepageLayoutRevision'] ?? '')) {
        $homepage['copy'] = array_replace($homepage['copy'] ?? [], $seed['copy']);
        $oldTitle = $homepage['hero']['title'] ?? '';
        $homepage['hero'] = array_replace($seed['hero'], $homepage['hero'] ?? []);
        if ($oldTitle === '' || $oldTitle === 'Explore China More Deeply. Travel With Confidence') $homepage['hero']['title'] = $seed['hero']['title'];
        foreach (['whyGallery','whyItems','storySequences','homepageLayoutRevision'] as $key) $homepage[$key] = $seed[$key];
        foreach ($homepage['services'] ?? [] as $i => $service) {
            foreach ($seed['services'] as $current) {
                if ($current['id'] !== ($service['id'] ?? '')) continue;
                foreach (['detailPageUrl','titleLinkEnabled','imageLinkEnabled'] as $key) $homepage['services'][$i][$key] = $current[$key];
                if (empty($service['image']) || str_starts_with($service['image'], '/images/home-revision2/')) {
                    foreach (['image','imageAlt','media'] as $key) $homepage['services'][$i][$key] = $current[$key];
                    if (($service['media']['published'] ?? true) === false) $homepage['services'][$i]['media']['published'] = false;
                }
            }
        }
        foreach ($homepage['journeys'] ?? [] as $i => $journey) $homepage['journeys'][$i]['showHomepagePrice'] = false;
        if (count($homepage['faqs'] ?? []) !== 5) $homepage['faqs'] = $seed['faqs'];
        foreach ($homepage['process']['steps'] ?? [] as $step) if (in_array($step['title'] ?? '', ['Inquiry','Booking','Before you travel'], true)) { $homepage['process']['steps'] = $seed['process']['steps']; break; }
    }
    $homepage['storySequences'] ??= $seed['storySequences'];
    $homepage['footer'] ??= $seed['footer'];
    $homepage['legalIdentity'] ??= $seed['legalIdentity'];
    return $homepage;
}

function homepage_policy_error(array $service, string $version): ?string
{
    $policy = $service['bookingPolicy'] ?? [];
    if (($policy['status'] ?? '') !== 'approved' || empty($version) || ($policy['version'] ?? '') !== $version) return 'Approved policy version must match homepage';
    foreach (['dateChange', 'confirmedBy', 'confirmedOn', 'sourceSha256', 'sourceDocument'] as $field) {
        if (!is_string($policy[$field] ?? null) || trim($policy[$field]) === '') return "Policy needs {$field}";
    }
    if (!preg_match('/^[a-f0-9]{64}$/', $policy['sourceSha256'])) return 'Invalid policy source hash';
    if (($policy['termsHref'] ?? '') !== '/traveler/booking-terms') return 'Invalid terms link';
    $counts = ['planning' => 3, 'road-trip' => 4, 'signature' => 4, 'education' => 5];
    if (!is_array($policy['refundSteps'] ?? null) || count($policy['refundSteps']) !== ($counts[$service['id']] ?? 0)) return 'Full refund schedule is required';
    if (($policy['homepageRefundSummary']['stepIndex'] ?? null) !== 0 || !preg_match('/^100%\*?$/', $policy['refundSteps'][0]['refund'] ?? '')) return 'Homepage must reference first 100% refund tier';
    foreach ($policy['refundSteps'] as $step) {
        if (!is_string($step['when'] ?? null) || trim($step['when']) === '' || !is_string($step['refund'] ?? null) || trim($step['refund']) === '') return 'Invalid refund tier';
    }
    if (!is_array($policy['footnotes'] ?? null) || count($policy['footnotes']) === 0) return 'Policy conditions cannot be removed';
    foreach ($policy['footnotes'] as $note) if (!is_string($note) || trim($note) === '') return 'Invalid policy condition';
    static $seed = null;
    $seed ??= json_decode((string) file_get_contents(__DIR__ . '/data/homepage.json'), true);
    if ($version === $seed['bookingPolicyVersion']) {
        foreach ($seed['services'] as $confirmed) {
            if ($confirmed['id'] !== $service['id']) continue;
            foreach (['refundSteps', 'dateChange', 'footnotes', 'sourceSha256'] as $field) {
                if ($policy[$field] !== $confirmed['bookingPolicy'][$field]) return 'Confirmed policy changed: a new approval and policy version are required';
            }
        }
    }
    return null;
}

function homepage_policy_approved(array $service, string $version): bool
{
    return ($service['bookingApproved'] ?? false) === true && homepage_policy_error($service, $version) === null;
}

function homepage_review_approved(array $item): bool
{
    if (($item['published'] ?? false) !== true || ($item['status'] ?? '') !== 'approved' || ($item['layoutOnly'] ?? false) === true || ($item['aiGenerated'] ?? false) === true) return false;
    foreach (['id', 'image', 'imageAlt', 'imageConsentRecord', 'quote', 'guestDisplayName', 'tripContext', 'reviewConsentRecord', 'reviewSource'] as $field) {
        if (!is_string($item[$field] ?? null) || trim($item[$field]) === '') return false;
    }
    return homepage_valid_media($item['image']) && !preg_match('/placeholder/i', $item['image']);
}

function homepage_validate(array $homepage): ?string
{
    if (($homepage['schemaVersion'] ?? null) !== 3) return 'Homepage schema version 3 is required';
    foreach (['hero' => null, 'services' => 4, 'journeys' => 3, 'whyItems' => 4, 'steps' => 6, 'faqs' => 5] as $key => $count) {
        if (!isset($homepage[$key]) || !is_array($homepage[$key]) || ($count !== null && count($homepage[$key]) !== $count)) {
            return "Invalid {$key} structure";
        }
    }
    if (isset($homepage['storySequences'])) {
        if (!is_array($homepage['storySequences']) || count($homepage['storySequences']) !== 3) return 'Exactly three story sequences are required';
        foreach ($homepage['storySequences'] as $story) {
            foreach (['title','description','id'] as $field) if (!is_string($story[$field] ?? null) || strlen($story[$field]) > 800) return 'Invalid story text';
            if (!is_bool($story['enabled'] ?? null) || !is_bool($story['aiGenerated'] ?? null) || !is_int($story['intervalMs'] ?? null) || $story['intervalMs'] < 2500 || $story['intervalMs'] > 15000) return 'Invalid story playback settings';
            if (!is_array($story['frames'] ?? null) || count($story['frames']) !== 4) return 'Each story needs four frames';
            foreach ($story['frames'] as $frame) if (!is_array($frame) || !homepage_valid_media($frame['src'] ?? null) || !is_string($frame['alt'] ?? null) || trim($frame['alt']) === '' || !is_bool($frame['aiGenerated'] ?? null)) return 'Invalid story frame';
        }
    }
    foreach ($homepage['services'] as $service) {
        if (isset($service['detailPageUrl']) && (!is_string($service['detailPageUrl']) || !preg_match('~^/traveler/services(?:#[a-z-]+)?$~', $service['detailPageUrl']))) return 'Invalid service detail link';
        foreach (['titleLinkEnabled','imageLinkEnabled'] as $flag) if (isset($service[$flag]) && !is_bool($service[$flag])) return 'Service link flags must be boolean';
        if (($service['id'] ?? '') === 'education' && (!empty($service['titleLinkEnabled']) || !empty($service['imageLinkEnabled']))) return 'Education title and image links remain disabled';
    }
    foreach ($homepage['journeys'] as $journey) if (isset($journey['showHomepagePrice']) && !is_bool($journey['showHomepagePrice'])) return 'Homepage price visibility must be boolean';
    if (isset($homepage['footer'])) {
        if (!is_string($homepage['footer']['contactAddress'] ?? null) || strlen($homepage['footer']['contactAddress']) > 1000 || !filter_var($homepage['footer']['email'] ?? '', FILTER_VALIDATE_EMAIL)) return 'Invalid footer contact settings';
    }
    if (isset($homepage['legalIdentity'])) {
        $legal = $homepage['legalIdentity'];
        foreach (['entityName','registeredAddressChinese','registeredAddressEnglish','version','reviewedBy','reviewedAt','effectiveDate'] as $field) if (!is_string($legal[$field] ?? null) || strlen($legal[$field]) > 1000) return 'Invalid legal identity field';
        if (!in_array($legal['status'] ?? '', ['draft','approved'], true)) return 'Invalid legal review status';
        if ($legal['status'] === 'approved') foreach (['entityName','registeredAddressChinese','registeredAddressEnglish','version','reviewedBy','reviewedAt','effectiveDate'] as $field) if (trim($legal[$field]) === '') return 'Legal publication requires review and effective date';
    }
    if (($homepage['legalIdentity']['status'] ?? '') === 'approved') foreach (['reviewedAt','effectiveDate'] as $field) if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $homepage['legalIdentity'][$field])) return 'Legal dates must use YYYY-MM-DD';
    $hero = $homepage['hero'];
    foreach (['eyebrow', 'title', 'subtitle', 'image'] as $key) {
        if (empty($hero[$key]) || !is_string($hero[$key]) || mb_strlen($hero[$key]) > 500) return "Invalid hero {$key}";
    }
    if (!empty($hero['mobileImage']) && !homepage_valid_media($hero['mobileImage'])) return 'Invalid mobile hero image';
    if (isset($hero['imageFocalPoint']) && !preg_match('/^(100|\d{1,2})% (100|\d{1,2})%$/', $hero['imageFocalPoint'])) return 'Invalid hero focal point';
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
        'reviews' => ['eyebrow','title','intro'],
        'stories' => ['eyebrow','title'],
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
    if (!is_array($homepage['whyGallery'] ?? null) || count($homepage['whyGallery']) !== 5) return 'Why gallery needs five images';
    foreach ($homepage['whyGallery'] as $image) {
        if (!homepage_valid_media($image['src'] ?? null) || !is_string($image['alt'] ?? null) || trim($image['alt']) === '' || !is_bool($image['aiGenerated'] ?? null)) return 'Gallery image, alt and AI disclosure are required';
    }
    $ids = ['planning', 'road-trip', 'signature', 'education'];
    foreach ($homepage['services'] as $index => $service) {
        if (($service['id'] ?? '') !== $ids[$index] || empty($service['title']) || empty($service['summary']) || empty($service['price'])) return 'Invalid service order or fields';
        $anchor = ['planning-support', 'private-road-trip', 'signature-private-journey', 'educational-cultural-journeys'][$index];
        if (($service['href'] ?? '') !== '/traveler/services#' . $anchor) return 'Invalid service route';
        if (isset($service['unitApproved']) && !is_bool($service['unitApproved'])) return 'Unit approval must be a boolean';
        if (homepage_is_placeholder($service['price'])) return 'Service price cannot be a placeholder';
        $mediaError = homepage_service_media_error($service);
        if ($mediaError !== null) return $mediaError;
        if (!empty($service['bookingApproved']) && empty($homepage['bookingPolicyVersion'])) return 'Approved booking terms require a policy version';
        if (!empty($service['bookingApproved'])) {
            $error = homepage_policy_error($service, $homepage['bookingPolicyVersion'] ?? '');
            if ($error !== null) return $error;
        }
        if (empty($service['unit']) || empty($service['priceNote']) || empty($service['imageCaption']) || !is_array($service['includedHighlights'] ?? null) || count($service['includedHighlights']) !== 3) return 'Service unit, note, caption and three highlights required';
        foreach ($service['includedHighlights'] as $highlight) if (!is_string($highlight) || trim($highlight) === '') return 'Service highlights cannot be empty';
        if (!preg_match('/^(100|\d{1,2})(\.\d+)?% (100|\d{1,2})(\.\d+)?%$/', $service['imageFocalPoint'] ?? '')) return 'Image focal point must be two percentages';
    }
    $slugs = ['chengdu-cultural-gateway', 'western-sichuan-private-road-trip', 'deep-cultural-journey'];
    foreach ($homepage['journeys'] as $index => $journey) {
        if (($journey['slug'] ?? '') !== $slugs[$index] || empty($journey['title']) || empty($journey['duration']) || empty($journey['image'])) return 'Invalid journey order or fields';
        if (!homepage_valid_media($journey['image']) || empty($journey['imageAlt'])) return 'Journey image and alt are required';
        if (!empty($journey['priceBadgeApproved']) && !preg_match('/^From USD [1-9][\d,]*(?:\.\d{2})?$/', $journey['priceBadge'] ?? '')) return 'Starting-price badge must use From USD and an amount';
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
        if (!is_array($step) || count($step) < 4 || ($step[0] ?? '') !== str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT) || empty($step[1]) || empty($step[2]) || !is_string($step[3] ?? null)) return 'Six numbered journey steps are required';
    }
    $process = $homepage['process'] ?? [];
    if (($process['videoEnabled'] ?? true) !== false || !empty($process['videos']) || !is_array($process['steps'] ?? null) || count($process['steps']) !== 6) return 'Process needs six steps and no videos';
    foreach ($process['steps'] as $index => $step) {
        if (($step['order'] ?? null) !== $index + 1 || ($step['number'] ?? '') !== sprintf('%02d', $index + 1)) return 'Process order must be 01 through 06';
        foreach (['title', 'body'] as $field) if (!is_string($step[$field] ?? null) || trim($step[$field]) === '') return 'Process text is required';
        if (!is_string($step['reassurance'] ?? null)) return 'Invalid process reassurance';
    }
    foreach ($homepage['whyItems'] as $item) {
        if (!is_array($item) || count($item) < 2 || empty($item[0]) || empty($item[1])) return 'Four complete Why items are required';
    }
    foreach ($homepage['faqs'] as $faq) {
        if (!is_array($faq) || count($faq) < 2 || empty($faq[0]) || empty($faq[1])) return 'Five complete FAQs are required';
    }
    foreach ($homepage['reviews'] ?? [] as $item) {
        if (!empty($item['published']) && !homepage_review_approved($item)) return 'Published reviews require approved photo and review consent, identity, context and alt';
    }
    return null;
}
