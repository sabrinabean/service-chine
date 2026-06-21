# Service Chine 后台运营操作指南

> 面向运营人员的中文操作手册。后台(Decap CMS)界面为**英文**;网站面向访客的内容为**法语**。
> 最近更新:2026-06-21。后台地址:`/admin`。

---

## 目录

1. [登录与工作流](#1-登录与工作流)
2. [⚠️ 核心规则:界面英文,内容法语](#2-️-核心规则界面英文内容法语)
3. [分类机制(Categories)——必读](#3-分类机制categories必读)
4. [各集合字段操作](#4-各集合字段操作)
5. [图片与媒体规则](#5-图片与媒体规则)
6. [文章 ↔ 分类 工作流](#6-文章--分类-工作流)
7. [发布与上线](#7-发布与上线)
8. [常见问题与排错](#8-常见问题与排错)

---

## 1. 登录与工作流

### 1.1 进入后台

- 打开网站地址后加 `/admin`,例如:`https://service-chine.sabrinabin-fr.workers.dev/admin`。
- 点击 **Login with GitHub**(使用 GitHub 登录)。
- 首次登录会跳转到 GitHub 授权页,点击 **Authorize**(授权)即可。授权后由 GitHub OAuth 代理(`decap-proxy`)处理,无需额外密码。

### 1.2 编辑工作流(Editorial Workflow)

后台开启了 `editorial_workflow`(编辑工作流)。每篇文章(文章/服务/团队成员等)都会经历以下状态:

| 状态 | 英文 | 含义 |
|---|---|---|
| 草稿 | **Draft** | 刚创建,仅编辑者可见 |
| 待审 | **In review** | 提交审阅,等待其他人确认 |
| 待发布 | **Ready** | 审阅通过,准备发布 |
| 已发布 | **Published** | 已提交到 `main` 分支,网站即将更新 |

> 💡 日常单人运营可直接保存为 **Published**(发布)上 main;多人协作时建议走 Draft → In review → Published。

---

## 2. ⚠️ 核心规则:界面英文,内容法语

这是本系统最重要的约定,务必牢记:

> **后台的所有按钮、字段标签都是英文,但你在这些字段里填写的内容必须是法语。**

原因:你输入的标题、描述、正文会**原样**展示到法语网站上。如果你在 `Title` 字段填了英文或中文,网站上就会直接显示英文或中文。

### 字段标签对照(标签是英文 → 内容填法语)

| 后台字段(英文标签) | 你应该填写 |
|---|---|
| **Title** | 法语标题(如 `Nos services de ménage`) |
| **Description** | 法语简短描述 |
| **Content** (正文) | 法语正文,支持 Markdown |
| **Category** (分类) | 从下拉选择(下拉里显示的是法语分类标题) |
| **Author → Identifier / Name** | 英文标识符 / 作者姓名(作者姓名可按实际,通常人名不区分语言) |
| **Featured image / Photo** | 上传图片(见第 5 节) |
| **Publish date / Updated date** | 选择日期 |
| **Display order** | 数字,控制分类在网站上的显示顺序 |
| **Featured** (Mis en avant) | 勾选框,是否在首页"重点展示" |
| **Rating** (评分) | 1–5 的整数,仅团队成员使用 |

---

## 3. 分类机制(Categories)——必读

> 本节回答:**后台的分类是怎么和网站上的文章对应起来的?**

### 3.1 分类是一个"文件"

每个分类在仓库里是一个 Markdown 文件,位于 `src/content/categories/`。例如 `cleaning.md`:

```markdown
---
title: "Conseils d'entretien"   # ← 网站上显示的法语标题
order: 1                          # ← 显示顺序(数字越小越靠前)
---
```

关键点:
- **文件名**(`cleaning`,不含扩展名)是分类的**唯一标识**(slug)。
- `title` 字段是**显示给访客看的法语标题**。

### 3.2 文章通过"文件名"引用分类

每篇博客文章的 `category` 字段里存的**不是分类标题,而是分类的文件名**。例如 `src/content/blog/b1.md`:

```markdown
---
title: "Eco-Friendly Cleaning: ..."
category: cleaning   # ← 引用的是 cleaning.md 的文件名
---
```

### 3.3 网站如何把"文件名"变成可显示的标题

网站代码(`src/utils/categories.ts`)在构建时:
1. 读取所有分类文件,建立一张映射表:**文件名 → 法语标题**。
   - 例:`cleaning → "Conseils d'entretien"`
2. 文章卡片或文章详情页遇到 `category: cleaning` 时,查这张表,显示法语标题 `"Conseils d'entretien"`,并生成一个指向 `/blog/cleaning` 的链接徽章。

### 3.4 完整示例

```
文章 b1.md
   └─ frontmatter: category: cleaning
         │
         ▼  网站查表
   cleaning.md → { title: "Conseils d'entretien" }
         │
         ▼  渲染到页面
   文章卡片显示徽章:[Conseils d'entretien]  链接:/blog/cleaning
```

> ✅ **所以:在后台创建文章时,你只需从 Category 下拉里选一个分类(下拉显示法语标题),系统会自动在背后存成文件名。你不需要、也不应该手填文件名。**

---

## 4. 各集合字段操作

后台左侧栏有 4 个集合(Collections):

### 4.1 Categories(分类)

| 字段 | 是否必填 | 说明 |
|---|---|---|
| **Title** | ✅ 必填 | 法语标题;**同时也是生成文件名的依据**(只允许字母、数字、连字符、下划线) |
| **Description** | 选填 | 法语描述 |
| **Display order** | 默认 0 | 数字,控制分类排序 |
| **Featured image** | 选填 | 分类配图 |
| **Content** | 选填 | 分类页正文(若需要) |

⚠️ 创建分类时:**Title 会被用作文件名**(slug)。建议用简洁、稳定、英文/拼音友好的标题,避免事后改动(见 6.3)。

### 4.2 Articles(文章 / 博客)

| 字段 | 是否必填 | 说明 |
|---|---|---|
| **Title** | ✅ 必填 | 法语标题 |
| **Description** | ✅ 必填 | 法语简介(列表/SEO 用) |
| **Publish date** | ✅ 必填 | 发布日期 |
| **Updated date** | 选填 | 更新日期 |
| **Featured image** | 选填 | 文章配图 |
| **Category** | ✅ 必填 | 从下拉选择(显示法语标题,背后存文件名) |
| **Author → Identifier** | ✅ 必填 | 作者标识符(如 `john-helton`) |
| **Author → Name** | ✅ 必填 | 作者姓名 |
| **Content** | ✅ 必填 | 法语正文(Markdown) |

### 4.3 Services(服务)

| 字段 | 是否必填 | 说明 |
|---|---|---|
| **Title** | ✅ 必填 | 法语服务名 |
| **Description** | ✅ 必填 | 法语简介 |
| **Publish date** | 选填 | 发布日期 |
| **Updated date** | 选填 | 更新日期 |
| **Featured image** | 选填 | 服务配图 |
| **Featured** | 默认 否 | 勾选则在首页"重点服务"展示 |
| **Content** | ✅ 必填 | 法语正文(Markdown) |

### 4.4 Team(团队)

| 字段 | 是否必填 | 说明 |
|---|---|---|
| **Name** | ✅ 必填 | 成员姓名(对应 Title) |
| **Description** | ✅ 必填 | 法语简介 |
| **Publish date** | 选填 | 发布日期 |
| **Updated date** | 选填 | 更新日期 |
| **Photo** | 选填 | 成员照片 |
| **Featured** | 默认 否 | 勾选则在首页/团队页突出展示 |
| **Rating** | 默认 5 | 1–5 的整数评分 |
| **Content** | ✅ 必填 | 法语正文(Markdown) |

---

## 5. 图片与媒体规则

后台的图片字段(Featured image / Photo)上传后,会自动存到对应集合的图片目录。**你不需要手动管理路径,但要了解图片最终去哪了**,以便排查问题。

| 集合 | 图片存放目录 |
|---|---|
| Articles(文章) | `src/assets/news/` |
| Categories(分类) | `src/assets/categories/` |
| Services(服务) | `src/assets/services/` |
| Team(团队) | `src/assets/team/` |

### 上传建议

- **格式**:优先 jpg / png / webp。
- **尺寸**:配图建议宽度 1000–1600px,横构图(约 2:1);照片按实际。过大的图片会拖慢网站。
- 文件名用英文/数字,避免中文和空格。

---

## 6. 文章 ↔ 分类 工作流

### 6.1 标准流程:先建分类,再建文章

1. **先创建分类**:在 **Categories** 集合里点 **Add Category**,填 Title(法语)和 Display order,保存。
2. 分类保存后,系统会用它的 Title 生成一个**文件名(slug)**。
3. **再创建文章**:在 **Articles** 里点 **Add Article**,在 **Category** 下拉里就能看到刚建的分类(显示法语标题),选中即可。
4. 填完其余字段,保存为 **Published**。

### 6.2 如果下拉里看不到刚建的分类

通常是因为分类还没真正保存(Published),或浏览器缓存。确保分类已发布,刷新后台再试。

### 6.3 ⚠️ 不要随意"重命名"已有分类

分类的**文件名**是文章引用它的依据。如果你通过删除旧分类、新建同名分类的方式"改名",**新分类会得到一个不同的文件名,导致所有引用旧分类的文章分类链接失效**(徽章会显示成原始文件名、链接 404)。

**正确的改法**:直接**编辑原分类的 Title 字段**(法语标题可以随便改),**不要动文件名**。改 Title 不影响文章引用,因为引用的是文件名不是标题。

> 若确需重命名分类的文件名(英文标识),需同步修改所有引用它的文章的 `category` 字段。建议联系开发处理。

---

## 7. 发布与上线

### 7.1 发布即上线

后台保存为 **Published** 后,内容会作为一次提交推送到 GitHub 的 `main` 分支。Cloudflare 监听到推送后自动重新构建网站。

### 7.2 上线时间

通常 **30 秒到 2 分钟**内,改动就会出现在线上网站。

### 7.3 如何确认已上线

1. 打开公开网站(非 `/admin`)。
2. 找到对应页面(文章列表 `/blog/`、服务、团队等)核对内容。
3. 若未更新,等待 1–2 分钟后强制刷新浏览器(Ctrl/Cmd + Shift + R)。

---

## 8. 常见问题与排错

### Q1:文章的"分类徽章"显示成一串原始英文/拼音,而不是法语标题?

**原因**:该文章的 `category` 字段值,在分类映射表里找不到对应文件名(通常是分类被删除或文件名改动过)。

**解决**:打开这篇文章,在 **Category** 下拉里**重新选择**一个当前存在的分类并保存。

### Q2:我改了分类的名字(法语标题),旧文章的徽章也跟着变了,这正常吗?

**正常**。徽章显示的是分类的 **Title(法语标题)**,你改 Title,所有引用该分类的文章徽章都会更新——这是期望行为。文章引用的是文件名(没变),所以不会断链。

### Q3:点了分类徽章链接 `/blog/xxx` 出现 404?

**已知限制**:目前网站**还没有分类聚合页**(即 `/blog/<分类>` 这个页面尚未实现)。徽章链接指向的分类页暂不可用,这不影响文章本身和列表页的展示。如需该功能,请联系开发评估补上分类列表页。

### Q4:上传的图片在前台不显示?

- 检查图片是否上传成功(字段里应有路径)。
- 确认图片存放到了正确的集合目录(见第 5 节)。
- 等待构建完成后再刷新前台。

### Q5:登录 GitHub 失败 / 一直转圈?

- 确认网络可访问 GitHub。
- 清除浏览器 cookie 后重试。
- 若仍失败,可能是 OAuth 代理(`decap-proxy` Worker)异常,联系开发检查 Worker 状态。

---

## 附:技术速查(给开发/技术运营)

| 项目 | 位置 / 值 |
|---|---|
| 后台配置 | `public/admin/config.yml` |
| 后台入口页 | `src/pages/admin.astro` |
| 内容 Schema | `src/content.config.ts`(Zod 校验,读取时生效) |
| 分类映射逻辑 | `src/utils/categories.ts`(`resolveCategory`) |
| 分类关系存储 | `value_field: "{{slug}}"`(存文件名) |
| 内容目录 | `src/content/{categories,blog,service,team}` |
| OAuth 代理 | `proxy/`(独立 Cloudflare Worker) |
| 界面语言 | 后台英文(`locale: en`),内容法语 |
