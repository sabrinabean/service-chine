# Dev Environment Setup 文档实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 产出 `.docs/setup/dev-environment.md`——一份 LLM 可读的 Windows 原生（cmd + PowerShell）从 0 安装开发环境指南，终点是 `npm run dev` 能本地预览站点。

**Architecture:** 单文件 Markdown 文档，按 Step 0–8 顺序排列。每个依赖步骤统一「检查 → 安装（仅当缺失）→ 验证 → 成功标志」四段结构，cmd 与 PowerShell 双终端并列。采用注释行（`# PS>` / `:: >`）作为终端提示标记，既满足"前缀代码块"约定又保证复制粘贴安全（注释行被执行时无害）。

**Tech Stack:** Markdown；命令覆盖 winget（Git.Git / OpenJS.NodeJS.LTS）、git、npm、astro dev。

## Global Constraints

（逐条来自已确认规格 `docs/superpowers/specs/2026-07-02-dev-env-setup-design.md`）

- Node 谓词：**major>22，或 major==22 且 minor≥12**（满足 `engines.node >=22.12.0`）。
- 平台：**Windows 原生（非 WSL）**；终端 **cmd + PowerShell 双覆盖**。
- 包管理器：**npm**（根与 `proxy/` 各有 `package-lock.json`）。
- 每步四段：**检查 / 安装 / 验证 / 成功标志**。
- 全程**幂等可重入**：从任意中间状态进入都能安全推进。
- 仓库 **private**：clone 需有权限的 GitHub 账号 + Git Credential Manager 凭证持久化。
- winget 缺失为 **⛔ 人工关卡**，**不自动安装** winget。
- winget/git/node 安装后必须提示**重开终端**。
- 交付物落点：**`.docs/setup/dev-environment.md`**；语言：**中文**。
- 非范围：`proxy/` OAuth Worker、Cloudflare 部署、Decap CMS 内容编辑、完整 `.env`（仅在末尾"进一步"链接）。
- 仓库 URL：`https://github.com/sabrinabean/service-chine.git`。
- Astro 默认 dev 端口：**4321**。

**终端块约定（所有任务通用）：** PowerShell 块以注释行 `# PS>` 起头；cmd 块以注释行 `:: >` 起头。这两个标记行在各自 shell 里都是无害注释，复制粘贴安全。每个命令块前用粗体标签 `**PowerShell：**` / `**cmd：**` 标注。

---

### Task 1: 文档骨架 + Step 0 前置体检

**Files:**
- Create: `.docs/setup/dev-environment.md`

**Interfaces:**
- Consumes: 无（首个任务）。
- Produces: 文档头部（标题/适用环境/如何使用/目录）与 Step 0，供后续任务在其后追加 Step 1–8。

- [ ] **Step 1: 创建文件，写入头部与 Step 0**

把下面**整段**内容写入新建文件 `.docs/setup/dev-environment.md`（注意：外层 4 反引号是本计划的展示用包裹，实际写入文件时**不要**包含这层 4 反引号；从 `# service-chine …` 开始写到 Step 0 结束）：

````markdown
# service-chine 开发环境从 0 安装指南（Windows）

本指南让一个 LLM agent 或开发者，从一台**干净的 Windows 机器**（连 git 都没装），一步步装到 `npm run dev` 能在本地预览站点。

## 适用环境

- Windows 10（2004+）或 Windows 11，**原生系统**（非 WSL）。
- 终端：**cmd** 或 **PowerShell** 均可，每步给两套命令。

## 如何使用本文档

- 每个依赖步骤统一四段：**① 检查 → ② 安装（仅当缺失）→ ③ 验证 → ④ 成功标志**。
- PowerShell 命令块以注释行 `# PS>` 起头；cmd 命令块以注释行 `:: >` 起头。这两行是**无害注释**，整块复制进终端即可。
- 看到 ⚠️ **重开终端**：必须**关闭当前终端窗口、新开一个**再继续（安装改了 PATH，旧终端不会刷新）。
- 看到 ⛔：**人工介入**，按原文操作后回到本步重跑。
- 全程**幂等**：从任意中间状态进入都可安全推进——已满足的步骤会自动跳过安装。

## 目录

- [Step 0 · 前置体检（信息性）](#step-0--前置体检信息性)
- [Step 1 · winget 关卡](#step-1--winget-关卡)
- [Step 2 · Git](#step-2--git)
- [Step 3 · Node.js](#step-3--nodejs)
- [Step 4 · npm](#step-4--npm)
- [Step 5 · 克隆仓库（private，含凭证持久化）](#step-5--克隆仓库private含凭证持久化)
- [Step 6 · 安装项目依赖](#step-6--安装项目依赖)
- [Step 7 · 启动 dev server](#step-7--启动-dev-server)
- [Step 8 · 排错](#step-8--排错)

---

## Step 0 · 前置体检（信息性）

**目的**：先看清机器现状。已满足的工具，后续对应步骤可直接跳过。本步**不阻断**——工具缺失不报错、不停下。

**PowerShell：**

```powershell
# PS>
$PSVersionTable.OS
"winget: " + ((Get-Command winget -ErrorAction SilentlyContinue).Source ?? "(missing)")
"git  : " + ((Get-Command git   -ErrorAction SilentlyContinue).Source ?? "(missing)")
"node : " + ($(try { node -v } catch { "(missing)" }))
"npm  : " + ($(try { npm -v  } catch { "(missing)" }))
```

**cmd：**

```cmd
:: >
ver
where winget 2>nul
where git 2>nul
where node 2>nul
where npm 2>nul
```

**成功标志**：体检信息打印出来（无论各项是否存在）。根据结果跳到对应步骤。
````

- [ ] **Step 2: 验证骨架结构**

Run（在仓库根目录）:
```bash
grep -cE "^## (适用环境|如何使用本文档|目录|Step 0)" .docs/setup/dev-environment.md
grep -c "PS>" .docs/setup/dev-environment.md
grep -c ":: >" .docs/setup/dev-environment.md
```
Expected: 第一条 `4`（适用环境/如何使用/目录/Step 0 四个二级标题）；第二、三条各 `≥1`。

- [ ] **Step 3: 提交**

```bash
git add .docs/setup/dev-environment.md
git commit -m "docs: scaffold dev environment setup guide + Step 0 audit"
```

---

### Task 2: Step 1 winget 关卡 + Step 2 Git

**Files:**
- Modify: `.docs/setup/dev-environment.md`（在 Step 0 末尾的 `---` 分隔线之后追加）

**Interfaces:**
- Consumes: Task 1 的文件与分隔线。
- Produces: Step 1、Step 2 章节。

- [ ] **Step 1: 追加 Step 1 与 Step 2**

在文件末尾追加（同样去掉外层 4 反引号包裹）：

````markdown

---

## Step 1 · winget 关卡

后续 Git / Node 都用 winget 安装，所以先确保 winget 可用。

**检查（两终端同一命令）：**

**PowerShell：**

```powershell
# PS>
winget --version
```

**cmd：**

```cmd
:: >
winget --version
```

**若报 "winget 不是识别的命令" → ⛔ 人工关卡：**

> 打开 **Microsoft Store** → 搜索 **App Installer**（应用安装程序）→ 点 **安装** 或 **更新** → 完成后**关闭并重开终端** → 回到这里重新运行本步的检查命令。

> 本文档**不自动安装 winget**：在纯 cmd/PowerShell 里自动装 winget 极易失败（依赖 VCLibs、Microsoft.UI.Xaml 等框架包，往往最终仍需 Microsoft Store），故设为人工关卡。

**离线兜底（无 Microsoft Store，较脆弱）：** 从 <https://github.com/microsoft/winget-cli/releases> 下载最新的 `Microsoft.DesktopAppInstaller_8wekyb3d8bbwe.msixbundle`，在 PowerShell 里执行 `Add-AppxPackage -Path <下载的文件>`。如提示缺框架依赖，还需先装 `VCLibs` 与 `Microsoft.UI.Xaml`。

**成功标志**：`winget --version` 输出版本号（形如 `v1.x.x`）。

---

## Step 2 · Git

**检查：**

**PowerShell：**

```powershell
# PS>
git --version
```

**cmd：**

```cmd
:: >
git --version
```

**若报 "git 不是识别的命令" → 安装：**

**PowerShell：**

```powershell
# PS>
winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
```

**cmd：**

```cmd
:: >
winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
```

⚠️ **关闭并重开终端**（Git.Git 改了 PATH，旧终端不会刷新）。

**验证（在新终端里）：**

**PowerShell：**

```powershell
# PS>
git --version
```

**cmd：**

```cmd
:: >
git --version
```

**成功标志**：输出版本号（形如 `git version 2.4x.x`）。

> 附注：Git for Windows 同时安装了 **Git Bash** 与 **Git Credential Manager**，Step 5 克隆 private 仓库时需要 GCM 来持久化凭证。
````

- [ ] **Step 2: 验证 Step 1/2 结构**

Run:
```bash
grep -cE "^## Step [12] " .docs/setup/dev-environment.md
grep -c "winget install --id Git.Git" .docs/setup/dev-environment.md
grep -cE "关闭并重开终端" .docs/setup/dev-environment.md
```
Expected: `2`；`1`（Git.Git 安装命令出现，cmd 与 PS 各一计 2 也算通过——以 `≥1` 判定）；`≥1`。

- [ ] **Step 3: 提交**

```bash
git add .docs/setup/dev-environment.md
git commit -m "docs: add Step 1 winget gate + Step 2 Git install"
```

---

### Task 3: Step 3 Node.js + Step 4 npm

**Files:**
- Modify: `.docs/setup/dev-environment.md`（在 Step 2 末尾追加）

**Interfaces:**
- Consumes: Task 2 末尾。
- Produces: Step 3、Step 4 章节。

- [ ] **Step 1: 追加 Step 3 与 Step 4**

在文件末尾追加：

````markdown

---

## Step 3 · Node.js

**版本判定**：输出 `vX.Y.Z` 时，满足 **X > 22，或 X == 22 且 Y ≥ 12** 即可（对应 `package.json` 的 `engines.node >=22.12.0`）。

**检查：**

**PowerShell：**

```powershell
# PS>
node -v
```

**cmd：**

```cmd
:: >
node -v
```

**若 "node 不是识别的命令"（缺失）→ 安装：**

**PowerShell：**

```powershell
# PS>
winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
```

**cmd：**

```cmd
:: >
winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
```

**若已安装但版本过低（X==22 且 Y<12）→ 升级：**

**PowerShell：**

```powershell
# PS>
winget upgrade --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
```

⚠️ **关闭并重开终端**（PATH 与 npm 全局目录需要新终端才生效）。

**验证（在新终端里）：**

**PowerShell：**

```powershell
# PS>
node -v
```

**cmd：**

```cmd
:: >
node -v
```

**成功标志**：版本号命中上面的判定（如 `v22.13.0`、`v22.20.0`、`v24.x.x` 均可）。

---

## Step 4 · npm

npm 随 Node.js 自带，**无需单独安装**，仅验证。

**PowerShell：**

```powershell
# PS>
npm -v
```

**cmd：**

```cmd
:: >
npm -v
```

**成功标志**：输出版本号，期望 **≥10**（Node 22 自带的 npm 满足）。
````

- [ ] **Step 2: 验证 Step 3/4 结构**

Run:
```bash
grep -cE "^## Step [34] " .docs/setup/dev-environment.md
grep -c "OpenJS.NodeJS.LTS" .docs/setup/dev-environment.md
grep -c "winget upgrade --id OpenJS.NodeJS.LTS" .docs/setup/dev-environment.md
```
Expected: `2`；`≥1`（安装命令出现）；`1`（升级命令出现）。

- [ ] **Step 3: 提交**

```bash
git add .docs/setup/dev-environment.md
git commit -m "docs: add Step 3 Node.js + Step 4 npm verification"
```

---

### Task 4: Step 5 克隆仓库（private + GCM 凭证持久化）

**Files:**
- Modify: `.docs/setup/dev-environment.md`（在 Step 4 末尾追加）

**Interfaces:**
- Consumes: Task 3 末尾；依赖 Step 2 已装的 Git + GCM。
- Produces: Step 5 章节。

- [ ] **Step 1: 追加 Step 5**

在文件末尾追加：

````markdown

---

## Step 5 · 克隆仓库（private，含凭证持久化）

**前置**：一个**有此仓库访问权限的 GitHub 账号**（本仓库为 private）。

⚠️ **Windows 路径坑**：克隆目录**不要含空格或中文**（sharp、esbuild 等原生工具链对含空格 / Unicode 的工作目录敏感，可能报莫名错误）。推荐克隆到 `C:\dev\`。

**准备目录并克隆：**

**PowerShell：**

```powershell
# PS>
New-Item -ItemType Directory -Force -Path C:\dev | Out-Null
Set-Location C:\dev
git clone https://github.com/sabrinabean/service-chine.git
Set-Location service-chine
```

**cmd：**

```cmd
:: >
mkdir C:\dev
cd C:\dev
git clone https://github.com/sabrinabean/service-chine.git
cd service-chine
```

首次 `git clone` 会弹出 **Git Credential Manager** 登录窗口 → 在浏览器登录 GitHub 并授权 → 凭证写入 **Windows 凭据管理器** → 此后 `git push` / `git pull` 自动复用、无需再登录。

**验证 GCM 已就绪（Git.Git 安装时自带）：**

**PowerShell：**

```powershell
# PS>
git credential-manager --version
git config --global credential.helper
```

**cmd：**

```cmd
:: >
git credential-manager --version
git config --global credential.helper
```

**成功标志**：`git credential-manager --version` 输出版本号；`credential.helper` 显示 `manager`（旧版显示 `manager-core`，亦可）。

**验证 clone 成功：**

**PowerShell：**

```powershell
# PS>
Test-Path package.json
```

**cmd：**

```cmd
:: >
dir package.json
```

**成功标志**：能看到 `package.json` 存在（clone 成功即代表鉴权通过、凭证已持久化）。

**兜底（GCM 弹窗失败 / 无浏览器环境）—— 用 Personal Access Token：**

1. GitHub → Settings → Developer settings → Personal access tokens → 生成一个带 **`repo`** 权限的 token。
2. 重跑 `git clone`，用户名填 **GitHub 用户名**，密码填 **该 token**。
3. GCM 会把 token 存进凭据管理器，后续免再输入。

**备选（SSH，配置更重）：**

```powershell
# PS>
ssh-keygen -t ed25519 -C "your_email@example.com"
```

把生成的公钥（`~/.ssh/id_ed25519.pub`，Windows 上通常在 `C:\Users\<你>\.ssh\`）添加到 GitHub 账号的 SSH keys，然后改用 SSH 地址克隆：

```cmd
:: >
git clone git@github.com:sabrinabean/service-chine.git
```
````

- [ ] **Step 2: 验证 Step 5 结构**

Run:
```bash
grep -cE "^## Step 5 " .docs/setup/dev-environment.md
grep -c "github.com/sabrinabean/service-chine" .docs/setup/dev-environment.md
grep -c "credential-manager" .docs/setup/dev-environment.md
grep -c "Personal Access Token" .docs/setup/dev-environment.md
```
Expected: `1`；`≥2`（HTTPS 与 SSH 两处）；`≥1`；`1`。

- [ ] **Step 3: 提交**

```bash
git add .docs/setup/dev-environment.md
git commit -m "docs: add Step 5 clone private repo with GCM credential persistence"
```

---

### Task 5: Step 6 安装依赖 + Step 7 启动 dev server

**Files:**
- Modify: `.docs/setup/dev-environment.md`（在 Step 5 末尾追加）

**Interfaces:**
- Consumes: Task 4 末尾；仓库已克隆到 `C:\dev\service-chine`，Node/npm 已就绪。
- Produces: Step 6、Step 7 章节。

- [ ] **Step 1: 追加 Step 6 与 Step 7**

在文件末尾追加：

````markdown

---

## Step 6 · 安装项目依赖

确认当前在仓库根目录（`C:\dev\service-chine`，能 `dir` 到 `package.json`）。

**主命令（全新克隆，用 `npm ci` 最快且严格按 lockfile 安装）：**

**PowerShell：**

```powershell
# PS>
npm ci
```

**cmd：**

```cmd
:: >
npm ci
```

**兜底（`npm ci` 报错，例如 lockfile 与 package.json 不同步）→ 改用：**

**PowerShell：**

```powershell
# PS>
npm install
```

**cmd：**

```cmd
:: >
npm install
```

**验证：**

**PowerShell：**

```powershell
# PS>
Test-Path node_modules\astro
```

**cmd：**

```cmd
:: >
dir node_modules\astro
```

**成功标志**：`node_modules\astro` 存在，且安装命令退出码为 0（无 `npm error` / `ELSPROBLEMS`）。

---

## Step 7 · 启动 dev server

**PowerShell：**

```powershell
# PS>
npm run dev
```

**cmd：**

```cmd
:: >
npm run dev
```

**成功标志**：终端输出中能看到一行：

```
Local:   http://localhost:4321/
```

用浏览器打开该地址，能看到站点首页即代表开发环境就绪。

> 备注：首次启动较慢（字体、图标缓存首次生成），请等到出现 `Local:` / ready 行再开浏览器。停止开发服务器按 `Ctrl+C`。
````

- [ ] **Step 2: 验证 Step 6/7 结构**

Run:
```bash
grep -cE "^## Step [67] " .docs/setup/dev-environment.md
grep -c "npm ci" .docs/setup/dev-environment.md
grep -c "localhost:4321" .docs/setup/dev-environment.md
grep -c "npm install" .docs/setup/dev-environment.md
```
Expected: `2`；`≥1`；`≥1`；`≥1`。

- [ ] **Step 3: 提交**

```bash
git add .docs/setup/dev-environment.md
git commit -m "docs: add Step 6 npm ci + Step 7 dev server startup"
```

---

### Task 6: Step 8 排错 + 进一步链接 + 全文核验

**Files:**
- Modify: `.docs/setup/dev-environment.md`（在 Step 7 末尾追加 Step 8 与"进一步"）

**Interfaces:**
- Consumes: Task 5 末尾；全文已完成 Step 0–7。
- Produces: Step 8、"进一步"、完整可交付文档。

- [ ] **Step 1: 追加 Step 8 与"进一步"**

在文件末尾追加：

````markdown

---

## Step 8 · 排错

1. **`winget` / `node` / `npm` 装完仍提示 "not recognized"**
   → PATH 未刷新。**关闭并重新打开终端**，再重试。仍不行则重启电脑。

2. **`sharp` 安装失败（npm error … sharp …）**
   → 先看详细日志：`npm install --foreground-scripts`。
   → 装 **Visual Studio Build Tools 2022**（安装器里勾选 "Desktop development with C++" 工作负载）并装 **Python**。
   → 确认 Node 是 **x64** 架构而非 x86：`node -p "process.arch"` 应输出 `x64`。

3. **端口 4321 被占用**
   → 换端口启动：

   **PowerShell：**

   ```powershell
   # PS>
   npm run dev -- --port 4322
   ```

   **cmd：**

   ```cmd
   :: >
   npm run dev -- --port 4322
   ```

4. **PowerShell 执行策略拦截脚本**
   → `npm` / `git` 一般用不到执行策略；仅在确实被拦时执行：

   **PowerShell：**

   ```powershell
   # PS>
   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
   ```

5. **公司网络 / 代理**
   → 给 npm 和 git 各配代理（把 `http://代理:端口` 换成实际地址）：

   **PowerShell：**

   ```powershell
   # PS>
   npm config set https-proxy http://代理:端口
   git config --global http.proxy http://代理:端口
   ```

6. **Windows 长路径报错（filename too long）**
   → 以**管理员身份**打开 PowerShell，执行：

   **PowerShell（管理员）：**

   ```powershell
   # PS>
   git config --system core.longpaths true
   ```

---

## 进一步（超出最小轨道）

本指南止步于 `npm run dev` 本地预览。以下能力按需另见对应文档：

- **Decap CMS 本地内容编辑、`proxy/` OAuth Worker、Cloudflare 部署** → `.docs/spec/2026-06-21-decap-cms-migration/`（含 `setup-oauth-app.md`、`deploy-proxy.md`、`deploy-site.md`、`troubleshooting.md`）。
- **站点 / 后台运维（Decap admin 英文 UI、分类关系）** → `.docs/operation/admin-operation-guide.md`。
````

- [ ] **Step 2: 全文结构与完整性核验**

Run（仓库根目录）:
```bash
echo "== 章节计数（期望 9: Step 0-8）=="
grep -cE "^## Step [0-8] " .docs/setup/dev-environment.md

echo "== cmd/PS 双终端标记（均应 ≥8）=="
grep -c "# PS>" .docs/setup/dev-environment.md
grep -c ":: >" .docs/setup/dev-environment.md

echo "== 关键约定标志 =="
grep -c "关闭并重开终端" .docs/setup/dev-environment.md
grep -cE "⛔|人工介入|人工关卡" .docs/setup/dev-environment.md

echo "== 排错 6 项（期望 6）=="
grep -cE "^[0-9]\. \*\*" .docs/setup/dev-environment.md

echo "== 进一步链接（期望 ≥2）=="
grep -c "decap-cms-migration\|admin-operation-guide" .docs/setup/dev-environment.md
```
Expected: Step 章节计数 `9`；两个终端标记各 `≥8`；"关闭并重开终端" `≥2`；人工关卡标记 `≥1`；排错项 `6`；进一步链接 `≥2`。

若任一项不符，回到对应 Task 修补后重新核验。

- [ ] **Step 3: Markdown 渲染自检（肉眼）**

打开 `.docs/setup/dev-environment.md`，目视确认：
- 所有 ```` ```powershell ```` / ```` ```cmd ```` 代码块都正确闭合（无未配对反引号）。
- 目录的锚点链接与各 Step 标题对应。
- 没有遗留 `TBD` / `TODO` / 占位文字。

Run（占位符扫描，期望无输出）:
```bash
grep -nE "TBD|TODO|FIXME|占位|待补|xxx" .docs/setup/dev-environment.md
```
Expected: 无输出（空）。

- [ ] **Step 4: 提交**

```bash
git add .docs/setup/dev-environment.md
git commit -m "docs: add Step 8 troubleshooting + further-reading links; complete guide"
```

---

## 自审

**1. 规格覆盖（逐节对照 `2026-07-02-dev-env-setup-design.md`）：**

| 规格章节 | 实现任务 | 状态 |
|---|---|---|
| 落点 `.docs/setup/dev-environment.md`、中文、LLM 读者 | Task 1 头部 + "如何使用本文档" | ✅ |
| LLM 可读 6 约定 | Task 1（四段结构/标记/重开/⛔/幂等）+ 全任务双终端 | ✅ |
| Step 0 前置体检 | Task 1 | ✅ |
| Step 1 winget 关卡（不自动装、⛔） | Task 2 | ✅ |
| Step 2 Git（Git.Git、重开终端、GCM 附注） | Task 2 | ✅ |
| Step 3 Node（谓词、LTS、install/upgrade、重开） | Task 3 | ✅ |
| Step 4 npm（仅验证 ≥10） | Task 3 | ✅ |
| Step 5 clone private + GCM + PAT + SSH + 路径坑 | Task 4 | ✅ |
| Step 6 npm ci + 兜底 install | Task 5 | ✅ |
| Step 7 npm run dev + localhost:4321 | Task 5 | ✅ |
| Step 8 排错 6 项 | Task 6 | ✅ |
| 末尾"进一步"链接 | Task 6 | ✅ |
| 验收标准（DoD） | Task 6 Step 2 核验项一一对应 | ✅ |

**2. 占位符扫描：** 各任务代码块均为完整 Markdown，无 TBD/TODO；Task 6 Step 3 显式跑占位符扫描兜底。✅

**3. 类型/命名一致性：** 终端标记 `# PS>` / `:: >`、包 ID `Git.Git` / `OpenJS.NodeJS.LTS`、仓库 URL、端口 `4321`、Node 谓词，在所有任务中一致。✅

无遗漏。
