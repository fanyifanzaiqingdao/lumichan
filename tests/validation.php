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
expect_invalid([...$input, 'preferred_contact' => 'Ins'], 'Ins handle required');
expect_invalid([...$input, 'preferred_contact' => 'WeChat'], 'WeChat handle required');
foreach (['Ins', 'WeChat'] as $channel) {
    $contact = inquiry_validate([...$input, 'preferred_contact' => $channel, 'contact_handle' => 'qa-account']);
    expect_valid($contact['preferred_contact'] === $channel && $contact['contact_handle'] === 'qa-account', 'new contact retained');
}
foreach (['WhatsApp', 'LINE'] as $channel) expect_invalid([...$input, 'preferred_contact' => $channel, 'contact_handle' => 'qa-account'], 'removed channel rejected');
expect_invalid([...$input, 'preferred_service' => 'Educational & Cultural Journeys'], 'education minimum');
expect_invalid([...$input, 'interests' => [['nested']]], 'nested interests rejected');

$homepage = json_decode((string) file_get_contents(__DIR__ . '/../public/api/data/homepage.json'), true);
expect_valid(homepage_validate($homepage) === null, 'default homepage is valid');
$draft = $homepage;
$draft['services'][0]['booking'] = 'An unapproved refund promise';
$draft['services'][0]['bookingApproved'] = false;
expect_valid(homepage_public($draft)['services'][0]['booking'] !== $draft['services'][0]['booking'], 'unapproved booking copy stays private');
$draft['services'][0]['bookingApproved'] = true;
$draft['bookingPolicyVersion'] = '';
expect_valid(homepage_public($draft)['services'][0]['booking'] !== $draft['services'][0]['booking'], 'policy version is required before publishing');
$draft['bookingPolicyVersion'] = $homepage['bookingPolicyVersion'];
expect_valid(homepage_public($draft)['services'][0]['booking'] === $draft['services'][0]['booking'], 'approved booking copy remains configurable');
$homepage['journeys'][0]['priceApproved'] = true;
expect_valid(homepage_validate($homepage) !== null, 'unpriced journey cannot be approved');
$homepage['journeys'][0]['priceApproved'] = false;
$homepage['vlogs'][] = ['published' => true, 'title' => 'Unlicensed video'];
expect_valid(homepage_validate($homepage) === null, 'legacy video history can be kept');
expect_valid(count(homepage_public($homepage)['vlogs']) === 0, 'unlicensed video hidden');
$broken = $homepage;
array_pop($broken['services'][3]['bookingPolicy']['refundSteps']);
expect_valid(homepage_validate($broken) !== null, 'education departure-day tier required');
$broken = $homepage;
$broken['services'][0]['bookingPolicy']['footnotes'] = [];
expect_valid(homepage_validate($broken) !== null, 'policy conditions required');
$broken = $homepage;
$broken['services'][0]['bookingPolicy']['homepageRefundSummary']['stepIndex'] = 1;
expect_valid(homepage_validate($broken) !== null, 'only first tier on homepage');
$broken = $homepage;
$broken['services'][0]['bookingPolicy']['version'] = 'old-version';
expect_valid(homepage_validate($broken) !== null, 'versions must match');
expect_valid(empty(homepage_public($broken)['services'][0]['bookingApproved']), 'stale policy not published');
$broken = $homepage;
$broken['services'][1]['bookingPolicy']['refundSteps'][1]['refund'] = '50%';
expect_valid(homepage_validate($broken) !== null, 'confirmed refund schedule cannot silently change');
$broken = $homepage;
$broken['reviews'] = [['id' => '1', 'published' => true, 'status' => 'approved', 'quote' => 'Fixture']];
expect_valid(homepage_validate($broken) !== null, 'reviews need both authorizations and photos');
expect_valid(count(homepage_public($broken)['reviews']) === 0, 'unauthorized reviews hidden');
$old = $homepage;
unset($old['schemaVersion'], $old['process']);
$old['services'][0]['image'] = '/uploads/custom.jpg';
$old['services'][0]['media'] = ['source' => 'Owned photo', 'consentOrLicenseRecord' => 'QA license record'];
$upgraded = homepage_upgrade($old);
expect_valid($upgraded['services'][0]['image'] === '/uploads/custom.jpg', 'migration preserves custom images');
expect_valid(homepage_validate($upgraded) === null, 'migrated content validates');
$draft = $homepage;
$draft['services'][0]['image'] = '/uploads/draft.jpg';
$draft['services'][0]['media'] = ['published' => false];
expect_valid(homepage_validate($draft) === null, 'unpublished replacement may be saved without license');
$public = homepage_public($draft);
expect_valid($public['services'][0]['image'] === '' && $public['services'][0]['media']['published'] === false, 'unpublished service image stays private');
expect_valid($draft['services'][0]['image'] === '/uploads/draft.jpg', 'public filtering does not erase draft');
unset($draft['schemaVersion']);
expect_valid(homepage_upgrade($draft)['services'][0]['media']['published'] === false, 'migration keeps image unpublished');
$draft = homepage_upgrade($draft);
$draft['services'][0]['media']['published'] = true;
expect_valid(homepage_validate($draft) !== null, 'replacement cannot publish without license');
expect_valid(homepage_public($draft)['services'][0]['image'] === '', 'invalid published replacement filtered on read');
$draft['services'][0]['media'] = ['published' => true, 'source' => 'QA owned image', 'consentOrLicenseRecord' => 'QA license fixture'];
expect_valid(homepage_validate($draft) === null, 'licensed replacement can publish');
expect_valid(homepage_public($draft)['services'][0]['image'] === '/uploads/draft.jpg', 'licensed replacement appears publicly');
$draft['services'][0]['media']['published'] = 'false';
expect_valid(homepage_validate($draft) !== null, 'publish flag must be boolean');
expect_valid(homepage_public($draft)['services'][0]['image'] === '', 'invalid publish flag is filtered');
$legacy = $homepage;
unset($legacy['contentRevision']);
$legacy['hero']['title'] = 'Preserved custom hero';
$legacy['services'][0]['price'] = 'From RMB 999';
$legacy['services'][0]['details'] = ['priceDetail' => 'Old price', 'support' => 'Keep this'];
$legacy['journeys'][0]['title'] = 'Old title';
$updated = homepage_upgrade($legacy);
expect_valid($updated['services'][0]['price'] === 'From USD 99', 'USD price migration');
expect_valid($updated['services'][0]['details']['priceDetail'] === '1–5 days: USD 99 · 6–10 days: USD 199', 'detail price migration');
expect_valid($updated['services'][0]['details']['support'] === 'Keep this' && $updated['hero']['title'] === 'Preserved custom hero', 'unrelated CMS edits kept');
expect_valid($updated['journeys'][0]['title'] === 'Cultural gateway', 'journey migration');
expect_valid(homepage_upgrade($updated) === $updated, 'migration idempotent');
$updated['services'][0]['price'] = 'From USD 109';
expect_valid(homepage_upgrade($updated)['services'][0]['price'] === 'From USD 109', 'later CMS edits preserved');
$updated['journeys'][0]['priceBadge'] = 'PLACEHOLDER';
expect_valid(homepage_validate($updated) !== null, 'invalid badge cannot save');
expect_valid(homepage_public($updated)['journeys'][0]['priceBadge'] === '', 'invalid badge filtered');
$updated = $homepage;
array_pop($updated['whyGallery']);
expect_valid(homepage_validate($updated) !== null, 'five gallery photos required');
$v22 = $homepage;
$v22['storySequences'][0]['frames'] = [];
expect_valid(homepage_validate($v22) !== null, 'stories need exactly four frames');
$v22 = $homepage;
$v22['services'][3]['titleLinkEnabled'] = true;
expect_valid(homepage_validate($v22) !== null, 'education title cannot link to retail service details');
$v22 = $homepage;
$v22['legalIdentity']['status'] = 'approved';
expect_valid(homepage_validate($v22) !== null, 'registration needs approval metadata');
expect_valid(!isset(homepage_public($homepage)['legalIdentity']), 'draft registration is not public');
$v22['legalIdentity']['reviewedBy'] = 'QA fixture';
$v22['legalIdentity']['reviewedAt'] = '2026-10-27';
$v22['legalIdentity']['effectiveDate'] = '2026-10-28';
expect_valid(homepage_validate($v22) === null, 'reviewed registration may publish');
expect_valid(isset(homepage_public($v22)['legalIdentity']), 'approved registration is returned');
echo "Validation checks passed\n";
