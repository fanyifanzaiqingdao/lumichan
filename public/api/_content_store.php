<?php
// MySQL is authoritative after the first import of each environment/key.
function content_scope(): string {
    $scope = (string)(api_config()['content_environment'] ?? '');
    if (!in_array($scope, ['production','staging','local'], true)) throw new RuntimeException('Set content_environment');
    return $scope;
}
function content_load(string $key, array $files = [], array $fallback = []): array {
    try {
        $q=db()->prepare('SELECT payload FROM site_content WHERE environment=? AND content_key=?');
        $q->execute([content_scope(),$key]); $raw=$q->fetchColumn();
        if ($raw===false) {
            $data=$fallback;
            foreach ($files as $file) if(is_file($file)) {
                $data=json_decode((string)file_get_contents($file),true,128,JSON_THROW_ON_ERROR);
                if(!is_array($data)) throw new RuntimeException('Invalid migration source');
                break;
            }
            $s=db()->prepare('INSERT IGNORE INTO site_content(environment,content_key,payload) VALUES(?,?,?)');
            $s->execute([content_scope(),$key,json_encode($data,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)]);
            $q->execute([content_scope(),$key]); $raw=$q->fetchColumn();
        }
        $GLOBALS['content_original'][$key]=$raw;
        return json_decode($raw,true,128,JSON_THROW_ON_ERROR);
    } catch(Throwable $e) { api_json(503,['ok'=>false,'error'=>'Content database unavailable. Check schema and content_environment.']); }
}
function content_save(string $key,array $data): void {
    try {
        $raw=json_encode($data,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
        $old=$GLOBALS['content_original'][$key]??null;
        if($old!==null) {
            $s=db()->prepare('UPDATE site_content SET payload=?,revision=revision+1 WHERE environment=? AND content_key=? AND BINARY payload=BINARY ?');
            $s->execute([$raw,content_scope(),$key,$old]);
            $conflict = !$s->rowCount();
        } else {
            $s=db()->prepare('INSERT INTO site_content(environment,content_key,payload) VALUES(?,?,?) ON DUPLICATE KEY UPDATE payload=VALUES(payload),revision=revision+1');
            $s->execute([content_scope(),$key,$raw]);
        }
    } catch(Throwable $e) { api_json(503,['ok'=>false,'error'=>'Could not save content to database']); }
    if ($conflict ?? false) api_json(409,['ok'=>false,'error'=>'Content changed. Reload and retry.']);
}
function content_homepage(): array { return content_load('homepage',[__DIR__.'/data/homepage.live.json',__DIR__.'/data/homepage.json']); }
