<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__.'/_support.php';
$deleted=support_cleanup();
$ids=support_query("SELECT id FROM support_conversations WHERE state IN ('waiting','human') AND notification_status IN ('pending','failed','sending') AND notification_attempts<5 AND notification_due<=UTC_TIMESTAMP() AND expires_at>UTC_TIMESTAMP() LIMIT 20")->fetchAll();
foreach ($ids as $row) support_notify($row['id']);
echo 'Expired conversations removed: '.$deleted."\n";
