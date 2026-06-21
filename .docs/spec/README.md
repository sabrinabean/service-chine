# service-chine 企业站点 — 落地执行规格

> 面向海外访客的**法语**企业站点。基于 **ProCleaning** 主题,用 **Keystatic** 做可视化内容编辑(保存即发布),托管在 **Cloudflare Pages**,客户咨询表单通过 **Gmail SMTP** 把线索邮件发到销售邮箱。

## 一句话定位

以免费主题 **ProCleaning**(Astro 6 + Tailwind 4)为 UI 外壳 —— 它的内容已经是 Astro Content Collections(`blog` / `service` / `team`,`.md`/`.mdx`)。我们在此基础上**接入 Keystatic(GitHub 模式)**让编辑者用网页 UI 编辑内容并直推 `main`,加 **Cloudflare adapter + Pages Function** 处理法语咨询表单,**Gmail SMTP** 发送线索邮件。全法文单语站。

---

## 已确定的最终方案(无备选)

| 层 | 选定方案 | 关键事实(已用仓库实测验证) |
|---|---|---|
| UI 主题 | **ProCleaning**(免费) | `astro@^6.4.2`、`tailwindcss@^4.3.0`、`daisyui`、自带 home/service(+detail)/team(+detail)/blog(+detail)/contacts/404/500 |
| 内容结构 | 主题已有的 Content Collections | `src/content.config.ts` 定义 `blog`/`service`/`team`,glob loader,`pattern: '**/*.{md,mdx}'`;blog 已有内嵌 `category:{slug,title}` |
| CMS / 编辑 | **Keystatic**(GitHub 模式,直推 `main`) | `fields.mdx({ extension: 'md' })` 写 `.md`,与主题格式对齐;`@keystatic/astro` integration |
| 托管 | **Cloudflare Pages** | 加 `@astrojs/cloudflare` adapter;`main` push 自动构建 |
| 表单后端 | **Cloudflare Pages Function**(`functions/api/lead.ts`) | 同源,无状态,匹配低咨询量 |
| 表单通知 | **Gmail SMTP 中转**(零外部依赖) | `smtp.gmail.com:587` STARTTLS,发件人=销售 Gmail;不用 Resend/WhatsApp |
| 站点语言 | **法语单语** | `<html lang="fr">`;不引入 i18n |

---

## 需求对账

| 原始需求 | 落地方式 |
|---|---|
| Serverless 部署 | ✅ Cloudflare Pages 全托管,无服务器维护 |
| 日常更新 page | ✅ Keystatic `/keystatic` 网页 UI 编辑 → 直推 `main` → 约 30s–2min 上线 |
| 可划分 categories | ✅ 把主题内嵌的 category 改造为**独立 `categories` collection**,blog/service 用 `relationship` 引用;Astro 自动渲染分类页 |
| 客户表单咨询信息 | ✅ 主题 contacts 页 → 法语表单 + Pages Function → Gmail SMTP → 销售邮箱 |

---

## 文档导航

- [`architecture.md`](./architecture.md) — 整体架构、数据流、分层、ProCleaning 改造点、部署模型
- [`cms-keystatic.md`](./cms-keystatic.md) — `keystatic.config.ts` 完整配置(对齐 ProCleaning)、categories 改造、法语 label、编辑工作流
- [`form-notification.md`](./form-notification.md) — 法语表单、Pages Function、Gmail SMTP、法语邮件模板、contacts 页改造
- [`deployment-isolated-environment.md`](./deployment-isolated-environment.md) — **新 GitHub 账户 + 新 Cloudflare 账户、本机零影响的隔离部署**;GitHub PAT 隔离、wrangler-action 远程部署、双触发 workflow
- [`implementation-checklist.md`](./implementation-checklist.md) — 分阶段落地计划,带命令/文件/验证标准

---

## 始终生效的约束

1. **全法文站** —— 所有面向访客的文案、邮件、字段示例、表单标签与校验提示均为法语。不引入 i18n。
2. **访问者 + 编辑者均在海外** —— Cloudflare Pages / Workers 与 GitHub OAuth 链路稳定可达。
3. **发件人 = Gmail 地址** —— 走 Gmail SMTP 中转,线索邮件与给客户的自动确认信均从销售所用 Gmail 发出。
4. **无数据库** —— 内容在 Git;线索以邮件形式存档于 Gmail 收件箱。
5. **零第三方邮件服务** —— 不用 Resend/WhatsApp;完全靠 Gmail SMTP。
6. **静态优先 + 少量 on-demand 端点** —— Keystatic admin 路由与表单 Function 需要 Cloudflare 运行时(由 `@astrojs/cloudflare` adapter 提供),主体内容仍为构建期静态生成。
7. **隔离部署、本机零影响** —— 部署到**新 GitHub 账户 + 新 Cloudflare 账户**;本机永不 `wrangler login`,Git 推送用"嵌进 remote URL 的 PAT"绕开 wincred,全程不触碰本机现有的 `GH_TOKEN`、wincred 凭证、wrangler 全局登录态。部署经 **GitHub Action 远端 runner**(双触发:`push` 自动 + `workflow_dispatch` 手动),实现无感发布。详见 `deployment-isolated-environment.md`。

---

## 落地前必读的两点可行性结论(已验证)

1. **格式对齐成立**:ProCleaning 内容是 `.md`/`.mdx`,Keystatic 用 `fields.mdx({ extension: 'md' })` 即可写 `.md`,**无需把内容迁移到 Markdoc**。
2. **schema 双向对齐是接入核心**:Keystatic 的 `keystatic.config.ts` 字段必须与 `src/content.config.ts` 逐字段对应(title/description/pubDate/category/author/image 等),否则 Keystatic 写出的文件主题无法读取。详见 `cms-keystatic.md`。
