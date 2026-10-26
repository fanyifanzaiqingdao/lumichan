# Lumichan 客服中心（dev）

## 入口与权限

- 网站 `/traveler` 右下角 Ask Lumichan：快捷知识问答、DeepSeek 识别问题、人工接待、可选联系邮箱、删除会话。
- 员工 `/support`：会话列表、查找与分页、完整记录、人工接管/回复/结束、访问记录、知识库、接入状态。
- 现有 `/admin` 登录后点击「客服中心」可用管理员身份进入。
- 企业邮箱需验证码登录，不是输入邮箱即可访问。验证通过的 `@lumichan.com.cn` 成员可查看。默认仅 `jin.lu@lumichan.com.cn` 可回复；管理员可维护知识库及删除记录。
- 员工会话有效期 8 小时。离职邮箱立即加入 `support_disabled_emails`，已有登录也会失效。共享管理员密码应妥善保管。

## 宝塔部署

1. 使用 **dev** 构建 `npm run build:dev`，上传 `dist-dev` 内文件到测试站点。不要覆盖正式站。现有 `api/config.php`、上传文件、`api/data/homepage.live.json` 必须保留。
2. 在测试站数据库导入 `api/support-schema.sql`（新增 6 张 `support_*` 表，不删除原有业务表）。数据库账号需具有对应表的读写/删除权限。
3. PHP 8.2+ 启用 `pdo_mysql`、`mbstring`、`curl`、`openssl`。整站 HTTPS。宝塔伪静态保留 SPA 路由 `try_files $uri $uri/ /index.html;`，PHP `/api/*.php` 仍须交给 PHP 执行，不能返回 index.html。
4. 在服务器现有 `api/config.php` 添加下列字段（不要把真实密钥放进 Git 或前端 `.env`）：

```php
'support_enabled' => true,
'deepseek_api_key' => '', // 或配置 PHP 进程环境变量 DEEPSEEK_API_KEY
'deepseek_support_model' => 'deepseek-flash',
'support_daily_ai_limit' => 200,
'support_public_url' => 'https://test.lumichan.com.cn',
'support_wecom_webhook' => '',
'support_reply_emails' => ['jin.lu@lumichan.com.cn'],
'support_disabled_emails' => [],
```

5. 沿用现有 `send_mail`、`smtp_host`、`smtp_port`、`smtp_secure`、`smtp_user`、`smtp_pass`、`from_email` 配置，用真实企业邮箱接收验证码验收。`send_mail=false` 时不能使用邮箱验证码，但现有管理员入口仍可用。管理员密码必须使用强密码，不得保留示例默认值。本地忽略文件 `public/api/config.php` 是隔离数据库测试配置，**不得上传到宝塔**；请在服务器原配置上补充字段。
6. 宝塔「计划任务 → Shell 脚本」，每 5 分钟执行（替换站点目录与实际 PHP 路径）：

```sh
/www/server/php/82/bin/php /www/wwwroot/test.lumichan.com.cn/api/support-maintenance.php
```

任务删除到期会话及关联消息/访问记录/联系方式，并重试失败通知（最多 5 次、间隔至少 5 分钟）。必须监控任务是否成功。接口即时隐藏到期会话，物理删除最迟在下一次成功清理时完成。不要用网页请求执行此脚本。

7. Nginx 禁止下载 `/api/*.sql`、`/api/data/`、备份文件和 `.env`；PHP 源码不能以静态文件下载。不要对客服接口做 CDN 缓存。配置数据库备份的独立保留和删除策略。

## 企业微信通知与回复

在允许添加群机器人的企业微信群创建机器人，把其 HTTPS Webhook 保存到 `support_wecom_webhook`。仅允许官方 `qyapi.weixin.qq.com` 地址。创建人工待接待任务时通知群；后续人工会话新消息至少间隔 5 分钟再次提醒。

通知仅携带会话编号和登录链接，不发送客户消息/邮箱。员工在企业微信里点击链接，登录手机工作台并回复，回复会回到访客网页。**在企业微信群里直接打字不会同步到网页**；原生微信客服/企业微信会话双向接口不在本版范围。未配置或发送失败会在会话详情显示，不会标成通知成功。

## 回答规则与知识库

- DeepSeek 只选择已发布知识条目，不直接编造给访客看的价格、政策。实现依据 [DeepSeek Chat Completions](https://api-docs.deepseek.com/api/create-chat-completion/) 和 [JSON Output](https://api-docs.deepseek.com/guides/json_mode/)。模型可在服务器配置中更换。
- 首页已确认服务、价格与退款政策同步为锁定条目；管理员新增的中英文知识可存草稿或发布。草稿不会送给模型或访客。
- 没有密钥、达到每日上限（UTC 自然日）、API 超时/异常、知识未覆盖或要求人工时，转入人工队列；快捷问题不调用模型。
- 人工接管立即暂停自动回答。退款起算、提前天数与部分退款计算仍未确认，不能由 AI 判断；仅展示已批准一般条款，个案转人工。
- 五天规划支持采用第一价格档 USD 99，区间为 1–5 天 / 6–10 天；不代表整段旅程总价。
- 人工时间：周一至周五 08:30–16:00，周六至周日 09:00–13:00，中国时间。接待时间不等于承诺回复时限。暂不提供 WhatsApp。

## 数据与限制

- 暂按**创建会话起 30 天**保留，新消息不会延长。若业务需要按最后活跃时间，需明确调整政策与实现。
- 原始聊天仅存 MySQL；浏览器只保留会话编号、访问令牌和过期时间，不缓存完整聊天。访问令牌不要分享；共享设备应删除会话。
- 发给 DeepSeek 前尝试移除邮箱和长号码，但不承诺彻底匿名。访客需主动勾选 AI 处理同意；联系邮箱字段不送给模型。
- 网页聊天记录与邮件/企业微信/数据库备份分别管理，清理脚本不能删除第三方服务记录。上线前负责人需复核隐私告知、服务商数据处理条款和备份策略。
- 本版纯文本，未开放附件；访客需使用原浏览器返回会话，未实现跨设备找回。邮箱回信也不会自动导入网页。AI 没有预订/支付/退款执行权限。
- 访客每 IP 每小时最多 60 次写入、5 个新会话；已有消息达到 400 条时停止访客继续发送并提示转邮件，人工仍可处理已有会话。验证码最多 5 次尝试，10 分钟有效，发送受邮箱与 IP 限流。

## 验收

本地自动测试使用独立临时数据库，禁止连接生产库。运行 `php tests/support-unit.php`、`node tests/support-integration.mjs`（需要本地测试服务，脚本内有环境变量说明）、`npm run build:dev`。

上线后仍须用真实配置验证：企业邮箱验证码送达、DeepSeek 返回、企业微信通知与链接、计划任务删除、HTTPS 下访客到人工双向回复。后台「已配置」只代表填写配置，不代表服务已连通。
