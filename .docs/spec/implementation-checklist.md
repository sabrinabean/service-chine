# 实施清单(可直接照做的落地计划)

> 基于 ProCleaning 主题的真实结构,分 6 个阶段。每个阶段以**可验证的闭环**为终点,验证通过再进下一阶段。

---

## 阶段 0:前置准备(新账户隔离,本机零影响)

> 详细隔离原理与脚本见 [`deployment-isolated-environment.md`](./deployment-isolated-environment.md)。

**动作**
- [ ] 在 **新 GitHub 账户 A** 下:fork `anastasiiaxfr/ProCleaning` → 重命名为 `service-chine`(私有)。
- [ ] 账户 A → Settings → Developer settings → 生成 **Fine-grained PAT**(仅授权 `service-chine`,`Contents: Read and write`)。
- [ ] 本地 `git clone` 后 `npm install`(需 Node ≥ 22.12);`npm run dev` 跑通主题原版。
- [ ] 本机 Git 配置(**项目级,不碰全局**):
      `git config --local user.name`、`user.email`,并把 remote 设为 `https://<A的PAT>@github.com/<A>/service-chine.git`(PAT 嵌 URL 绕开 wincred)。
- [ ] 准备专用 Gmail → 开两步验证 → 生成 **App Password**。
- [ ] 在 **新 Cloudflare 账户 B** 里(全在网页 Dashboard):创建空 **Pages 项目** `service-chine`;记下 **Account ID**;生成 **CF API Token**("Edit Cloudflare Workers" 模板)。
- [ ] 账户 B 创建 **Turnstile** 站点,记录 Site Key 与 Secret。
- [ ] (Keystatic 用)在 **账户 A** 建 **OAuth App**,Callback URL = `https://<域名>/api/keystatic/github/oauth/callback`。

**验证**:fork 已 clone、本地原版可跑;本机 `git push` 到 A 的仓库成功且**未改动** wincred/GH_TOKEN/全局 git 配置(用 `git config --global --list` 前后对比);CF Pages 空项目存在。

---

## 阶段 1:法语化 + 部署闭环(经 GitHub Action)

**动作**
- [ ] `src/layouts/*` 与所有页面/组件:加 `<html lang="fr">`,把 UI 文案翻成法语(导航、按钮、footer、占位符等)。
- [ ] 把 demo 内容(blog/service/team 的 `.md`)换成真实法语占位内容。
- [ ] `astro.config.mjs` 的 `site` 改成你的域名,加 `@astrojs/cloudflare` adapter。
- [ ] 建仓库 Secrets(`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`),提交 `.github/workflows/deploy.yml`(见 `deployment-isolated-environment.md`)。
- [ ] 推 `main` → 触发 GitHub Action → 远端构建并部署到 CF 账户 B 的 Pages → 线上访问看到法语站。

**验证**:线上站点全法文;原版的 service/blog/team 页面结构与样式完好;Action 在 GitHub 远端跑通且**本机未 wrangler login**。

---

## 阶段 2:接入 Keystatic(本地闭环)

**动作**
- [ ] `npx astro add react markdoc`
- [ ] `npm install @keystatic/core @keystatic/astro @astrojs/cloudflare`
- [ ] 改 `astro.config.mjs`:加 `adapter: cloudflare()` 与 `integrations` 里加 `react(), markdoc(), keystatic()`(详见 `cms-keystatic.md`)。
- [ ] 新建 `keystatic.config.ts`,先用 **`storage.kind: 'local'`** + 对齐 service/team 两个 collection(先不动 category)。
- [ ] `npm run dev` → 访问 `/keystatic` → 能看到 `Services`/`Équipe`。
- [ ] 在 UI 里编辑一条 service,保存 → 检查 `src/content/service/*.md` 被正确写入 → 主题页面能读取显示。

**验证(关键)**:Keystatic 写出的 `.md` 能被主题页面正确渲染(title/description/image/正文都对)。**这一步通过即证明 schema 对齐成功。**

---

## 阶段 3:categories 改造 + blog 接入

**动作**
- [ ] 新增 `categories` collection(见 `cms-keystatic.md`),在 `src/content/categories/` 建几条法语分类。
- [ ] 改 `src/content.config.ts`:blog 的 `category` 由 `z.object({slug,title})` 改为 `z.object({ slug: z.string() })`(引用 categories 的 slug)。
- [ ] 改 `keystatic.config.ts`:blog 的 `category` 用 `fields.relationship({ collection: 'categories' })`。
- [ ] 改主题渲染处:凡是读 `category.title` 的页面/组件,改为「按 slug 查 `categories` collection 取 title」。
- [ ] 把现有 blog 的 `.md` frontmatter 里 `category` 改为 slug 字符串对齐新结构。
- [ ] `/keystatic` 里编辑一篇 blog → 选 `Catégorie` → 保存 → 主题 blog 页正确显示分类。

**验证**:新建/编辑 blog 时能从下拉选分类;前台 blog 详情、列表、分类筛选都正确。

---

## 阶段 4:表单 + Gmail SMTP 闭环

**动作**
- [ ] 改主题 contacts 页表单:`action="/api/lead"`、法文字段、蜜罐、Turnstile(见 `form-notification.md`)。
- [ ] 新建 `src/pages/merci.astro`(法语致谢页)。
- [ ] 新建 `functions/api/lead.ts`:校验 + Turnstile + Gmail SMTP(`cloudflare:sockets`)。
- [ ] Cloudflare 加密环境变量:`GMAIL_USER`、`GMAIL_APP_PASS`、`TURNSTILE_SECRET`、`PUBLIC_TURNSTILE_SITE_KEY`。
- [ ] 本地 `wrangler pages dev` 测一次提交。

**验证(端到端)**:线上表单提交 → 销售 Gmail **真收到**线索邮件 → 客户邮箱**真收到**法语确认信 → 蜜罐/Turnstile 拦掉机器人。

---

## 阶段 5:Keystatic 上线(GitHub 模式)

**动作**
- [ ] `keystatic.config.ts` 的 `storage.kind` 从 `'local'` 切到 `'github'`,填 `repo`。
- [ ] Cloudflare 加密环境变量:`KEYSTATIC_GITHUB_CLIENT_ID`、`KEYSTATIC_GITHUB_CLIENT_SECRET`、`KEYSTATIC_SECRET`。
- [ ] 推 `main` → 部署 → 访问线上 `/keystatic` → GitHub OAuth 登录成功。

**验证(无感发布闭环)**:线上 `/keystatic` 新建一条法语 service → 保存 → 自动 commit 到 `main` → Cloudflare 重建 → 线上对应页面出现(约 30s–2min)。

---

## 阶段 6:打磨

**动作**
- [ ] SEO:法语 `title`/`description`、OG、sitemap、`robots.txt`(主题已自带,核对法文化与域名)。
- [ ] 性能:图片优化(`astro:assets`)、字体、Lighthouse 核心指标。
- [ ] 可访问性:法语 `aria-label`、表单错误提示、键盘可达。
- [ ] 404/500 页(主题自带,核法文化)。
- [ ] 记录账号/secret/构建配置的操作步骤(放仓库外或受限处,不含明文 secret)。

**验证**:Lighthouse 关键指标达标;表单错误路径给法语提示;控制台无报错;`/keystatic` 与 `/api/lead` 在线上 Cloudflare 运行时正常。

---

## 风险与未来增强(非本阶段)

- **品牌域名发件**:需 `noreply@<domain>` 时切 Resend + 配 SPF/DKIM/DMARC,仅改 Function。
- **线索数据库化**:需长期存档/统计/CRM 时接 Cloudflare D1 或 HubSpot。
- **内容审核工作流**:需发布前审核时 Keystatic 切 PR 模式(`branchPrefix: 'keystatic/'`)。
- **高发送量风控**:咨询量大时把 Gmail SMTP 换 Resend 以避开 Google 风控。
- **categories 多级**:未来需子分类时,在 categories collection 加 `parent` relationship。
