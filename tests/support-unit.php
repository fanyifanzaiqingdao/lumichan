<?php
require __DIR__.'/../public/api/_support.php';
function check(bool $value, string $label): void { if (!$value) throw new RuntimeException($label); echo "PASS $label\n"; }
check(!support_hours(new DateTimeImmutable('2026-10-22 08:29:00+08:00')), 'weekday before opening');
check(support_hours(new DateTimeImmutable('2026-10-22 08:30:00+08:00')), 'weekday opens at 08:30');
check(!support_hours(new DateTimeImmutable('2026-10-22 16:00:00+08:00')), 'weekday closes at 16:00');
check(support_hours(new DateTimeImmutable('2026-10-24 09:00:00+08:00')), 'Saturday opens at 09:00');
check(!support_hours(new DateTimeImmutable('2026-10-25 13:00:00+08:00')), 'Sunday closes at 13:00');
check(support_hours(new DateTimeImmutable('2026-10-22 00:30:00Z')), 'UTC converted to China time');
check(support_redact('Email user@example.com, phone +86 135 1234 5678') === 'Email [email removed], phone [number removed]', 'model input redacts email and long numbers');
$entries=['pricing'=>['id'=>'pricing'],'contact'=>['id'=>'contact'],'guide'=>['id'=>'guide']];
check(support_selected_ids('{"ids":["pricing","unknown","pricing","contact","guide"]}', $entries) === ['pricing','contact'], 'only two unique approved IDs');
check(support_selected_ids('{"ids":[{},null,3]}', $entries) === [], 'invalid model types ignored');
check(support_selected_ids('bad json', $entries) === [], 'malformed model output hands off');
check(support_selected_ids('{"ids":"pricing"}', $entries) === [], 'invalid IDs shape hands off');
$home=json_decode(file_get_contents(__DIR__.'/../public/api/data/homepage.json'),true);
$home['services'][0]['priceNote']='1–5 days: RMB 999 · 5–10 days: RMB 1,599';
check(homepage_upgrade($home)['services'][0]['priceNote'] === '1–5 days: RMB 999 · 6–10 days: RMB 1,599', 'old overlap migrated to confirmed fifth-day pricing');
$home['services'][0]['priceNote']='Custom approved quotation';
check(homepage_upgrade($home)['services'][0]['priceNote'] === 'Custom approved quotation', 'custom price notes preserved');
