<?php
declare(strict_types=1);
function translations_file(): string { return __DIR__ . '/data/translations.live.json'; }
function translations_load(): array {
    return content_load('translations',[translations_file()],['entries'=>[]])['entries'] ?? [];
}
function translations_languages(): array {
    static $languages = null;
    if ($languages === null) $languages = array_column(json_decode((string) file_get_contents(__DIR__ . '/data/locales.json'), true), 'code');
    return $languages;
}
function translations_validate(mixed $entries): ?string {
    if (!is_array($entries) || !array_is_list($entries) || count($entries) > 2500) return 'Invalid translation entries';
    $seen = [];
    foreach ($entries as $entry) {
        if (!is_array($entry)) return 'Invalid translation entry';
        foreach (array_merge(['source','en','zh'], array_values(array_filter(translations_languages(), fn($code) => !in_array($code,['en','zh'],true) && array_key_exists($code,$entry)))) as $key) {
            if (!is_string($entry[$key] ?? null) || strlen($entry[$key]) > 24000 || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', $entry[$key])) return 'Invalid translation text';
        }
        $source = $entry['source'];
        if (trim($source) === '' || isset($seen[$source]) || !is_bool($entry['enabled'] ?? null)) return 'Empty or duplicate translation source';
        $seen[$source] = true;
        if (array_diff(array_keys($entry), array_merge(['source','enabled'],translations_languages()))) return 'Unknown translation field';
    }
    return null;
}
function translations_inventory(): array {
    $result = [];
    $walk = function (mixed $node, string $path, string $key = '') use (&$walk, &$result): void {
        if (is_array($node)) {
            foreach ($node as $k => $v) {
                if (in_array((string)$k, ['translations','media','bookingPolicy','legalIdentity'], true)) continue;
                $walk($v, $path . '.' . $k, is_int($k) ? $key : (string)$k);
            }
        } elseif (is_string($node) && trim($node) !== '' && preg_match('/(?:title|subtitle|summary|description|intro|eyebrow|body|label|text|note|reassurance|disclaimer|question|answer|highlights|included|bestFor|points|tags|trustPoints|faqs|whyItems|successTitle|successBody|errorMessage|contactAddress|alt|caption|paragraphs|regionCues|goodToKnowTitle|travelInformation)/i', $key)) {
            if (preg_match('~^(?:https?://|/(?! ))~', $node)) return;
            $result[] = ['source' => $node, 'path' => $path];
        }
    };
    foreach (['homepage','services-page','journeys'] as $name) {
        if ($name==='journeys') { require_once __DIR__.'/_journeys.php'; $data=journeys_load(); }
        else $data=content_load($name,[__DIR__.'/data/'.$name.'.live.json',__DIR__.'/data/'.$name.'.json']);
        if (is_array($data)) $walk($data, $name);
    }
    return $result;
}
