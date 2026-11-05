<?php
// Keep ordinary questions in automated support; only explicit requests trigger handoff.
function support_wants_human(string $text): bool {
    if (preg_match('/不要.{0,5}人工|不用.{0,5}人工|不需要.{0,5}人工|(?:do not|don.t|no need to).{0,20}(?:human|agent|person)/iu', $text)) return false;
    return (bool)preg_match('/^(?:人工(?:客服)?|human(?: support)?|live agent)[.!！。\s]*$|(?:转接|转|找|联系|需要|想要|要).{0,8}人工|(?:speak|talk|connect|transfer|chat).{0,25}(?:human|person|agent)|(?:want|need|request).{0,15}(?:human|live agent)/iu', $text);
}
function support_auto_fallback(string $reason, bool $zh): string {
    if ($reason === 'greeting') return $zh
        ? '你好！我是 Lumichan 自动咨询助手。我们提供四川、川西及重庆的私人旅行与行程规划支持。你想去哪里，或想了解哪类旅行体验？'
        : 'Hello! I’m the Lumichan automated assistant. We offer private journeys and planning support in Sichuan, Western Sichuan and Chongqing. Where would you like to go, or what would you like to experience?';
    if ($reason === 'consent_required') return $zh
        ? '此会话尚未授权 AI 处理。你可以使用快捷问题了解服务，或选择人工客服；我们不会将你的消息发送给模型。'
        : 'AI processing has not been authorized for this conversation. You can use the quick questions to explore our services or choose human support. Your messages will not be sent to the model.';
    if ($reason !== 'no_match') return $zh
        ? '自动匹配暂时不可用，请稍后再试，或使用快捷问题了解服务。会话仍保留在自动咨询模式；如需人工，可点击人工客服。'
        : 'Automated matching is temporarily unavailable. Please try again later or use a quick question. This conversation remains in automated mode; you can choose human support if needed.';
    return $zh
        ? '我暂时没有找到能准确回答这个问题的资料。你可以补充目的地、旅行时间或具体需求，我可以介绍我们的旅行与规划服务。实时可订情况、具体退款、签证及个人医疗问题需要另行核实，我不能作出保证；如希望工作人员处理，请明确告诉我或点击人工客服。'
        : 'I don’t yet have information that answers this accurately. Could you share your destination, travel dates or specific needs? I can introduce our journeys and planning services. Availability, individual refunds, visa and personal medical questions need separate verification; I cannot make guarantees. If you want a team member, please ask or choose human support.';
}
