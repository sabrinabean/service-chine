# 隔离环境部署(新 GitHub 账户 + 新 Cloudflare 账户,本机零影响)

> 目标:把 service-chine 部署到**另一套 GitHub + Cloudflare 账户**,而**本机现有的 `scalaview` 登录(GH_TOKEN)、wincred 凭证缓存、wrangler 全局登录态全部不动**。

## 部署链路总览

```
新 GitHub 账户(A)名下仓库 service-chine
   ▲
   │ 本机用 A 的 PAT,HTTPS push(PAT 嵌进 remote URL,绕开 wincred)
   │
本机(现有 scalaview 环境完全不动)
   │ push 到 A 的仓库后,触发 GitHub Action(远端 runner)
   ▼
GitHub Action: cloudflare/wrangler-action
   │ 读仓库 secret 里的 CF API Token
   ▼
另一个 Cloudflare 账户(B)的 Pages
```

两条关键隔离原则,贯穿全程:

1. **本机永不 `wrangler login`** —— Cloudflare 操作全部交给 GitHub 远端的 Action,本机不产生任何 CF 登录文件。
2. **本机推送用"嵌进 remote URL 的 PAT"** —— 绕开 wincred 按 host 缓存凭证的机制,不覆盖现有 `github.com` 凭证。

---

## 一、账户与仓库准备(在新 GitHub 账户 A 里操作)

1. 在新账户 A 下创建仓库 `service-chine`(私有)。
2. 在 A → Settings → Developer settings → **Personal access tokens** 生成 PAT:
   - Fine-grained PAT(推荐):仅授权 `service-chine` 仓库,权限 `Contents: Read and write`。
   - 或 Classic PAT:`repo` scope。
   - **复制保存 PAT(只显示一次)**。
3. 本机首次推送(见下节"凭证隔离")。

## 二、GitHub 凭证隔离(本机零影响的核心)

### 为什么不能直接 push

本机现状(实测):
- `credential.helper` = **wincred**(Windows 凭据管理器),按 `github.com` 这个 host 缓存凭证。
- wincred 里 `github.com` 已缓存现有 `scalaview` 的凭证。

直接 `git push` 到 A 的仓库时,git 会优先用 wincred 里 scalaview 的凭证 → 对 A 的仓库无权限 → **403**;若强行改 wincred 存 A 的 token,又会让你现有 scalaview 项目推送串号。**两种都是"破坏现有环境"。**

### 解法:把 PAT 嵌进本项目的 remote URL

git 看到 URL 里的凭证就不再查 wincred,wincred 保持原样。

```bash
cd /home/scalaview/projects/service-chine
git init
# Git 身份只设项目级,不动全局
git config --local user.name  "service-chine"
git config --local user.email "<新账户A的提交邮箱>"

# PAT 嵌进 remote URL(把 <PAT> 换成 A 的 token)
git remote add origin https://<PAT>@github.com/<账户A>/service-chine.git

git add . && git commit -m "init" && git branch -M main
git push -u origin main
```

**安全注意**
- PAT 落在项目 `.git/config`(本地磁盘)。**绝不提交、绝不截图分享**。PAT 可随时吊销、可限单仓库,比密码安全,但仍需保管。
- 若担心误提交,可改用项目级 `insteadOf` 让本地 remote 保持"干净 URL"形态:
  ```bash
  git config --local http."https://github.com/".insteadOf "https://<PAT>@github.com/"
  ```
  这样 `origin` 写 `https://github.com/<A>/service-chine.git`,实际请求自动替换带 token。

### 为何不会破坏现有环境

| 现有环境项 | 是否被触碰 |
|---|---|
| wincred 里 `github.com` 的 scalaview 凭证 | ❌ 不动(URL 带 token,不查 wincred) |
| 全局 git user.name/email | ❌ 不动(只设了 `--local`) |
| `GH_TOKEN`(scalaview 登录) | ❌ 不动(本项目走 HTTPS,不用 gh) |
| 全局 `~/.ssh`、`~/.gitconfig` | ❌ 不动 |

---

## 三、Cloudflare 账户 B 的资源准备(全在网页 Dashboard,本机不碰)

1. 登录**另一个 Cloudflare 账户 B**。
2. B → My Profile → API Tokens → Create Token → 选 **"Edit Cloudflare Workers"** 模板(覆盖 Pages/Workers/Functions 部署权限)。复制 Token(只显示一次)。
3. 记下 B 的 **Account ID**(Dashboard 右侧可见)。
4. 在 B 创建 **Pages 项目**:先建空项目(不连仓库,由 Action 推送产物),项目名如 `service-chine`。

> 这些操作全部在浏览器里完成,**本机不 `wrangler login`、不生成 `~/.config/.wrangler`** —— 这是"本机零影响"的关键。

## 四、GitHub Action:远程部署(双触发:push 自动 + 手动)

### 4.1 仓库 Secrets(在 A 仓库 Settings → Secrets and variables → Actions)

| Secret 名 | 值 | 用途 |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | B 账户的 API Token | wrangler-action 部署鉴权 |
| `CLOUDFLARE_ACCOUNT_ID` | B 的 Account ID | wrangler-action 定位账户 |
| `GMAIL_USER` | 销售 Gmail 地址 | 运行时表单发信(也可改放 Pages 环境变量) |
| `GMAIL_APP_PASS` | Gmail App Password | 运行时表单发信 |
| `TURNSTILE_SECRET` | Turnstile Secret Key | 表单防 spam |
| `PUBLIC_TURNSTILE_SITE_KEY` | Turnstile Site Key | 前端(非敏,也可放明文) |

> 运行时 secret(GMAIL_* / TURNSTILE_*)既可放 GitHub secret 由 Action 注入,也可直接放 Cloudflare Pages → Settings → Environment variables。**二选一,不要两边都放导致混淆**。推荐放 Pages 环境变量(Action 只管构建部署,不掺业务密钥)。

### 4.2 工作流文件 `.github/workflows/deploy.yml`

> 双触发:`push` 到 `main` 自动部署(实现"无感发布");保留 `workflow_dispatch` 手动重跑开关。
>
> **部署目标用 Cloudflare Workers**(官方对新项目的推荐;非旧 Pages)。Astro 6 + `@astrojs/cloudflare` adapter 构建后产出 `dist/client`(静态资产)+ `dist/server`(含 adapter 生成的 `wrangler.json` 与 `entry.mjs`),用 `wrangler deploy` 部署。
>
> **`nodejs_compat` 必须开启**:Keystatic admin 运行时依赖 `debug` 包(间接引入 Node 的 `tty`/`util`),Cloudflare Workers 默认不提供这些内置模块。**注意:不能在项目根放 `wrangler.jsonc` 来声明它** —— 实测 `wrangler.jsonc` 的存在会触发 `@astrojs/cloudflare` adapter 与 vite 的交互问题,导致 build 报 `Could not resolve "virtual:keystatic-config"`。因此改为**部署时用 `--compatibility-flag nodejs_compat` 传入**(wrangler CLI 原生支持该参数,见下)。

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]        # ← Keystatic 保存即 commit main,自动触发 = 无感发布
  workflow_dispatch:        # ← 手动重跑开关(Actions 页面点 Run workflow)

# 同一时间只跑一条部署,避免并发覆盖
concurrency:
  group: workers-deploy
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - run: npm ci

      - name: Build (Astro + Cloudflare adapter)
        run: npm run build

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          # wrangler deploy 自动读取 adapter 生成的 dist/server/wrangler.json。
          # nodejs_compat 由 CLI 参数传入(不在仓库放 wrangler.jsonc,避免破坏 build)。
          command: deploy --compatibility-flag nodejs_compat
```

> 说明:`wrangler deploy` 自动发现 adapter 生成的 `dist/server/wrangler.json`(`main: entry.mjs`、`assets.directory: ../client`)。`nodejs_compat` 经 CLI flag 注入。若将来 adapter 修复了 `wrangler.jsonc` 的 vite 解析问题,可改回在仓库声明。

### 4.3 为何不破坏本机环境

- 部署全程在 **GitHub 远端 runner** 跑 → 本机不 `wrangler login`、不写 `~/.config/.wrangler`。
- 本机现有 wrangler 全局登录态(绑现有 CF 账户)**完全不动**。
- CF API Token 在远端 secret,从不到本机。

---

## 五、Keystatic GitHub 模式的账户一致性约束 ⚠️

Keystatic 保存 = 直接 commit 到本仓库 main,需要一个 **GitHub OAuth App**。一致性要求:

- OAuth App 建**在新账户 A 名下**(A → Settings → Developer settings → OAuth Apps)。
- Callback URL = `https://<你的域名>/api/keystatic/github/oauth/callback`。
- 授权范围:该仓库的 `repo` / Contents write。
- **编辑者用账户 A 登录 Keystatic**(不是 scalaview)。

三者必须同账户:**仓库在 A 名下 + OAuth App 在 A 名下 + 编辑者用 A 登录**,否则 Keystatic 无法写仓库。Keystatic 相关 secret(`KEYSTATIC_GITHUB_CLIENT_ID` / `CLIENT_SECRET` / `KEYSTATIC_SECRET`)放 **Cloudflare Pages 环境变量**(Keystatic admin 跑在 Pages 运行时)。

---

## 六、与"无感发布"的关系(为何 push 自动触发是必要的)

- Keystatic 保存 → commit `main` → 触发 `on: [push]` → Action 自动部署 → 站点更新。
- 这是"无感发布"成立的链路。**不要只留 workflow_dispatch**,否则编辑者改完内容不会自动上线,需人工点 workflow。
- `workflow_dispatch` 作为补充:需要重跑/重部署时手动触发。

---

## 七、失败排查(常见但不破坏环境)

| 现象 | 原因 | 处理(均不影响现有环境) |
|---|---|---|
| push 报 403 | wincred 串号用了 scalaview 凭证 | 确认 remote URL 里带了 A 的 PAT;或用 `insteadOf` |
| Action 报鉴权失败 | CF API Token 权限不足 | 用 "Edit Cloudflare Workers" 模板重发 Token |
| Pages 部署成功但表单不工作 | 运行时 secret 未注入 | 确认 GMAIL_*/TURNSTILE_* 在 Pages 环境变量里 |
| `/keystatic` 登录后写不了 commit | OAuth App 账户与仓库账户不一致 | OAuth App、仓库、编辑者三者都用账户 A |
