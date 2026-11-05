<?php
require __DIR__.'/../public/api/_journeys.php';
function check($ok,$message){if(!$ok)throw new RuntimeException($message);}
$seed=json_decode(file_get_contents(__DIR__.'/../public/api/data/journeys.json'),true,64,JSON_THROW_ON_ERROR);
check(journeys_validate($seed)===null,'Seed validates');
function fails($mutate,$message){global $seed;$p=$seed;$mutate($p);check(journeys_validate($p)!==null,$message);}
fails(function(&$p){$p['schemaVersion']=2;},'Version');
fails(function(&$p){$p['landing']['hero']=[];},'Hero required');
fails(function(&$p){$p['landing']['featured'][1]=$p['landing']['featured'][0];},'Unique featured');
fails(function(&$p){array_pop($p['landing']['moods']);},'Three moods');
fails(function(&$p){$p['journeys'][0]['inquiryJourneyId']='wrong';},'Canonical inquiry');
fails(function(&$p){array_pop($p['journeys'][0]['experience']['items'][0]['slides']);},'Four slides');
fails(function(&$p){array_pop($p['journeys'][1]['gallery']['items']);},'Six gallery images');
fails(function(&$p){array_pop($p['journeys'][2]['goodToKnow']);},'GTK count');
fails(function(&$p){$p['landing']['hero'][0]['rightsStatus']='pending';},'Illustrative rights');
fails(function(&$p){$p['landing']['finalImage']=[];},'Optional final image validated');
foreach(['javascript:alert(1)','//evil/a.jpg','/private/a.jpg','/references/a.jpg','/reference_photos_internal_only/4.jpg','/images/qingcheng_pdf_p7.jpg','/images/profile-chongqing-city-reference.jpg','/images/watermarked-photo.jpg','/images/%2e%2e/a.jpg','https://evil.com@safe.com/a.jpg'] as $url)fails(function(&$p)use($url){$p['landing']['hero'][0]['src']=$url;},'Unsafe URL '.$url);
$p=$seed;$p['landing']['hero'][0]['src']='/images/private-road-trip.jpg';check(journeys_validate($p)===null,'Private word in filename allowed');
$p=$seed;$p['journeys'][0]['status']='draft';$m=&$p['journeys'][0]['hero'];$m['illustrative']=false;$m['rightsStatus']='pending';$m['source']='';$m['usage']='';$m['portraitPermission']='pending';unset($m);
check(journeys_validate($p)===null,'Pending photo in draft');$public=journeys_public($p);check(count($public['journeys'])===2,'Draft excluded');check(count($public['landing']['featured'])===2,'Draft featured excluded');
$p['journeys'][0]['status']='published';check(journeys_validate($p)!==null,'Unverified publication rejected');check(journeys_public($p)['journeys'][0]['hero']===null,'Unverified media never exposed');
$public=journeys_public($seed);$json=json_encode($public);foreach(['rightsStatus','portraitPermission','replacementStatus','realLocation','assetId'] as $key)check(!str_contains($json,'"'.$key.'"'),'Internal metadata stripped '.$key);
echo "Journeys seed, validation failures and projection tests passed\n";

foreach(['featuredBody','goodToKnowTitle'] as $key){$p=$seed;$p['journeys'][0][$key]='Optional text';check(journeys_validate($p)===null,'Optional text accepted');$p['journeys'][0][$key]=[];check(journeys_validate($p)!==null,'Optional text validated');}
$p=$seed;$p['landing']['finalImage']=$p['landing']['hero'][0];check(journeys_validate($p)===null,'Landing final image accepted');
$p=$seed;$items=&$p['journeys'][1]['gallery']['items'];foreach($items as $i=>&$image)$image['order']=count($items)-$i;unset($image,$items);$r=journeys_public($p);check(array_column($r['journeys'][1]['gallery']['items'],'order')===[1,2,3,4,5,6],'Media order survives and sorts');
echo "Optional fields and media ordering tests passed\n";

$p=$seed;$p['journeys'][0]['hero']['illustrative']=false;$p['journeys'][0]['hero']['rightsStatus']='verified';$p['journeys'][0]['hero']['realLocation']='';check(journeys_validate($p)!==null,'Real photo requires an actual location');
