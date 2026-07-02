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
