<?php
declare(strict_types=1);
require __DIR__ . '/../public/api/_inquiry.php';
function expect(bool $condition): void { if (!$condition) throw new RuntimeException('Assertion failed'); }
$base = ['request_id' => '12345678-1234-4234-8234-123456789abc', 'name' => 'Tester', 'email' => 'test@example.com', 'preferred_contact' => 'Email', 'travelers' => 2, 'travel_dates' => 'June', 'privacy_consent' => true, 'consent_version' => 'test', 'source_page' => '/traveler', 'language' => 'en'];
foreach (['cultural-gateway', 'western-sichuan-private-road-trip', 'deep-cultural-journey'] as $id) {
    foreach (['/journeys', '/journeys/' . $id] as $source) {
        $record = inquiry_validate(array_merge($base, ['journey_id' => $id, 'journey_name' => 'Edited name', 'source_page' => $source, 'utm' => ['utm_source' => 'test']]));
        expect(inquiry_journey_metadata($record) === ['id' => $id, 'name' => 'Edited name', 'source_page' => $source]);
        expect(json_decode($record['utm_json'], true)['utm_source'] === 'test');
    }
}
$record = inquiry_validate(array_merge($base, ['journey_id' => 'cultural-gateway']));
expect(inquiry_journey_metadata($record)['name'] === 'Cultural Gateway');
$record = inquiry_validate(array_merge($base, ['journey_id' => '', 'journey_name' => 'stale']));
expect(inquiry_journey_metadata($record)['name'] === '');
expect(inquiry_journey_metadata(inquiry_validate($base))['id'] === '');
foreach ([['journey_id' => 'unknown'], ['journey_id' => []], ['journey_id' => str_repeat('x', 65)], ['journey_name' => str_repeat('x', 101)], ['journey_name' => "bad\nname"], ['source_page' => 'https://evil.test'], ['source_page' => '/journeys/../admin'], ['source_page' => str_repeat('x', 256)]] as $bad) {
    try { inquiry_validate(array_merge($base, $bad)); } catch (InvalidArgumentException $e) { continue; }
    throw new RuntimeException('Invalid input accepted');
}
foreach (['invalid json', '{"journey":[]}', '{"journey":{"id":"unknown","name":"Injected"}}', '{"journey":{"id":"cultural-gateway","name":"bad\\nname"}}'] as $json) {
    expect(inquiry_journey_metadata(['utm_json' => $json, 'source_page' => '/journeys']) === ['id' => '', 'name' => '', 'source_page' => '/journeys']);
}
expect(inquiry_journey_metadata([]) === ['id' => '', 'name' => '', 'source_page' => '']);
expect(inquiry_journey_metadata(['source_page' => '//evil.test'])['source_page'] === '');
echo "Journey inquiry tests passed (no database).\n";
