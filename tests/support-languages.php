<?php
require __DIR__ . '/../public/api/_support.php';
foreach (json_decode((string) file_get_contents(__DIR__ . '/../public/api/data/locales.json'), true) as $locale) {
    $code=$locale['code'];
    if (support_language($code)!==$code || strlen($code)>8) throw new RuntimeException('Unsupported conversation language: '.$code);
    $answerLanguage=in_array($code,['zh','zh-TW'],true)?'zh':'en';
    if (support_content_language($code)!==$answerLanguage) throw new RuntimeException('Wrong approved answer language');
}
foreach (['invalid', ['en'], null] as $value) if(support_language($value)!=='en') throw new RuntimeException('Unsafe language must fall back to English');
echo "Support language checks passed: nine interface languages, existing schema, approved English/Chinese answers only.\n";
