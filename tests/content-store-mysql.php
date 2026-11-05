<?php
// Dedicated temporary MySQL socket only; never reads site credentials.
require __DIR__.'/../public/api/_content_store.php';
$scope='staging';
function api_config(): array {return ['content_environment'=>$GLOBALS['scope']];}
function db(): PDO {static $p;return $p??=new PDO('mysql:unix_socket='.$_SERVER['argv'][1].';dbname=content_test','root','',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);}
function api_json(int $status,array $body): void {throw new RuntimeException((string)$status);}
function check(bool $ok): void {if(!$ok)throw new RuntimeException('Assertion failed');}
check(content_load('test',[],['title'=>'original'])['title']==='original');
content_save('test',['title'=>'edited']);
check(content_load('test',[],['title'=>'seed'])['title']==='edited');
$scope='production';check(content_load('test',[],['title'=>'production'])['title']==='production');
$scope='staging';check(content_load('test')['title']==='edited');
db()->exec("UPDATE site_content SET payload='{}' WHERE environment='staging' AND content_key='test'");
try {content_save('test',['title'=>'stale']);throw new RuntimeException('Conflict missing');} catch(RuntimeException $e){check($e->getMessage()==='409');}
echo "PASS: import, persistence, environment isolation, concurrent save conflict\n";
