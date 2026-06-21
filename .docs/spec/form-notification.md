# 表单咨询 → 邮件通知(基于 ProCleaning contacts 页)

> 把主题 `contacts` 页的静态表单,替换为法语咨询表单 + Cloudflare Pages Function + Gmail SMTP。线索邮件进销售 Gmail,客户收到法语自动确认信。

## 数据流

```
访客浏览器(主题 contacts 页)
   │  <form method="POST" action="/api/lead">
   │  body: { name, email, company, message }   (法语字段)
   ▼
Cloudflare Pages Function  (POST /api/lead)
   │  1. 服务端校验(必填、邮箱格式、长度)
   │  2. 蜜罐字段(被填=机器人)
   │  3. Cloudflare Turnstile 校验(防机器人)
   │  4. 组装两封邮件 → Gmail SMTP 发送
   ▼
Gmail SMTP (smtp.gmail.com:587, STARTTLS)
   │  认证:销售 Gmail + Gmail App Password(加密 secret)
   ▼
邮件送达 ──> 销售收件箱(线索存档,无数据库)
         └> 客户收件箱(法语确认信)
```

---

## ⚠️ Astro 6 实测要点(已落地,与上文示例的差异)

实现过程中发现的三个 Astro 6 + cloudflare adapter 关键点,实际代码以此为准:

1. **API 路由路径**:`src/pages/api/lead.ts`(**不是** `functions/api/`)。
   - Astro 6 cloudflare adapter 走 Workers 统一入口,**不识别 Pages 的 `functions/` 目录约定**。`functions/api/lead.ts` 不会被打包,部署后 404。改用 Astro 原生 API 路由 `src/pages/api/lead.ts`,由 `export const POST` 导出。
2. **必须 `export const prerender = false`**:
   - 该路由 `import { connect } from "cloudflare:sockets"` 是 workerd-only 模块。若被 node 预渲染阶段触及,build 报 `ERR_UNSUPPORTED_ESM_URL_SCHEME: Received protocol 'cloudflare:'`。`prerender = false` 让它只在 workerd 运行时跑。
3. **环境变量来源**:`import { env } from "cloudflare:workers"`(**不是** `context.locals.runtime.env`)。
   - Astro 6 已移除 `Astro.locals.runtime.env`,运行时日志明确报 `has been removed in Astro v6`。改用 `cloudflare:workers` 的 `env`。

---


主题已有 contacts 页(静态)。改造点:
- 把表单的 `action` 指向 `/api/lead`,`method="POST"`。
- 表单字段全部法文化(标签/占位符/校验提示)。
- 加蜜罐字段 + Cloudflare Turnstile 组件。
- 提交成功 → 重定向到 `/merci`(法语致谢页,新建)。

```html
<!-- 法语咨询表单 -->
<form method="POST" action="/api/lead">
  <label for="name">Nom <span aria-hidden="true">*</span></label>
  <input id="name" name="name" type="text" required maxlength="100" />

  <label for="email">E-mail <span aria-hidden="true">*</span></label>
  <input id="email" name="email" type="email" required maxlength="120" />

  <label for="company">Société</label>
  <input id="company" name="company" type="text" maxlength="120" />

  <label for="message">Votre message <span aria-hidden="true">*</span></label>
  <textarea id="message" name="message" required minlength="10" maxlength="3000"></textarea>

  <!-- 蜜罐字段(对用户隐藏,机器人会填) -->
  <input type="text" name="company_website" tabindex="-1" autocomplete="off"
         style="position:absolute;left:-9999px" aria-hidden="true" />

  <!-- Cloudflare Turnstile -->
  <div class="cf-turnstile" data-sitekey="<PUBLIC_TURNSTILE_SITE_KEY>"></div>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

  <button type="submit">Envoyer ma demande</button>
</form>
```

**法语文案**:Nom 姓名 / E-mail / Société 公司 / Votre message 您的留言 / Envoyer ma demande 提交我的请求。

**新建致谢页** `src/pages/merci.astro`:« Merci, votre demande a bien été envoyée. Nous reviendrons vers vous dans les plus brefs délais. »

---

## 2. Pages Function(`functions/api/lead.ts`)

> 在 Workers 运行时里用 `cloudflare:sockets` 建立 TCP,手搓 SMTP(STARTTLS)。可使用 Workers 兼容的轻量 SMTP 库降低手写协议负担。骨架:

```ts
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const data = await request.formData();
  const name = String(data.get('name') ?? '').trim();
  const email = String(data.get('email') ?? '').trim();
  const company = String(data.get('company') ?? '').trim();
  const message = String(data.get('message') ?? '').trim();
  const turnstileToken = String(data.get('cf-turnstile-response') ?? '');

  // 蜜罐:被填写即机器人
  if (data.get('company_website')) return spamResponse();

  // 服务端校验
  if (!name || !isValidEmail(email) || message.length < 10) {
    return errorResponse('Veuillez remplir correctement le formulaire.');
  }

  // Turnstile 校验
  if (!(await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET))) {
    return errorResponse('Échec de la vérification anti-spam.');
  }

  // Gmail SMTP 发两封邮件
  await sendViaGmailSmtp({
    gmailUser: env.GMAIL_USER,            // 例:sales@gmail.com
    gmailAppPassword: env.GMAIL_APP_PASS, // Gmail App Password(非登录密码)
    toSales: { name, email, company, message },
    toCustomer: { name, email },
  });

  return new Response(null, { status: 303, headers: { Location: '/merci' } });
};
```

**Gmail SMTP 参数**

| 项 | 值 |
|---|---|
| Host | `smtp.gmail.com` |
| Port | `587` |
| 加密 | `STARTTLS` |
| 认证 | 用户名=完整 Gmail 地址;密码=**Gmail App Password** |
| From | = 该 Gmail 地址 |
| To(销售) | 同一 Gmail(或共享收件箱) |
| Reply-To | 客户填写的 `email` |

**Secret 管理**:全部存为 Cloudflare 加密环境变量,**绝不**进仓库。
`GMAIL_USER` / `GMAIL_APP_PASS` / `TURNSTILE_SECRET` / `PUBLIC_TURNSTILE_SITE_KEY`。

---

## 3. 法语邮件模板

### a) 发给销售(线索详情)
```
Objet : Nouvelle demande de contact — <Nom>

Nom :      <Nom>
E-mail :   <E-mail>
Société :  <Société or « — »>

Message :
<Message>
```

### b) 发给客户(自动确认信)
```
Objet : Nous avons bien reçu votre demande

Bonjour <Nom>,

Nous vous remercions pour votre message. Nous l'avons bien reçu
et reviendrons vers vous dans les plus brefs délais.

Cordialement,
L'équipe Service Chine
```

---

## 送达率与风控说明

- 走 Gmail SMTP 中转,SPF/DKIM/DMARC 由 Gmail 负责,**无需在自有域名配邮件 DNS 记录**(这是相对 Resend 的简化)。
- 给客户的确认信从该 Gmail 发出 —— 已知并接受的取舍(发件人非品牌域名)。
- 风控:短期高并发从 Workers IP 大量发信可能触发 Google 异常登录。**企业咨询量低,风险可忽略**;建议为该用途用专门 Gmail 账号。
- 未来如需品牌域名发件(`noreply@<domain>`)或更高发送量,切换 Resend —— 仅改 Function 发信实现,不影响架构。

## 否决:WhatsApp / Resend

- **WhatsApp(OpenClaw / Baileys)**:OpenClaw 易接入靠 Baileys(逆向 WhatsApp Web 的非官方库),需常驻 gateway + 单独号码 + 违反 ToS 有封号风险 —— 与"无状态 serverless + 线索可靠性"冲突。不采用。
- **Resend**:可行但引入外部依赖;本方案选零依赖的 Gmail SMTP。
