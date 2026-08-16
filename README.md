# Lumichan Web

Vite + React 静态站点（无真实 AI 逻辑），可部署到腾讯云宝塔。联系表单由宝塔 PHP 小脚本接收。

## 本地开发

```bash
cd lumichan-web
npm install
npm run dev
```

浏览器打开终端提示的本地地址（一般是 http://localhost:5173 ），首页路由为 `/traveler`。

本地 Vite **不会跑 PHP**。要测联系表单：先部署到宝塔，或把 `VITE_CONTACT_API` 指到线上 `/api/contact.php`。

## 打包

```bash
npm run build
```

产物在 `dist/`（含 `dist/api/contact.php`）。

## 部署到宝塔

1. 宝塔 → 网站 → 添加站点（域名或 IP）
2. 根目录例如：`/www/wwwroot/lumichan.com`
3. 上传 `dist/` 全部文件
4. 在服务器上：

```bash
cd /www/wwwroot/lumichan.com/api
cp config.example.php config.php
# 编辑 config.php：改 to_email / from_email
```

5. 网站设置 → 配置文件，确保类似（`.php` 走 PHP，`/api/data` 禁止访问，其余 SPA）：

```nginx
location ^~ /api/data/ {
  deny all;
}

location = /api/config.php {
  deny all;
}

location ~ \.php$ {
  # 宝塔原有 PHP 配置保持不动
  include enable-php-xx.conf;  # 以面板实际为准
}

location / {
  try_files $uri $uri/ /index.html;
}
```

6. 保存并重载 Nginx；申请 SSL

### 邮件说明

- 留言会写入 `api/data/submissions.jsonl`（即使邮件失败也算成功）
- `send_mail => true` 时调用 PHP `mail()`；宝塔可装「邮件服务器」或改用外部 SMTP
- 收件箱看 `config.php` 的 `to_email`

## 简易后台（产品 + 向导 · MySQL）

地址：`/admin`

### 宝塔配置步骤

1. 宝塔 → 数据库 → 创建库（如 `lumichan`）和用户，记下密码  
2. 上传 `dist/` 后，复制：

```bash
cd /www/wwwroot/你的站点/api
cp config.example.php config.php
# 编辑 config.php：admin_password、db_name、db_user、db_pass
```

3. 导入表结构：phpMyAdmin / 宝塔「导入」执行 `api/schema.sql`  
   （或直接跑迁移脚本，也会建表）

4. 导入初始数据（各打开一次）：

```
https://你的域名/api/migrate-products.php?token=你的admin_password
https://你的域名/api/migrate-guides.php?token=你的admin_password
```

如需清空重导：加 `&force=1`

5. 打开 `https://你的域名/admin` 登录管理

### 能力

**产品**

- 创建 / 编辑 / 删除  
- 一键上架 / 下架  
- 前台 `/traveler/itineraries` 只显示已上架  

**向导（同原站逻辑）**

- `/guide` 申请 → MySQL `guides`，`status=pending`，文件存 `/uploads/guides/...`  
- 后台审核：通过 / 拒绝 / 改日价与备注 / 删除  
- 前台 `/traveler/guides` 只显示 `approved`  

本地调试 PHP + MySQL：先在本机起 MySQL 并改 `public/api/config.php`，再：

```bash
cd lumichan-web/public && php -S 127.0.0.1:8080
cd lumichan-web && npm run dev
```

## 页面

| 路径 | 说明 |
|------|------|
| `/traveler` | 首页 |
| `/traveler/ai-planner` | 规划展示页（导航已隐藏） |
| `/traveler/guides` | 找向导（读 MySQL approved） |
| `/traveler/itineraries` | 行程列表（读 MySQL API） |
| `/traveler/contact` | 联系表单 → `/api/contact.php` |
| `/guide` | 成为向导 → 写库 pending |
| `/admin` | 产品 + 向导后台 |

## 从线上导出的数据

目录：`data/`（从现网 Supabase 公开接口导出）

| 文件 | 内容 |
|------|------|
| `products.json` | 行程产品（10 条） |
| `guides_public.json` | 向导公开字段（已去掉邮箱/电话） |
| `guides.json` | 向导完整字段（含联系方式，慎用） |
| `site_content.json` | 各页文案 |
| `site_content_by_page.json` | 按页面分组的文案 |

说明见 `data/export_meta.json`。
