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
