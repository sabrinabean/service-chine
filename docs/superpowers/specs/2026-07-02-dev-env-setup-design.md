# Dev Environment Setup 文档设计规格

> 日期：2026-07-02
> 状态：已与用户确认设计，待写实施计划（writing-plans）
> 作者：头脑风暴会话产出

## 1. 背景与项目事实

本项目 `service-chine` 是一个 **Astro 6 静态站点 + Cloudflare 适配器 + Decap CMS** 的内容站点。仓库内含两个独立的 Node 包：

| 位置 | 是什么 | 运行时 |
|---|---|---|
| `/`（根） | Astro 站点（`output: 'static'` + `@astrojs/cloudflare`） | Node |
| `proxy/` | `decap-proxy` Cloudflare Worker，做 Decap CMS 的 GitHub OAuth 中转 | wrangler/workerd |

已核实的关键事实（决定文档内容）：

- `package.json` 的 `engines.node = ">=22.12.0"`；仓库**无** `.nvmrc` / `.node-version` / `packageManager` 字段。
- 包管理器为 **npm**（根与 `proxy/` 各有 `package-lock.json`）。
- 根包脚本：`dev` / `build` / `preview`（均为 astro 命令）。
- **`npm run dev` 在没有 `.env` 时不会崩**：
  - `PUBLIC_TURNSTILE_SITE_KEY` 在 `src/components/homepage/Contacts.astro` 中是"为空则不渲染"的守卫判断，不报错。
  - `PUBLIC_REPO` 仅在 `.github/workflows/deploy.yml`（CI）中使用，源码不消费。
  - `import.meta.env.BASE_URL` 为 Astro 内置常量。
- 原生模块 `sharp@0.34` 在 Node 22 + Windows x64 下有预编译二进制，`npm install` 自动下载。
- 仓库为 **private**，clone 需要 GitHub 账号鉴权。
- 项目文档惯例目录为 **`.docs/`**（`docs/` 当前为空）。

## 2. 目标与非目标

**目标**：从「机器上连 git 都没装」的零状态，一路到 `npm run dev` 能在本地正常启动并预览站点。

**非目标（明确排除）**：

- `proxy/` OAuth Worker 的本地运行与部署
- GitHub OAuth App / Cloudflare 账号 / 部署（wrangler deploy）
- Decap CMS 内容的本地编辑（`local_backend` + `decap-server`）
- 完整 `.env` 凭证配置

> 这些构成"完整轨道"，本文档不覆盖；可在文档末尾以"进一步"链接指向 `.docs/spec/2026-06-21-decap-cms-migration/`。

## 3. 目标环境与读者

- **平台**：Windows 原生（**非** WSL）。
- **终端**：cmd 与 PowerShell 双覆盖，每步给两套命令。
- **读者**：**LLM agent 顺序执行**——要求显式命令、可机器判定的成功标志、无"自行判断"散文、任意状态重入安全。

## 4. 方案选型

采用 **方案 A：每步内嵌幂等三段式（检查 → 安装 → 验证）**。

| 备选 | 取舍 |
|---|---|
| A. 每步内嵌幂等三段式（**采用**） | 检查可见、可复跑、从任意状态重入安全；最适合 LLM。篇幅略长。 |
| B. 单脚本一把梭 | 过程不透明，LLM 难推理/调试；cmd/PS 混用易翻车。**否决。** |
| C. 线性流水线 + 前置体检表 | 步骤里仍需内嵌检查否则不幂等；体检表仅信息性。**否决。** |

## 5. 交付物落点

- **交付物文档**：`.docs/setup/dev-environment.md`（与 `.docs/operation/admin-operation-guide.md` 平级，遵循 `.docs/` 惯例）。
- **本设计规格**：`docs/superpowers/specs/2026-07-02-dev-env-setup-design.md`。
- 语言：中文（与现有运维指南一致）。

## 6. LLM 可读约定（贯穿全文）

1. 每个依赖步骤统一四段：**① 检查（cmd 版 + PowerShell 版）→ ② 若缺则安装 → ③ 验证 → ④ 成功标志（机器可判定）**。
2. 版本判定用显式谓词（如 Node：major>22，或 major==22 且 minor≥12）。
3. cmd 命令用 `>` 前缀代码块，PowerShell 用 `PS>` 前缀代码块，并列展示。
4. 凡 winget 安装改了 PATH 的步骤，强制 **"关闭并重开终端后再次运行验证"** 提示（LLM 易复用旧 shell 环境）。
5. 人工介入点用 **⛔** 醒目标记，给可复制粘贴的原文指令。
6. 全流程**幂等**：从任意中间状态重跑同一段都安全（已存在即跳过安装）。

## 7. 章节与每步技术决策

### Step 0 · 前置体检（信息性，不阻断）

检测项：OS 版本 / 终端类型（PS 还是 cmd）/ `winget`·`git`·`node`·`npm` 的有无与版本。所有检查在工具缺失时**不得报错中断**：PowerShell 用 `Get-Command X -ErrorAction SilentlyContinue`，cmd 用 `where X 2>nul`。目的：让 LLM 知道哪些已满足、可跳过相应章节。

### Step 1 · winget 关卡

- 检查/验证：`winget --version` 能出版本号即通过。
- 缺失 → ⛔ **人工关卡**原文：「打开 Microsoft Store → 搜索 **App Installer**（应用安装程序）→ 安装或更新 → **关闭并重开终端** → 重新运行本步」。
- 离线兜底（脆弱，仅备注）：从 winget-cli GitHub Releases 下 `.msixbundle`，PS 里 `Add-AppxPackage`，并提示需自带 VCLibs / `Microsoft.UI.Xaml` 框架依赖。
- **不自动安装 winget**（事实结论：纯 cmd/PS 自动装 winget 极脆，依赖框架包往往最终仍需 Store）。

### Step 2 · Git

- 包 ID：`Git.Git`
- 安装命令：`winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements`
- 验证：`git --version` 出版本号。
- ⚠️ **装完必须关闭并重开终端**（PATH 生效），在**新终端**里重新 `git --version` 才算成功。
- 附注：Git for Windows 同时装 Git Bash 与 Git Credential Manager（Step 5 需要 GCM）。

### Step 3 · Node.js

- 谓词：**major > 22，或 major == 22 且 minor ≥ 12**（满足 `engines.node >=22.12.0`）。
- 包 ID：`OpenJS.NodeJS.LTS`（当前 LTS 线 ≥ 22.12，满足要求）。
- 缺失：`winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements`
- 已装但版本过低：`winget upgrade --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements`
- 验证：`node -v` 命中上述谓词。
- ⚠️ **必须重开终端**，新终端里重测 `node -v`。

### Step 4 · npm

随 Node 自带，仅 `npm -v` 验证（期望 ≥10）。无安装动作。

### Step 5 · 克隆仓库（private，含凭证持久化）

- **前置**：一个**有此仓库访问权限的 GitHub 账号**（仓库为 private）。
- 默认走 HTTPS：`git clone https://github.com/sabrinabean/service-chine.git`
- 首次 clone 弹出 **Git Credential Manager** 登录窗口 → 浏览器登录 GitHub 授权 → 凭证写入 Windows 凭据管理器 → 此后 push/pull 免再登录。
- 验证 GCM 已就绪（Git.Git 安装即自带）：`git credential-manager --version` 能出版本号；或 `git config --global credential.helper` 显示 `manager`（旧版 `manager-core`）。
- 验证 clone 成功：目录内能看到 `package.json`（clone 成功即鉴权通过、凭证已存）。
- ⚠️ **Windows 路径坑**：克隆目录不含空格/中文（sharp/esbuild 等原生工具链对含空格/Unicode 的 cwd 敏感）。推荐 `C:\dev\service-chine`。
- 兜底（GCM 弹窗失败/无浏览器）：用 **PAT**——GitHub → Settings → Developer settings → Personal access tokens 生成带 `repo` 权限的 token，clone 时用户名填 GitHub 用户名、密码填 token，GCM 会存起来。
- SSH（备选）：需 `ssh-keygen` 生成密钥并加到 GitHub，配置更重，仅作替代方案列出。

### Step 6 · 安装项目依赖

- 进入目录：`cd service-chine`
- 主命令：`npm ci`（有 `package-lock.json`，全新克隆用 ci 最快且可复现）。
- 兜底：`npm ci` 报错（lockfile 不同步等）→ 改 `npm install`。
- 验证：`node_modules\astro` 存在且命令退出码 0。

### Step 7 · 启动 dev server

- 命令：`npm run dev`（= `astro dev`）。
- 成功标志：输出含 `Local:   http://localhost:4321/`（Astro 默认端口）。
- 备注：首次启动较慢（字体/图标缓存），等待 ready；停止用 Ctrl+C。

### Step 8 · 排错清单（收敛项）

1. `winget` / `node` / `npm` 装完仍 "not recognized" → 开**新**终端。
2. sharp 安装失败 → `npm install --foreground-scripts` 看日志；装 VS Build Tools 2022（C++ 桌面工作负载）+ Python；确认 Node 是 x64。
3. 端口 4321 被占 → `npm run dev -- --port 4322`。
4. PowerShell 执行策略拦脚本 → `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`（npm/git 通常用不到，仅兜底）。
5. 公司代理 → `npm config set https-proxy ...` / `git config --global http.proxy ...`。
6. Windows 长路径报错 → `git config --system core.longpaths true`（需管理员）。

## 8. 依赖清单总表（系统级前置）

| 依赖 | 版本要求 | Windows 安装方式 | 验证命令 |
|---|---|---|---|
| winget | 任意（≥v1） | Microsoft Store「App Installer」（⛔ 人工关卡） | `winget --version` |
| Git | 2.x | `winget install --id Git.Git` | `git --version` |
| Node.js | major>22 或 (22 且 minor≥12) | `winget install --id OpenJS.NodeJS.LTS` | `node -v` |
| npm | ≥10（随 Node） | 随 Node 自带 | `npm -v` |
| Git Credential Manager | 随 Git.Git | 随 Git for Windows 自带 | `git credential-manager --version` |

项目 npm 包依赖（根：Astro 6 / React 19 / Tailwind 4 / DaisyUI 5 / MDX / sharp / swiper / Decap CMS；`proxy/`：wrangler 4）由 `npm install`/`npm ci` 拉取，**不在最小轨道安装步骤里**（`proxy/` 包无需安装即可达到目标）。

## 9. 文档验收标准（Definition of Done）

交付物 `.docs/setup/dev-environment.md` 满足：

- 覆盖 Step 0–8 全部章节，每步含「检查 / 安装 / 验证 / 成功标志」四段。
- cmd 与 PowerShell 命令并列给出。
- winget / git / node 安装后均有"重开终端"提示。
- Step 1 winget 缺失为 ⛔ 人工关卡，不尝试自动安装。
- Step 5 含 private 仓库鉴权与 GCM 凭证持久化说明。
- 末尾"进一步"链接到 `proxy/` 与部署相关文档（`.docs/spec/2026-06-21-decap-cms-migration/`）。
- 文档全程幂等：LLM 从任意中间状态进入都能安全推进到 `npm run dev` 成功。
