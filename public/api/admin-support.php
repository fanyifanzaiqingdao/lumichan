<?php
require __DIR__.'/_support.php'; require __DIR__.'/_support_knowledge.php';
support_headers(); api_cors_and_method(['GET','POST']);
try {
    $staff=support_require_staff($_SERVER['REQUEST_METHOD']==='POST');
    if ($_SERVER['REQUEST_METHOD']==='GET') {
        if (isset($_GET['id'])) {
            $row=support_conversation((string)$_GET['id']);
            // One read audit per employee and conversation per 10 minutes, not every poll.
            if (!support_query("SELECT id FROM support_audit WHERE conversation_id=? AND actor=? AND action='view' AND created_at>DATE_SUB(UTC_TIMESTAMP(),INTERVAL 10 MINUTE) LIMIT 1",[$row['id'],$staff['email']])->fetchColumn()) support_audit($row['id'],$staff['email'],'view');
            api_json(200,['ok'=>true,'conversation'=>support_snapshot($row,true)]);
        }
        if (isset($_GET['knowledge'])) api_json(200,['ok'=>true,'entries'=>array_values(support_knowledge())]);
        $state=(string)($_GET['state'] ?? ''); $args=[];
        $sql='SELECT id,state,assignee,email,language,created_at,updated_at,expires_at,notification_status FROM support_conversations WHERE expires_at>UTC_TIMESTAMP()';
        if (in_array($state,['ai','waiting','human','closed'],true)) { $sql.=' AND state=?'; $args[]=$state; }
        $search=support_text($_GET['search'] ?? '',200);
        if ($search!=='') { $sql.=' AND (email LIKE ? OR id LIKE ?)'; $args[]='%'.$search.'%'; $args[]='%'.$search.'%'; }
        $page=max(0,min(10000,(int)($_GET['page'] ?? 0)));
        $sql.=' ORDER BY updated_at DESC,id DESC LIMIT 101 OFFSET '.($page*100);
        $rows=support_query($sql,$args)->fetchAll(); $more=count($rows)>100;
        $c=api_config();
        api_json(200,['ok'=>true,'conversations'=>array_slice($rows,0,100),'has_more'=>$more,'settings'=>support_settings()+['wecom_configured'=>!empty($c['support_wecom_webhook']),'mail_configured'=>!empty($c['send_mail']),'daily_ai_limit'=>$c['support_daily_ai_limit'] ?? 200]]);
    }
    $b=support_body(); $action=$b['action'] ?? '';
    if ($action==='knowledge') {
        if (!$staff['admin']) api_json(403,['ok'=>false,'error'=>'仅管理员可以维护知识库']);
        $id=support_text($b['id'] ?? '',32); if ($id==='') $id=bin2hex(random_bytes(16));
        if(!preg_match('/^[a-f0-9]{32}$/',$id)) throw new InvalidArgumentException('系统条目由网站内容维护，不能在此覆盖');
        if (!support_query('SELECT id FROM support_knowledge WHERE id=?',[$id])->fetchColumn() && (int)support_query('SELECT COUNT(*) FROM support_knowledge')->fetchColumn()>=200) throw new InvalidArgumentException('自定义知识条目上限为 200 条，请维护已有条目');
        $title=support_text($b['title'] ?? '',200,true); $en=support_text($b['answer_en'] ?? '',4000,true); $zh=support_text($b['answer_zh'] ?? '',4000,true);
        support_query('INSERT INTO support_knowledge (id,title,answer_en,answer_zh,published,updated_at) VALUES (?,?,?,?,?,UTC_TIMESTAMP()) ON DUPLICATE KEY UPDATE title=VALUES(title),answer_en=VALUES(answer_en),answer_zh=VALUES(answer_zh),published=VALUES(published),updated_at=VALUES(updated_at)',[$id,$title,$en,$zh,($b['published'] ?? false)===true?1:0]);
        api_json(200,['ok'=>true]);
    }
    $id=support_text($b['id'] ?? '',32,true);
    db()->beginTransaction(); $row=support_conversation($id,true);
    if ($action==='claim') {
        if ($row['state']==='closed') throw new InvalidArgumentException('会话已结束');
        if ($row['assignee']!=='' && $row['assignee']!==$staff['email']) throw new InvalidArgumentException('会话已由其他员工接待');
        if ($row['state']==='human' && $row['assignee']===$staff['email']) { db()->commit(); api_json(200,['ok'=>true,'conversation'=>support_snapshot($row,true)]); }
        support_query("UPDATE support_conversations SET state='human',assignee=?,updated_at=UTC_TIMESTAMP() WHERE id=?",[$staff['email'],$id]);
        support_message($id,'system',$row['language']==='zh'?'Lumichan 团队已接管此会话，AI 自动回复已暂停。':'The Lumichan team has taken over. Automated replies are paused.');
    } elseif ($action==='reply') {
        if ($row['state']!=='human' || $row['assignee']!==$staff['email']) throw new InvalidArgumentException('请先接管会话');
        $text=support_text($b['text'] ?? '',4000,true); $request=support_text($b['request_id'] ?? '',64,true);
        if(!preg_match('/^[a-zA-Z0-9-]{16,64}$/',$request)) throw new InvalidArgumentException('Invalid message ID');
        if(!support_query('SELECT id FROM support_messages WHERE conversation_id=? AND request_id=?',[$id,$request])->fetchColumn()) support_message($id,'agent',$text,$staff['email'],$request);
    } elseif ($action==='close') {
        if ($row['assignee']!=='' && $row['assignee']!==$staff['email']) throw new InvalidArgumentException('仅当前接待人可结束会话');
        support_query("UPDATE support_conversations SET state='closed',updated_at=UTC_TIMESTAMP() WHERE id=?",[$id]);
    } elseif ($action==='resume') {
        if ($row['assignee']!==$staff['email'] || $row['state']!=='human') throw new InvalidArgumentException('仅当前接待人可恢复 AI');
        support_query("UPDATE support_conversations SET state='ai',assignee='',updated_at=UTC_TIMESTAMP() WHERE id=?",[$id]);
        support_message($id,'system',$row['language']==='zh'?'会话已返回自动咨询模式。':'This conversation has returned to automated support.');
    } elseif ($action==='notify') {
        support_query("UPDATE support_conversations SET notification_status='pending',notification_attempts=0,notification_due=UTC_TIMESTAMP() WHERE id=?",[$id]);
    } elseif ($action==='delete') {
        if(!$staff['admin']) api_json(403,['ok'=>false,'error'=>'仅管理员可删除']);
        support_query('DELETE FROM support_conversations WHERE id=?',[$id]); db()->commit(); api_json(200,['ok'=>true]);
    } else throw new InvalidArgumentException('Invalid action');
    support_audit($id,$staff['email'],$action); db()->commit();
    if ($action==='notify') support_notify($id);
    api_json(200,['ok'=>true,'conversation'=>support_snapshot(support_conversation($id),true)]);
} catch (InvalidArgumentException $e) { if(db()->inTransaction()) db()->rollBack(); api_json(400,['ok'=>false,'error'=>$e->getMessage()]); }
catch (Throwable $e) { if(db()->inTransaction()) db()->rollBack(); api_json(503,['ok'=>false,'error'=>'客服数据库未就绪，请导入 support-schema.sql 并检查配置']); }
