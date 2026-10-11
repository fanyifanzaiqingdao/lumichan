<?php
require __DIR__ . '/../public/api/_inquiry.php';
require __DIR__ . '/../public/api/_homepage.php';

function expect_valid(bool $condition, string $label): void
{
    if (!$condition) throw new RuntimeException($label);
}

function expect_invalid(array $input, string $label): void
{
    try {
        inquiry_validate($input);
        throw new RuntimeException($label);
    } catch (InvalidArgumentException $e) {
        return;
    }
}

$input = [
    'request_id' => 'd28178c2-c77b-4d85-8616-619f5a8a214b',
    'name' => 'Test Traveler',
    'email' => 'traveler@example.test',
    'preferred_contact' => 'Email',
    'travelers' => 2,
    'travel_dates' => 'May 2027',
    'privacy_consent' => true,
    'consent_version' => 'homepage-v1.1-2026-10-10',
    'source_page' => '/traveler',
    'language' => 'en',
];
$valid = inquiry_validate($input);
expect_valid($valid['travelers'] === 2 && $valid['contact_handle'] === '', 'valid inquiry');
expect_invalid([...$input, 'privacy_consent' => false], 'consent required');
expect_invalid([...$input, 'travelers' => 0], 'travelers required');
expect_invalid([...$input, 'preferred_contact' => 'WhatsApp'], 'handle required');
expect_invalid([...$input, 'preferred_service' => 'Educational & Cultural Journeys'], 'education minimum');
expect_invalid([...$input, 'interests' => [['nested']]], 'nested interests rejected');

$homepage = json_decode((string) file_get_contents(__DIR__ . '/../public/api/data/homepage.json'), true);
expect_valid(homepage_validate($homepage) === null, 'default homepage is valid');
$homepage['journeys'][0]['priceApproved'] = true;
expect_valid(homepage_validate($homepage) !== null, 'unpriced journey cannot be approved');
$homepage['journeys'][0]['priceApproved'] = false;
$homepage['vlogs'][] = ['published' => true, 'title' => 'Unlicensed video'];
expect_valid(homepage_validate($homepage) !== null, 'unlicensed video cannot be published');
expect_valid(count(homepage_public($homepage)['vlogs']) === 0, 'unlicensed video hidden');
echo "Validation checks passed\n";
