<?php
declare(strict_types=1);

function support_knowledge(): array {
    $file = __DIR__.'/data/homepage.live.json';
    $home = json_decode((string)file_get_contents(is_file($file)?$file:__DIR__.'/data/homepage.json'),true);
    if (!is_array($home)) throw new RuntimeException('Homepage unavailable');
    $home = homepage_public($home);
    $entries = [];
    $add = static function($id,$title,$en,$zh,$source='/traveler/services') use (&$entries) {
        $entries[$id]=['id'=>$id,'title'=>$title,'answer_en'=>$en,'answer_zh'=>$zh,'source'=>$source,'published'=>true,'locked'=>true];
    };
    $add('services','Services / 四类服务','Choose planning and local support, a private road trip, a signature private journey, or an educational and cultural program. Which kind of support would help you most?','可选择行程规划与当地支持、私人公路旅行、私人定制旅程，或教育与文化交流项目。你更需要哪类支持？');
    $add('about-lumichan','About Lumichan company / 公司介绍','Lumichan is rooted in Chengdu and designs private journeys around travelers’ interests, pace and service needs. Its core expertise is Sichuan, Western Sichuan and Chongqing. The registered entity presented in the company profile is Sichuan Fourth Branch of Huanyu Zongheng International Travel Agency (Chongqing) Co., Ltd. For a partnership, the team should confirm the contracting entity and operating permissions against current original documents.','Lumichan 立足成都，围绕旅客兴趣、节奏和服务需求设计私人旅程，核心目的地为四川、川西和重庆。公司介绍中的主体为寰宇纵横国际旅行社（重庆）有限公司四川第四分公司；合作签约主体及经营权限须由团队结合现行原件核实。','/traveler/about');
    $add('destinations','Destinations Sichuan Chongqing Yunnan Xinjiang / 目的地覆盖','Our home ground is Sichuan, Western Sichuan and Chongqing. Examples include Chengdu culture, Tibetan culture and mountain road trips, Taoist heritage, Sanxingdui and the Leshan Giant Buddha. Guizhou and Yunnan, and Southern Xinjiang are sample journey possibilities; local resources, availability and service requirements must be checked before confirmation.','我们的核心目的地为四川、川西和重庆，体验包括成都文化、藏文化与山地公路旅行、道教文化、三星堆和乐山大佛。贵州与云南、南疆属于可讨论的示例路线，需核实当地资源、可订情况及服务需求后确认。','/traveler/about');
    $add('partnerships','B2B travel agency partnership net rates ground handling / 旅行社合作地接净价','We offer net-rate purchasing, local ground handling and joint product design. Partners share guest requirements and manage their client relationship; Lumichan develops the local plan and coordinates agreed arrangements in China. The process is inquiry, design, quotation, agreement, delivery and feedback. Contact '.SUPPORT_EMAIL.' for a proposal; net rates and responsibilities are confirmed individually, not quoted automatically.','可讨论净价采购、当地地接及联合产品设计。合作方提供客人需求并管理客户关系，Lumichan 制定当地方案并协调约定服务。流程为咨询、设计、报价、协议、执行、反馈。请联系 '.SUPPORT_EMAIL.'；净价与责任范围需单独确认，不由客服自动报价。','/traveler/about#partnerships');
    foreach ($home['services'] as $service) {
        $id=$service['id'];
        $add('service-'.$id,$service['title'].' / service scope 服务范围',$service['summary'].' '.implode(' · ',$service['includedHighlights']).'. Final inclusions are confirmed in your proposal.',$service['title'].'：'.implode('、',$service['includedHighlights']).'。具体服务范围以确认方案为准。',$service['href']);
        if (homepage_policy_approved($service,$home['bookingPolicyVersion'] ?? '')) {
            $policy=$service['bookingPolicy'];
            $text=$service['title']."\n";
            foreach($policy['refundSteps'] as $step) $text.=$step['when'].': '.$step['refund'].(str_contains($step['refund'],'%')?' refund':'')."\n";
            $text.=$policy['dateChange']."\n".implode("\n",$policy['footnotes']);
            $add('policy-'.$id,$service['title'].' cancellation refund date changes / 取消退款改期',
                $text."\nThe team must confirm the applicable tier and amount for your booking. Timing calculations and partial-refund formulas are not automated.",
                "以下保留已确认英文条款，避免翻译改变退款条件：\n".$text."\n具体订单适用档位和金额需人工核实；起算方式、提前天数和部分退款算法不自动判断。",'/traveler/booking-terms');
        }
    }
    $prices=implode("\n",array_map(static fn($s)=>$s['title'].': '.$s['price'].' '.$s['unit'],$home['services']));
    $add('pricing','Starting prices currency per vehicle not per person / 起价计价单位', $prices."\nVehicle prices are per day, per vehicle, not per person. Final pricing and inclusions are confirmed in your proposal.",$prices."\n车辆服务按天、按车计价，不是每人价格。最终价格和包含项目以确认报价为准。");
    $add('planning-five-days','Five day planning support price / 5天规划价格','Planning support for a five-day trip is USD 99. This is the planning-support fee, not a complete travel package. Third-party services are quoted separately.','5 天行程规划支持费用为 USD 99。这是规划支持费用，不是整个旅行套餐价格；第三方服务另行报价。');
    foreach ($home['services'] as $service) if ($service['id']==='planning') {
        $add('planning-ranges','Planning fee by trip length, 1-5 and 6-10 days / 规划支持价格区间',
            $service['priceNote'].'. This is a planning-support fee, not the total trip cost. Longer trips require a quotation.',
            $service['priceNote'].'。这是规划支持费用，不是旅程总价；更长行程需另行确认报价。');
    }
    $add('journey-prices','Popular journey prices / 热门路线费用','Journey prices are confirmed in your proposal. A vehicle service starting price is not a complete itinerary price or a per-person quote.','热门路线价格在方案中确认。车辆服务起价不等于路线总价，也不是每人报价。','/traveler/journeys');
    $add('inclusions','Hotels meals tickets included / 酒店餐饮门票','For Private Road Trip, accommodation and meals are not included unless stated in your quotation. For Signature Private Journey, accommodation, meals and special experiences are quoted separately unless included in your confirmed package. Other inclusions need confirmation.','Private Road Trip 的住宿和餐饮除非报价明确包含，否则不包含。Signature 的住宿、餐饮和特别体验除非确认套餐包含，否则另行报价。其他包含项目需确认。');
    $add('guide','English speaking driver versus guide / 英文司机导游','An English-speaking driver is not the same service as a professional guide. Guiding and interpretation depend on the confirmed scope and availability.','英文司机不等同于专业导游。讲解、导游和翻译安排需根据确认范围及可用情况核实。');
    $add('family','Children family group size / 儿童家庭人数','Private Road Trip is recommended for up to four travelers. Larger groups, child seats and luggage requirements need confirmation. Educational programs require at least six travelers.','Private Road Trip 推荐最多 4 名旅客；更多人数、儿童座椅和行李需求需单独确认。教育与文化项目最低 6 名旅客。');
    $add('undecided','Not sure where to go / 不知道去哪','A rough idea is enough. Share your approximate dates, group size and interests; we can help identify a suitable service and route direction.','没有完整行程也可以咨询。告诉我们大致日期、人数和兴趣，我们可以协助选择服务及路线方向。');
    $add('availability','Dates availability vehicle room / 实时可订情况','Availability must be checked by the team. Please share your dates, group size and destination. Nothing is reserved through this chat.','可订情况需要团队核实，请提供日期、人数和目的地。此聊天不会直接预留车辆、房间或名额。');
    $add('inquiry','Inquiry booking payment / 咨询预订付款','Submitting an inquiry requires no payment and does not confirm a booking. The team will clarify scope, price and terms with you.','提交咨询无需付款，也不代表预订成功。团队会进一步确认范围、价格和条款。','/traveler#inquiry');
    $add('contact','Human contact office hours / 人工联系时间', 'Contact '.SUPPORT_EMAIL.'. WeChat: lumichan_china. Mon-Fri 08:30-16:00; Sat-Sun 09:00-13:00, China time (UTC+8). These are office hours, not a guaranteed response time. WhatsApp is not currently offered.', '人工邮箱：'.SUPPORT_EMAIL.'。微信：lumichan_china。周一至周五 08:30–16:00，周六至周日 09:00–13:00，中国时间。此为接待时间，不承诺具体回复时限；暂不使用 WhatsApp。','/traveler/contact');
    foreach(support_query('SELECT * FROM support_knowledge ORDER BY updated_at DESC LIMIT 200')->fetchAll() as $row) {
        $entries[$row['id']]=$row+['locked'=>false,'source'=>''];
        $entries[$row['id']]['published']=(bool)$row['published'];
    }
    return $entries;
}
