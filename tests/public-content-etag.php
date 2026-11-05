<?php
require __DIR__.'/../public/api/_public_content.php';
foreach ([['"abc"', true], ['W/"abc"', true], ['"other", W/"abc"', true], ['*', true], ['W/"other"', false], ['', false]] as [$header, $expected]) {
    if (public_content_etag_matches($header, '"abc"') !== $expected) throw new RuntimeException('ETag mismatch: '.$header);
}
echo "ETag revalidation checks passed\n";
