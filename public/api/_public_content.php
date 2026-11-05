<?php
// Public projected content only. Revalidate every use so unpublishing stays effective.
function public_content_etag_matches(string $condition, string $etag): bool {
    // GET revalidation uses weak comparison; gzip proxies may add W/.
    if (trim($condition) === '*') return true;
    preg_match_all('/(?:W\/)?"[^"]*"/', $condition, $matches);
    foreach ($matches[0] as $candidate) {
        if (preg_replace('/^W\//', '', $candidate) === $etag) return true;
    }
    return false;
}
function public_content_json(array $payload): void {
    $body=json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    $etag='"'.hash('sha256',$body).'"';
    header('Cache-Control: private, no-cache');
    header('ETag: '.$etag);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    if (public_content_etag_matches($_SERVER['HTTP_IF_NONE_MATCH'] ?? '', $etag)) { http_response_code(304); exit; }
    echo $body;
    exit;
}
