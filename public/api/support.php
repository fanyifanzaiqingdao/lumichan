<?php
require __DIR__.'/_support.php';
require __DIR__.'/_support_knowledge.php';
require __DIR__.'/_support_reply.php';
support_headers(); api_cors_and_method(['GET','POST']);
try {
    $settings=support_settings();
    if ($_SERVER['REQUEST_METHOD']==='GET' && empty($_GET['id'])) api_json(200,['ok'=>true,'settings'=>$settings]);
    if (!$settings['enabled']) api_json(503,['ok'=>false,'error'=>'Chat is not available. Please email '.SUPPORT_EMAIL]);
    if ($_SERVER['REQUEST_METHOD']==='GET') api_json(200,['ok'=>true,'conversation'=>support_snapshot(support_visitor((string)$_GET['id']))]);
    $body=support_body(); $action=$body['action'] ?? '';
    support_limit('visitor:'.($_SERVER['REMOTE_ADDR'] ?? ''),60,3600);
    if ($action==='start') {
        if (($body['consent_version'] ?? '')!==SUPPORT_CONSENT || ($body['consent'] ?? false)!==true) throw new InvalidArgumentException('Consent is required');
        support_limit('start:'.($_SERVER['REMOTE_ADDR'] ?? ''),5,3600);
        $id=bin2hex(random_bytes(16)); $token=bin2hex(random_bytes(32)); $ai=($body['ai_consent'] ?? false)===true;
        $language=support_language($body['language'] ?? 'en');
        support_query('INSERT INTO support_conversations (id,token_hash,language,ai_consent,consent_version,created_at,updated_at,expires_at) VALUES (?,?,?,?,?,UTC_TIMESTAMP(),UTC_TIMESTAMP(),DATE_ADD(UTC_TIMESTAMP(),INTERVAL 30 DAY))',[$id,hash('sha256',$token),$language,$ai?1:0,SUPPORT_CONSENT]);
        support_message($id,'system',support_content_language($language)==='zh'?'你好，我是 Lumichan 咨询助手。你想了解哪类服务？':'Welcome to Lumichan. Which service would you like to explore?');
        api_json(201,['ok'=>true,'token'=>$token,'conversation'=>support_snapshot(support_conversation($id))]);
    }
    $id=support_text($body['id'] ?? '',32,true);
    db()->beginTransaction(); $row=support_visitor($id,true);
    if ($action==='delete') { support_query('DELETE FROM support_conversations WHERE id=?',[$id]); db()->commit(); api_json(200,['ok'=>true]); }
    if ($action==='contact') {
        $email=support_text($body['email'] ?? '',200);
        if ($email!=='' && !filter_var($email,FILTER_VALIDATE_EMAIL)) throw new InvalidArgumentException('Invalid email');
        support_query('UPDATE support_conversations SET email=? WHERE id=?',[$email,$id]); db()->commit();
        api_json(200,['ok'=>true,'conversation'=>support_snapshot(support_conversation($id))]);
    }
    if ($action==='handoff') {
        if ($row['state']==='closed') throw new InvalidArgumentException('This conversation is closed');
        support_handoff($id); db()->commit(); support_notify($id);
        api_json(200,['ok'=>true,'conversation'=>support_snapshot(support_conversation($id))]);
    }
    if ($action!=='message' || $row['state']==='closed') throw new InvalidArgumentException('Conversation is closed or action is invalid');
    $text=support_text($body['text'] ?? '',2000,true); $request=support_text($body['request_id'] ?? '',64,true);
    if (!preg_match('/^[a-zA-Z0-9-]{16,64}$/',$request)) throw new InvalidArgumentException('Invalid message ID');
    if (support_query('SELECT id FROM support_messages WHERE conversation_id=? AND request_id=?',[$id,$request])->fetchColumn()) {
        db()->commit(); api_json(200,['ok'=>true,'conversation'=>support_snapshot($row)]);
    }
    if ((int)support_query('SELECT COUNT(*) FROM support_messages WHERE conversation_id=?',[$id])->fetchColumn()>=400) throw new InvalidArgumentException('Conversation limit reached. Please email the team.');
    support_message($id,'visitor',$text,'',$request); db()->commit();
    $replyInfo=['mode'=>'knowledge_base','source'=>'none','reason'=>$row['state']==='waiting'?'waiting_for_staff':'human_active','ai'=>['called'=>false,'status'=>'not_called'],'matched_ids'=>[]];
    if ($row['state']==='ai') {
        $entries=array_filter(support_knowledge(),static fn($e)=>$e['published']);
        $topic=is_string($body['topic'] ?? null)?$body['topic']:'';
        $handoff=support_wants_human($text);
        $greeting=(bool)preg_match('/^(?:你好[啊呀吗]?|您好|嗨|哈喽|hello|hi|hey)[!！。.?？\s]*$/iu',trim($text));
        $selected=isset($entries[$topic])?[$topic]:[];
        $replyInfo['reason']=$handoff?'human_required':($selected?'quick_answer':(!$row['ai_consent']?'consent_required':'no_match'));
        $replyInfo['source']=$selected?'quick_answer':'none';
        if ($greeting && !$selected) $replyInfo['reason']='greeting';
        if (!$selected && !$handoff && !$greeting && $row['ai_consent']) {
            $history=support_query("SELECT body FROM support_messages WHERE conversation_id=? AND role='visitor' ORDER BY id DESC LIMIT 4",[$id])->fetchAll();
            try { $selected=support_select(array_reverse($history),$entries,$replyInfo['ai']); $replyInfo['reason']=$replyInfo['ai']['status']; $replyInfo['source']=$selected?'ai_selected_knowledge':'none'; }
            catch (Throwable $e) { $selected=[]; $replyInfo['reason']='internal_error'; $replyInfo['ai']['status']='internal_error'; }
        }
        $replyInfo['matched_ids']=$selected;
        db()->beginTransaction(); $latest=support_conversation($id,true);
        if ($latest['state']==='ai') {
            if ($handoff) {
                support_handoff($id);
                support_message($id,'system',support_content_language($row['language'])==='zh'?'此问题已加入人工待处理列表。你可以留下邮箱，或发邮件至 '.SUPPORT_EMAIL.'。人工回复时间以接待安排为准。':'This question is in the team queue. You can leave your email or contact '.SUPPORT_EMAIL.'. Replies are handled during office hours.');
            } elseif (!$selected) {
                $replyInfo['source']='automatic_guidance';
                support_message($id,'assistant',support_auto_fallback($replyInfo['reason'],support_content_language($row['language'])==='zh'));
            } else {
                $answers=[];
                foreach($selected as $entryId) { $e=$entries[$entryId]; $answers[]=$e['answer_'.support_content_language($row['language'])].($e['source']?"\n".$e['source']:''); }
                support_message($id,'assistant',implode("\n\n",$answers));
            }
        }
        else { $replyInfo['source']='none'; $replyInfo['reason']='state_changed'; }
        db()->commit();
    }
    if (in_array($row['state'],['waiting','human'],true)) {
        support_query("UPDATE support_conversations SET notification_status='pending',notification_attempts=0,notification_due=UTC_TIMESTAMP() WHERE id=? AND notification_status='sent' AND notification_due<=UTC_TIMESTAMP()",[$id]);
    }
    support_notify($id);
    api_json(200,['ok'=>true,'reply_info'=>$replyInfo,'conversation'=>support_snapshot(support_conversation($id))]);
} catch (InvalidArgumentException $e) {
    if (db()->inTransaction()) db()->rollBack();
    api_json(400,['ok'=>false,'error'=>$e->getMessage()]);
} catch (Throwable $e) {
    if (db()->inTransaction()) db()->rollBack();
    api_json(503,['ok'=>false,'error'=>'Chat temporarily unavailable. Please email '.SUPPORT_EMAIL]);
}
