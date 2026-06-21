# 架构与技术栈

## 总体形态:静态优先 + 少量 on-demand 端点

站点主体由 Astro 在构建期生成静态 HTML。需要运行时(运行代码)的只有两处:**Keystatic 的 admin 路由**(`/keystatic`,编辑内容)和**表单提交端点**(`POST /api/lead`)。这两者由 `@astrojs/cloudflare` adapter 提供的 Cloudflare 运行时承载。绝大多数页面访问仍是纯静态 CDN 命中。

```
┌──────────────────────────────────────────────────────────────┐
│  内容发布流(Content Publishing)                              │
│                                                              │
│  编辑者 ──>/keystatic UI(GitHub OAuth 登录)                   │
│                  │                                           │
│                  ▼  保存                                      │
│        Keystatic 写入 src/content/**/*.md ──> commit 到 main   │
│                                                    │          │
│                          Cloudflare Pages 监听 push           │
│                                                    ▼          │
│                       Astro 重建静态站点 → 部署到全球边缘      │
│                       (主题 ProCleaning 的页面读取同一份内容)  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  表单提交流(Lead Capture)                                    │
│                                                              │
│  访客 ──> 主题 contacts 页 <form POST> ──> /api/lead          │
│                                              │               │
│              Pages Function(校验 + Turnstile)│               │
│                            ┌─────────────────┴──────────┐    │
│                            ▼                            ▼    │
│   Gmail SMTP 中转 → 销售收件箱(线索存档)   自动确认信 → 客户邮箱 │
└──────────────────────────────────────────────────────────────┘
```

---

## 分层

### 1. UI 主题:ProCleaning(免费)

**为什么用它**
- 免费、Astro 6 + Tailwind 4 + DaisyUI,自带企业站所需页面(home/service+detail/team+detail/blog+detail/contacts/404/500)。
- **内容已是 Content Collections**(`src/content.config.ts`:`blog`/`service`/`team`,glob loader,`.md`/`.mdx`),意味着接入 Keystatic 是"对齐 schema"而非"重构内容",成本最低。
- 自带 SEO/性能基建(sitemap、OG、JSON-LD、PWA、Lighthouse 99+)。

**改造点(本方案对主题做的增量)**
- 法语化:所有 UI 文案、布局字符串、组件文案翻成法语;`<html lang="fr">`。
- 接入 Keystatic(见 `cms-keystatic.md`)。
- 加 `@astrojs/cloudflare` adapter,部署目标 Cloudflare。
- 把 contacts 页的静态表单换成法语表单 + Function + Gmail SMTP(见 `form-notification.md`)。
- (增强)把 blog 的内嵌 `category:{slug,title}` 升级为独立 `categories` collection + relationship。

### 2. CMS:Keystatic(GitHub 模式,直推 main)

**工作原理(与主题正交)**
- Keystatic 是一层"可视化编辑器 + schema",它把内容写成 `.md` 文件放进 `src/content/**`,由 Astro Content Collections 读取。
- `keystatic.config.ts` 的 collection `path` 直接指向主题已有的内容目录(如 `src/content/blog/*`),实现"编辑同一份内容"。

**关键配置事实**
- 用 `fields.mdx({ extension: 'md' })` 写 `.md`,对齐主题的 `pattern: '**/*.{md,mdx}'`。
- GitHub 模式:编辑者经 OAuth 登录,保存即 commit,**直推 `main`** —— 这才是"无感发布"。
- 需要 adapter(Prerequisites: "An existing Astro project with an adapter configured")—— 由 `@astrojs/cloudflare` 满足。

### 3. 托管:Cloudflare Pages

- Pages 项目连接 GitHub 仓库;`main` 触发生产构建。
- 构建命令 `npm run build`,输出 `dist/`(Cloudflare adapter 模式下产出含 Functions 的 `_routes.json`)。
- Pages Functions 与站点同源;`/keystatic` 与 `/api/lead` 均在 Cloudflare 运行时。

### 4. 表单:Pages Function + Gmail SMTP

- `functions/api/lead.ts` 接收法语表单 POST → 服务端校验 → Cloudflare Turnstile 防 spam → Gmail SMTP 发两封邮件(线索给销售、确认信给客户)。
- 零外部依赖:不用 Resend/WhatsApp。
- 详见 `form-notification.md`。

---

## 部署模型

| 项 | 值 |
|---|---|
| 源仓库 | GitHub 私有仓库(fork 自 ProCleaning) |
| 托管 | Cloudflare Pages |
| adapter | `@astrojs/cloudflare` |
| 构建命令 | `npm run build` |
| 输出 | `dist/`(含静态资源 + Functions) |
| 触发 | `main` push → 生产部署 |
| 运行时端点 | `/keystatic`(Keystatic admin)、`/api/lead`(表单) |

**环境变量(Cloudflare 加密 secret)**
- `GMAIL_USER`、`GMAIL_APP_PASS`、`TURNSTILE_SECRET`、`PUBLIC_TURNSTILE_SITE_KEY`
- Keystatic GitHub 模式所需:`KEYSTATIC_GITHUB_CLIENT_ID`、`KEYSTATIC_GITHUB_CLIENT_SECRET`、`KEYSTATIC_SECRET`(详见 `cms-keystatic.md` 与 Keystatic 官方 connect-to-github 文档)。

## 法语单语约束

- `<html lang="fr">`,不引入 Astro i18n 多语言路由。
- 所有面向访客的字符串(UI 文案、邮件模板、字段示例、表单标签与校验提示)均为法语。

## 关于 on-demand 渲染的说明(架构约束)

Keystatic admin 与表单 Function 需要 Cloudflare 运行时,因此项目**不是 100% 静态**,而是"静态优先 + 少量 on-demand 端点"。这是方案的有意取舍:换来 Keystatic 的可视化编辑与表单后端。绝大多数访客访问的页面(首页、service、blog、详情)仍是构建期静态 HTML,性能与 SEO 不受影响。

## 实测适配要点(已落地于 astro.config / 部署链路)

以下两条是接入 `@astrojs/cloudflare` v13 + Astro 6 时**实测踩到并已解决**的点,记此备查:

1. **`prerenderEnvironment: 'node'`(开发体验必需)**
   - adapter v13 默认用 Cloudflare `workerd` 运行时预渲染静态页;但部分依赖(`debug`、`swiper` 等)是 CommonJS,在 workerd 下报 `module is not defined`,导致 dev 模式静态页 500。
   - 解法:`adapter: cloudflare({ prerenderEnvironment: 'node' })`。静态页改用 Node 运行时预渲染;on-demand 路由(Keystatic admin / 表单)仍走 workerd,与生产一致。
   - 实测:首页 / blog / service / team / contact / keystatic 全部 200,生产 `astro build` 同样成功。

2. **`nodejs_compat` 经部署 flag 传入(不放 `wrangler.jsonc`)**
   - Keystatic admin 运行时依赖 Node 的 `tty`/`util`,Workers 需开启 `nodejs_compat`。
   - ⚠️ **不能在仓库根放 `wrangler.jsonc` 声明它** —— 实测 `wrangler.jsonc` 的存在会触发 adapter 与 vite 的交互,build 报 `Could not resolve "virtual:keystatic-config"`。
   - 解法:部署时用 `wrangler deploy --compatibility-flag nodejs_compat` 传入(见 `deployment-isolated-environment.md` §4.2)。

