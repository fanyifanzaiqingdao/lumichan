<?php
declare(strict_types=1);
function journeys_scope(): string {
    $scope = (string)(api_config()['content_environment'] ?? '');
    if (!in_array($scope, ['production', 'staging', 'local'], true)) throw new RuntimeException('Set content_environment in config.php');
    return $scope;
}
function journeys_record(): array {
    $pdo = db(); $scope = journeys_scope();
    $query = $pdo->prepare('SELECT payload, revision FROM journey_content WHERE environment = ?');
    $query->execute([$scope]); $row = $query->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        // Import existing edits once; subsequent reads and writes use MySQL only.
        $file = __DIR__.'/data/journeys.live.json';
        if (!is_file($file)) $file = __DIR__.'/data/journeys.json';
        $page = json_decode((string)file_get_contents($file), true, 64, JSON_THROW_ON_ERROR);
        if (!is_array($page) || journeys_validate($page) !== null) throw new RuntimeException('Invalid migration source');
        $insert = $pdo->prepare('INSERT IGNORE INTO journey_content (environment, payload, revision) VALUES (?, ?, 1)');
        $insert->execute([$scope, json_encode($page, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)]);
        $query->execute([$scope]); $row = $query->fetch(PDO::FETCH_ASSOC);
    }
    return ['page'=>json_decode($row['payload'], true, 64, JSON_THROW_ON_ERROR), 'revision'=>(int)$row['revision']];
}
function journeys_load(): array { return journeys_record()['page']; }
function journeys_save(array $page, int $revision): bool {
    $stmt = db()->prepare('UPDATE journey_content SET payload = ?, revision = revision + 1, updated_at = CURRENT_TIMESTAMP WHERE environment = ? AND revision = ?');
    $stmt->execute([json_encode($page, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR), journeys_scope(), $revision]);
    return $stmt->rowCount() === 1;
}
// Real photographs require verified rights, source, usage and portrait permission.
// AI illustrative assets are allowed, but may never use private/watermarked reference files.
function journeys_media_publishable(array $m): bool {
    return ($m['illustrative']??false) === true ? ($m['rightsStatus']??'') === 'illustrative' :
        (($m['rightsStatus']??'') === 'verified' && trim($m['source']??'')!=='' && trim($m['usage']??'')!=='' && trim($m['realLocation']??'')!=='' && in_array($m['portraitPermission']??'', ['verified','not-required','not-applicable','not applicable'],true));
}
function journeys_validate(array $page): ?string {
    try {
        $text=function($v) {if(!is_string($v)||strlen($v)>12000||preg_match('/[\x00-\x1f]/',str_replace(["\n","\r","\t"],'',$v))) throw new Exception('Invalid text');};
        $fields=function($v,$keys) use($text){if(!is_array($v))throw new Exception('Invalid object');foreach(explode(' ',$keys) as $k)$text($v[$k]??null);};
        $list=function($v) {if(!is_array($v)||!array_is_list($v)||count($v)>100)throw new Exception('Invalid list');return $v;};
        $strings=function($v)use($list,$text){foreach($list($v) as $s)$text($s);};
        $publishing=true;
        $media=function($m)use($fields,&$publishing){
            if(array_key_exists('order',$m)&&(!is_int($m['order'])||$m['order']<0))throw new Exception('Invalid media order');
            $fields($m,'assetId src mobileSrc alt caption focalPoint mobileFocalPoint rightsStatus source realLocation portraitPermission usage replacementStatus');
            if(!is_bool($m['illustrative']))throw new Exception('Invalid illustrative flag');
            foreach(['src','mobileSrc'] as $k){$u=rawurldecode($m[$k]);if($u!=='' && (!preg_match('~^(?:/(?!/)|https://[a-z0-9.-]+(?::443)?/)~i',$u)||preg_match('~[\\\\\s<>]|\.\.|/(?:private|references?|reference_photos_internal_only|reference_samples|source-assets)(?:/|$)|/[^/]*(?:watermark|qingcheng_pdf|profile[-_]chongqing)[^/]*$~i',$u)))throw new Exception('Unsafe or reference image URL');}
            foreach(['focalPoint','mobileFocalPoint'] as $k)if(!preg_match('/^(?:100|\d{1,2})% (?:100|\d{1,2})%$/',$m[$k]))throw new Exception('Invalid focal point');
            if($m['src']===''||trim($m['alt'])==='')throw new Exception('Image source and alt required');
            if($m['illustrative'] && $m['rightsStatus']!=='illustrative')throw new Exception('Illustrative media requires illustrative rights');
            if($publishing && !journeys_media_publishable($m))throw new Exception('Real photographs require verified rights, source, usage and portrait permission');
        };
        if(($page['schemaVersion']??null)!==1)throw new Exception('Unsupported schema');
        $l=$page['landing']??null;$fields($l,'title eyebrow body finalTitle finalBody ctaLabel');
        if(count($list($l['hero']??null))===0)throw new Exception('Landing hero required');
        foreach($l['hero'] as $m)$media($m);if(isset($l['finalImage']))$media($l['finalImage']);
        $slugs=['cultural-gateway','western-sichuan-private-road-trip','deep-cultural-journey'];$seen=[];
        foreach($list($page['journeys']??null) as $j){
            $fields($j,'slug title eyebrow subtitle body seoTitle seoDescription status inquiryJourneyId');
            foreach(['featuredBody','goodToKnowTitle'] as $key)if(array_key_exists($key,$j))$text($j[$key]);
            if(!in_array($j['slug'],$slugs,true)||in_array($j['slug'],$seen,true)||!in_array($j['status'],['draft','published'],true))throw new Exception('Invalid slug or status');$seen[]=$j['slug'];
            if($j['inquiryJourneyId']!==$j['slug'])throw new Exception('Inquiry ID must equal slug');
            $publishing=$j['status']==='published';
            if(isset($j['finalImage']))$media($j['finalImage']);
            $media($j['hero']??null);$fields($j['intro']??null,'eyebrow title');$strings($j['intro']['paragraphs']??null);$strings($j['intro']['regionCues']??null);
            if(isset($j['travelInformation']))$strings($j['travelInformation']);
            $gateway=$j['slug']==='cultural-gateway';$fields($j['experience']??null,'eyebrow title body');$items=$list($j['experience']['items']??null);
            if(count($items)!==($gateway?3:6))throw new Exception('Incorrect experience count');
            foreach($items as $i){$fields($i,'title body');if(!is_int($i['order']??null)||$i['order']<0)throw new Exception('Invalid order');$media($i['image']??null);if($gateway||isset($i['slides'])){if(count($list($i['slides']??null))!==4)throw new Exception('Exactly four slides required');foreach($i['slides'] as $m)$media($m);}}
            $fields($j['gallery']??null,'eyebrow title body');$gallery=$list($j['gallery']['items']??null);if(!$gateway&&count($gallery)!==6)throw new Exception('Six gallery images required');foreach($gallery as $m)$media($m);
            $fields($j['story']??null,'eyebrow title');$strings($j['story']['paragraphs']??null);$media($j['story']['image']??null);
            $gtk=$list($j['goodToKnow']??null);if(count($gtk)!==($gateway?5:4))throw new Exception('Incorrect good-to-know count');foreach($gtk as $i)$fields($i,'title body icon');
            $fields($j['cta']??null,'title primaryLabel secondaryLabel note');$strings($j['cta']['paragraphs']??null);$media($j['cta']['image']??null);
        }
        if(count($seen)!==3)throw new Exception('All three journeys required');
        $publishing=true;
        foreach(['featured','moods'] as $key)if(count($list($l[$key]??null))!==3||count(array_unique(array_column($l[$key],'slug')))!==3)throw new Exception('Exactly three unique featured and mood journeys required');
        foreach($list($l['featured']??null) as $i)if(!in_array($i['slug']??null,$slugs,true)||!is_int($i['order']??null)||$i['order']<0)throw new Exception('Invalid featured record');
        foreach($list($l['moods']??null) as $i){$fields($i,'title body slug');if(!in_array($i['slug'],$slugs,true))throw new Exception('Invalid mood slug');$media($i['image']??null);}
        return null;
    }catch(Throwable $e){return $e->getMessage();}
}
function journeys_public(array $page): array {
    $page['journeys']=array_values(array_filter($page['journeys'],fn($j)=>$j['status']==='published'));
    $slugs=array_column($page['journeys'],'slug');
    foreach(['featured','moods'] as $key)$page['landing'][$key]=array_values(array_filter($page['landing'][$key],fn($i)=>in_array($i['slug'],$slugs,true)));
    $walk=function($v)use(&$walk){if(!is_array($v))return $v;if(isset($v['src'])&&!journeys_media_publishable($v))return null;if(isset($v['src']))$v=array_intersect_key($v,array_flip(['src','mobileSrc','alt','caption','focalPoint','mobileFocalPoint','illustrative','order']));foreach($v as $k=>$i)$v[$k]=$walk($i);if(array_is_list($v)&&isset($v[0]['order']))usort($v,fn($a,$b)=>$a['order']<=>$b['order']);return $v;};
    return $walk($page);
}
