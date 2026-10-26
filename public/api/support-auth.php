<?php
require __DIR__.'/_support.php';
support_headers(); api_cors_and_method(['GET','POST']);
try {
    if ($_SERVER['REQUEST_METHOD']==='GET') api_json(200,['ok'=>true,'staff'=>support_staff()]);
    $b=support_body(); $action=$b['action'] ?? '';
    if ($action==='logout') {
        support_require_staff(); admin_session_start(); unset($_SESSION['support_email'],$_SESSION['support_at'],$_SESSION['support_csrf'],$_SESSION['admin_ok'],$_SESSION['admin_at']);
        session_regenerate_id(true); api_json(200,['ok'=>true]);
    }
    $email=strtolower(support_text($b['email'] ?? '',200,true));
    if (!support_allowed_email($email)) throw new InvalidArgumentException('请使用有效的 LUMICHAN 企业邮箱');
    support_limit('auth-ip:'.($_SERVER['REMOTE_ADDR'] ?? ''),20,3600);
    if ($action==='request') {
        support_limit('otp:'.$email,3,900);
        $code=(string)random_int(100000,999999);
        support_query('INSERT INTO support_otp (email,code_hash,attempts,expires_at) VALUES (?,?,0,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 10 MINUTE)) ON DUPLICATE KEY UPDATE code_hash=VALUES(code_hash),attempts=0,expires_at=VALUES(expires_at)',[$email,password_hash($code,PASSWORD_DEFAULT)]);
        if (!api_send_mail($email,'Lumichan 客服中心登录验证码',"验证码：{$code}\n10 分钟内有效。请勿转发；若非本人操作，请忽略。")) {
            support_query('DELETE FROM support_otp WHERE email=?',[$email]); api_json(503,['ok'=>false,'error'=>'验证码发送失败，请检查服务器 SMTP 配置']);
        }
        api_json(200,['ok'=>true]);
    }
    if ($action!=='verify') throw new InvalidArgumentException('Invalid action');
    $code=support_text($b['code'] ?? '',6,true);
    db()->beginTransaction();
    $otp=support_query('SELECT * FROM support_otp WHERE email=? FOR UPDATE',[$email])->fetch();
    if (!$otp || $otp['expires_at']<=gmdate('Y-m-d H:i:s') || $otp['attempts']>=5 || !password_verify($code,$otp['code_hash'])) {
        support_query('UPDATE support_otp SET attempts=attempts+1 WHERE email=?',[$email]); db()->commit(); api_json(401,['ok'=>false,'error'=>'验证码无效或已过期']);
    }
    support_query('DELETE FROM support_otp WHERE email=?',[$email]); db()->commit();
    admin_session_start(); session_regenerate_id(true);
    $_SESSION['support_email']=$email; $_SESSION['support_at']=time(); $_SESSION['support_csrf']=bin2hex(random_bytes(24));
    api_json(200,['ok'=>true,'staff'=>support_staff()]);
} catch (InvalidArgumentException $e) { api_json(400,['ok'=>false,'error'=>$e->getMessage()]); }
catch (Throwable $e) { if(db()->inTransaction()) db()->rollBack(); api_json(503,['ok'=>false,'error'=>'客服登录暂不可用，请检查数据库配置及建表']); }
