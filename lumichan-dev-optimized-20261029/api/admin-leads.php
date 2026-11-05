<?php
require __DIR__ . '/_lib.php';

api_cors_and_method(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
admin_require();

const LEAD_STATUSES = ['new', 'reviewing', 'drafted', 'posted', 'replied', 'ignored'];

function leads_data_file(): string
{
    $dir = __DIR__ . '/data';
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    return $dir . '/travel_leads.json';
}

function leads_default_data(): array
{
    return [
        'keywords' => [
            'China travel itinerary',
            'Sichuan private driver',
            'Chengdu travel guide',
            'Western Sichuan tour',
            'Jiuzhaigou Huanglong trip',
        ],
        'leads' => [],
        'updated_at' => gmdate('c'),
    ];
}

function leads_load_store(): array
{
    $file = leads_data_file();
    if (!is_file($file)) {
        return leads_default_data();
    }
    $decoded = json_decode((string) file_get_contents($file), true);
    if (!is_array($decoded)) {
        return leads_default_data();
    }
    $decoded['keywords'] = array_values(array_filter(array_map('strval', $decoded['keywords'] ?? [])));
    $decoded['leads'] = is_array($decoded['leads'] ?? null) ? array_values($decoded['leads']) : [];
    $decoded['updated_at'] = (string) ($decoded['updated_at'] ?? gmdate('c'));
    return $decoded;
}

function leads_save_store(array $store): void
{
    $store['updated_at'] = gmdate('c');
    $json = json_encode($store, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    if ($json === false) {
        api_json(500, ['ok' => false, 'error' => 'Unable to encode lead data']);
    }
    file_put_contents(leads_data_file(), $json . "\n", LOCK_EX);
}

function lead_url_key(string $url): string
{
    $url = trim($url);
    if ($url === '') {
        return '';
    }
    $parts = parse_url($url);
    if (!is_array($parts) || empty($parts['host'])) {
        return strtolower(rtrim($url, '/'));
    }
    $host = strtolower((string) $parts['host']);
    $path = rtrim((string) ($parts['path'] ?? ''), '/');
    return $host . $path;
}

function lead_score(array $lead): int
{
    $text = strtolower(implode(' ', [
        $lead['title'] ?? '',
        $lead['summary'] ?? '',
        $lead['keyword'] ?? '',
        $lead['platform'] ?? '',
    ]));
    $score = 20;
    $signals = [
        'private driver' => 20,
        'guide' => 12,
        'itinerary' => 12,
        'chengdu' => 12,
        'sichuan' => 16,
        'western sichuan' => 18,
        'jiuzhaigou' => 14,
        'huanglong' => 12,
        'china trip' => 10,
        'how many days' => 8,
        'recommend' => 8,
        'solo' => 5,
        'family' => 5,
    ];
    foreach ($signals as $needle => $points) {
        if (str_contains($text, $needle)) {
            $score += $points;
        }
    }
    if (!empty($lead['url'])) {
        $score += 5;
    }
    return max(0, min(100, $score));
}

function lead_normalize(array $input, ?array $existing = null): array
{
    $now = gmdate('c');
    $status = (string) ($input['status'] ?? ($existing['status'] ?? 'new'));
    if (!in_array($status, LEAD_STATUSES, true)) {
        $status = 'new';
    }
    $lead = [
        'id' => (string) ($existing['id'] ?? ($input['id'] ?? api_new_id())),
        'platform' => trim((string) ($input['platform'] ?? ($existing['platform'] ?? 'Manual'))),
        'keyword' => trim((string) ($input['keyword'] ?? ($existing['keyword'] ?? ''))),
        'title' => trim((string) ($input['title'] ?? ($existing['title'] ?? ''))),
        'url' => trim((string) ($input['url'] ?? ($existing['url'] ?? ''))),
        'summary' => trim((string) ($input['summary'] ?? ($existing['summary'] ?? ''))),
        'author' => trim((string) ($input['author'] ?? ($existing['author'] ?? ''))),
        'status' => $status,
        'score' => isset($input['score']) ? (int) $input['score'] : (int) ($existing['score'] ?? 0),
        'admin_notes' => trim((string) ($input['admin_notes'] ?? ($existing['admin_notes'] ?? ''))),
        'reply_draft' => (string) ($input['reply_draft'] ?? ($existing['reply_draft'] ?? '')),
        'source' => (string) ($existing['source'] ?? ($input['source'] ?? 'manual')),
        'created_at' => (string) ($existing['created_at'] ?? $now),
        'updated_at' => $now,
        'posted_at' => (string) ($input['posted_at'] ?? ($existing['posted_at'] ?? '')),
    ];
    if ($lead['score'] <= 0) {
        $lead['score'] = lead_score($lead);
    }
    return $lead;
}

function leads_search_links(array $keywords): array
{
    $platforms = [
        ['name' => 'Reddit', 'url' => 'https://www.reddit.com/search/?q={{keyword}}'],
        ['name' => 'Tripadvisor', 'url' => 'https://www.tripadvisor.com/Search?q={{keyword}}'],
        ['name' => 'Quora', 'url' => 'https://www.quora.com/search?q={{keyword}}'],
        ['name' => 'YouTube', 'url' => 'https://www.youtube.com/results?search_query={{keyword}}'],
    ];
    $links = [];
    foreach ($keywords as $keyword) {
        foreach ($platforms as $platform) {
            $links[] = [
                'platform' => $platform['name'],
                'keyword' => $keyword,
                'url' => str_replace('{{keyword}}', rawurlencode($keyword), $platform['url']),
            ];
        }
    }
    return $links;
}

function lead_discover_queries(array $keywords): array
{
    $platforms = [
        ['name' => 'Reddit', 'query' => 'site:reddit.com "{{keyword}}" travel', 'domains' => ['reddit.com']],
        ['name' => 'Tripadvisor', 'query' => 'site:tripadvisor.com "{{keyword}}" forum', 'domains' => ['tripadvisor.com']],
        ['name' => 'Quora', 'query' => 'site:quora.com "{{keyword}}"', 'domains' => ['quora.com']],
        ['name' => 'YouTube', 'query' => 'site:youtube.com/watch "{{keyword}}"', 'domains' => ['youtube.com', 'youtu.be']],
    ];
    $queries = [];
    foreach ($keywords as $keyword) {
        foreach ($platforms as $platform) {
            $queries[] = [
                'platform' => $platform['name'],
                'keyword' => $keyword,
                'query' => str_replace('{{keyword}}', $keyword, $platform['query']),
                'domains' => $platform['domains'],
            ];
        }
    }
    return $queries;
}

function discover_url_allowed(string $url, array $domains): bool
{
    $host = strtolower((string) (parse_url($url, PHP_URL_HOST) ?: ''));
    if ($host === '') {
        return false;
    }
    $host = preg_replace('/^www\./', '', $host) ?: $host;
    foreach ($domains as $domain) {
        $domain = strtolower((string) $domain);
        if ($host === $domain || str_ends_with($host, '.' . $domain)) {
            return true;
        }
    }
    return false;
}

function discover_fallback_results(array $keywords): array
{
    $results = [];
    foreach (leads_search_links($keywords) as $link) {
        $results[] = [
            'platform' => $link['platform'],
            'keyword' => $link['keyword'],
            'title' => $link['platform'] . ' platform search: ' . $link['keyword'],
            'url' => $link['url'],
            'already_imported' => false,
            'is_search_page' => true,
        ];
        if (count($results) >= 12) {
            break;
        }
    }
    return $results;
}

function discover_fetch_url(string $url): string
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 LumichanLeadFinder/1.0',
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_TIMEOUT => 6,
    ]);
    $html = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if (!is_string($html) || $html === '' || $code < 200 || $code >= 300) {
        return '';
    }
    return $html;
}

function discover_fetch(string $query): array
{
    $sources = [
        [
            'name' => 'DuckDuckGo',
            'url' => 'https://html.duckduckgo.com/html/?q=' . rawurlencode($query),
            'pattern' => '/<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/is',
        ],
        [
            'name' => 'Bing',
            'url' => 'https://www.bing.com/search?q=' . rawurlencode($query),
            'pattern' => '/<li[^>]+class="[^"]*b_algo[^"]*"[^>]*>.*?<h2[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/is',
        ],
    ];

    foreach ($sources as $source) {
        $html = discover_fetch_url($source['url']);
        if ($html === '') {
            continue;
        }
        if (preg_match_all($source['pattern'], $html, $matches, PREG_SET_ORDER)) {
            return [
                'source' => $source['name'],
                'matches' => $matches,
            ];
        }
    }

    return ['source' => '', 'matches' => []];
}

function discover_clean_url(string $url): string
{
    $url = html_entity_decode($url, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $parts = parse_url($url);
    if (is_array($parts) && isset($parts['host']) && str_contains((string) $parts['host'], 'duckduckgo.com')) {
        parse_str((string) ($parts['query'] ?? ''), $query);
        if (!empty($query['uddg']) && is_string($query['uddg'])) {
            $url = urldecode($query['uddg']);
        }
    }
    return trim($url);
}

function discover_results(array $keywords, array $existingLeads): array
{
    $deadline = microtime(true) + 22;
    $existing = [];
    foreach ($existingLeads as $lead) {
        $key = lead_url_key((string) ($lead['url'] ?? ''));
        if ($key !== '') {
            $existing[$key] = true;
        }
    }

    $seen = [];
    $results = [];
    $searched = [];
    foreach (lead_discover_queries($keywords) as $query) {
        if (microtime(true) >= $deadline) {
            break;
        }
        $search = discover_fetch($query['query']);
        $searched[] = [
            'platform' => $query['platform'],
            'keyword' => $query['keyword'],
            'source' => $search['source'],
            'matches' => count($search['matches']),
        ];
        if (empty($search['matches'])) {
            continue;
        }
        foreach ($search['matches'] as $match) {
            if (microtime(true) >= $deadline) {
                if (empty($results)) {
                    $results = discover_fallback_results($keywords);
                }
                return ['results' => $results, 'searched' => $searched];
            }
            $url = discover_clean_url((string) $match[1]);
            if ($url === '' || !preg_match('/^https?:\/\//i', $url)) {
                continue;
            }
            if (!discover_url_allowed($url, $query['domains'])) {
                continue;
            }
            $key = lead_url_key($url);
            if ($key === '' || isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $title = trim(html_entity_decode(strip_tags((string) $match[2]), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            if ($title === '') {
                continue;
            }
            $results[] = [
                'platform' => $query['platform'],
                'keyword' => $query['keyword'],
                'title' => $title,
                'url' => $url,
                'already_imported' => isset($existing[$key]),
            ];
            if (count($results) >= 24) {
                return ['results' => $results, 'searched' => $searched];
            }
        }
    }
    if (empty($results)) {
        $results = discover_fallback_results($keywords);
    }

    return ['results' => $results, 'searched' => $searched];
}

function find_lead_index(array $leads, string $id): int
{
    foreach ($leads as $index => $lead) {
        if (($lead['id'] ?? '') === $id) {
            return $index;
        }
    }
    return -1;
}

function deepseek_key(): string
{
    $key = (string) getenv('DEEPSEEK_API_KEY');
    if ($key === '') {
        $key = (string) ($_SERVER['DEEPSEEK_API_KEY'] ?? '');
    }
    return trim($key);
}

function deepseek_generate_reply(array $lead): string
{
    $key = deepseek_key();
    if ($key === '') {
        api_json(400, ['ok' => false, 'error' => 'DEEPSEEK_API_KEY is not configured on the server']);
    }

    $payload = [
        'model' => 'deepseek-chat',
        'temperature' => 0.55,
        'max_tokens' => 420,
        'messages' => [
            [
                'role' => 'system',
                'content' => 'You write helpful, non-spammy English community replies for Lumichan, a China and Sichuan travel service. Be concise, useful first, transparent about affiliation, and never pretend the admin has posted automatically.',
            ],
            [
                'role' => 'user',
                'content' => "Draft a reply for this travel lead. Include practical advice, mention Lumichan only softly if relevant, and end with an invitation to ask for route help.\n\nPlatform: " . ($lead['platform'] ?? '') . "\nTitle: " . ($lead['title'] ?? '') . "\nPost summary: " . ($lead['summary'] ?? '') . "\nKeyword: " . ($lead['keyword'] ?? ''),
            ],
        ],
    ];

    $ch = curl_init('https://api.deepseek.com/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $key,
        ],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT => 45,
    ]);
    $raw = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if (!is_string($raw) || $raw === '' || $code < 200 || $code >= 300) {
        api_json(502, ['ok' => false, 'error' => 'DeepSeek request failed']);
    }
    $decoded = json_decode($raw, true);
    $content = $decoded['choices'][0]['message']['content'] ?? '';
    if (!is_string($content) || trim($content) === '') {
        api_json(502, ['ok' => false, 'error' => 'DeepSeek returned an empty reply']);
    }
    return trim($content);
}

$store = leads_load_store();
$method = $_SERVER['REQUEST_METHOD'];
$body = api_read_json_body();
$action = (string) ($_GET['action'] ?? ($body['action'] ?? ''));

if ($method === 'GET') {
    api_json(200, [
        'ok' => true,
        'keywords' => $store['keywords'],
        'search_links' => leads_search_links($store['keywords']),
        'leads' => $store['leads'],
        'deepseek_configured' => deepseek_key() !== '',
        'statuses' => LEAD_STATUSES,
    ]);
}

if ($action === 'keywords') {
    $keywords = $body['keywords'] ?? [];
    if (is_string($keywords)) {
        $keywords = preg_split('/\r\n|\r|\n|,/', $keywords) ?: [];
    }
    $store['keywords'] = array_values(array_unique(array_filter(array_map(
        static fn($value) => trim((string) $value),
        is_array($keywords) ? $keywords : []
    ))));
    leads_save_store($store);
    api_json(200, ['ok' => true, 'keywords' => $store['keywords'], 'search_links' => leads_search_links($store['keywords'])]);
}

if ($method === 'POST' && $action === 'discover') {
    $keywords = $body['keywords'] ?? $store['keywords'];
    if (is_string($keywords)) {
        $keywords = preg_split('/\r\n|\r|\n|,/', $keywords) ?: [];
    }
    $keywords = array_slice(array_values(array_filter(array_map(
        static fn($value) => trim((string) $value),
        is_array($keywords) ? $keywords : []
    ))), 0, 3);
    $discovery = discover_results($keywords, $store['leads']);
    api_json(200, [
        'ok' => true,
        'results' => $discovery['results'],
        'searched' => $discovery['searched'],
    ]);
}

if ($method === 'POST' && $action === 'draft') {
    $id = (string) ($body['id'] ?? '');
    $index = find_lead_index($store['leads'], $id);
    if ($index < 0) {
        api_json(404, ['ok' => false, 'error' => 'Lead not found']);
    }
    $draft = deepseek_generate_reply($store['leads'][$index]);
    $store['leads'][$index]['reply_draft'] = $draft;
    $store['leads'][$index]['status'] = 'drafted';
    $store['leads'][$index]['updated_at'] = gmdate('c');
    leads_save_store($store);
    api_json(200, ['ok' => true, 'lead' => $store['leads'][$index]]);
}

if ($method === 'POST') {
    $lead = lead_normalize($body + ['source' => 'manual']);
    $key = lead_url_key($lead['url']);
    foreach ($store['leads'] as $existing) {
        if ($key !== '' && lead_url_key((string) ($existing['url'] ?? '')) === $key) {
            api_json(409, ['ok' => false, 'error' => 'Duplicate lead URL already exists']);
        }
    }
    array_unshift($store['leads'], $lead);
    leads_save_store($store);
    api_json(201, ['ok' => true, 'lead' => $lead]);
}

$id = (string) ($_GET['id'] ?? ($body['id'] ?? ''));
$index = find_lead_index($store['leads'], $id);
if ($index < 0) {
    api_json(404, ['ok' => false, 'error' => 'Lead not found']);
}

if ($method === 'PUT' || $method === 'PATCH') {
    $lead = lead_normalize($body, $store['leads'][$index]);
    if ($lead['status'] === 'posted' && $lead['posted_at'] === '') {
        $lead['posted_at'] = gmdate('c');
    }
    $store['leads'][$index] = $lead;
    leads_save_store($store);
    api_json(200, ['ok' => true, 'lead' => $lead]);
}

if ($method === 'DELETE') {
    array_splice($store['leads'], $index, 1);
    leads_save_store($store);
    api_json(200, ['ok' => true]);
}

api_json(400, ['ok' => false, 'error' => 'Unknown action']);
