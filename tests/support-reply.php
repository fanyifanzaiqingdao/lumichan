<?php
require __DIR__.'/../public/api/_support_reply.php';
foreach (['你好啊'=>false,'我的退款'=>false,'不要转人工'=>false,'如何申请签证'=>false,'我要人工'=>true,'转人工客服'=>true,'I want a human'=>true,'talk to a real person'=>true,'where can I go'=>false,"I don't want a human"=>false] as $input=>$expected) {
    if (support_wants_human($input)!==$expected) throw new RuntimeException('Routing failed: '.$input);
}
foreach (['greeting','no_match','consent_required','timeout','quota_exceeded'] as $reason) {
    foreach ([true,false] as $zh) if (!support_auto_fallback($reason,$zh)) throw new RuntimeException('Missing reply');
}
echo "PASS explicit handoff, negation, ordinary questions and bilingual fallback replies\n";
