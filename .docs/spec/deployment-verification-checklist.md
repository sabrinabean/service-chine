# 部署准备与验证清单

> 目标:把 service-chine 部署到新 GitHub 账户 + 新 Cloudflare 账户,验证线上表单真实发信。
> 下面是**你需要去各平台做的动作**(账户操作我无法替你执行)。按顺序完成,打勾即过。

---

## 第 0 步:安全(先做)

- [ ] **revoke 之前泄漏的 PAT**:sabrinabean → Settings → Developer settings → Personal access tokens → 删除旧 token → 重新生成一把新 PAT。
- [ ] 更新本机 remote:`git remote set-url origin https://<新PAT>@github.com/sabrinabean/service-chine.git`

---

## 第 1 步:GitHub(sabrinabean 账户)

- [ ] **建仓库 secrets**(仓库 → Settings → Secrets and variables → Actions → New repository secret):
  - [ ] `CLOUDFLARE_API_TOKEN` —— 第 2 步生成的 CF API Token
  - [ ] `CLOUDFLARE_ACCOUNT_ID` —— 新 CF 账户的 Account ID(Dashboard 右侧)
- [ ] **确认 workflow 文件已在仓库**:`.github/workflows/deploy.yml`(已写入,提交推送即可)

---

## 第 2 步:Cloudflare(新账户)

- [ ] 注册/登录**新 Cloudflare 账户**。
- [ ] **生成 API Token**:My Profile → API Tokens → Create Token → 选 **"Edit Cloudflare Workers"** 模板 → 复制 Token(只显示一次)→ 填进 GitHub secret `CLOUDFLARE_API_TOKEN`。
- [ ] 记下 **Account ID** → 填进 GitHub secret `CLOUDFLARE_ACCOUNT_ID`。
- [ ] (首次 push 后)在 Workers & Pages 确认 `service-chine` Worker 已创建(由 wrangler deploy 自动建)。

---

## 第 3 步:运行时 secret(放 Cloudflare,不是 GitHub)

> 这些是 lead Function 运行时读的变量。**放 Cloudflare**(Workers & Pages → service-chine → Settings → Variables and Secrets),不放 GitHub。

- [ ] `GMAIL_USER` —— 销售 Gmail 地址(如 `servicechine.leads@gmail.com`)
- [ ] `GMAIL_APP_PASS` —— 该 Gmail 的 **App Password**(Google 账户 → 两步验证 → 应用专用密码,**不是登录密码**)
- [ ] `LEAD_TO`(可选)—— 线索收件人;缺省 = `GMAIL_USER`
- [ ] `TURNSTILE_SECRET` —— 第 4 步的 Turnstile Secret Key

---

## 第 4 步:Turnstile(防机器人,新 CF 账户)

- [ ] Turnstile → Add site → 域名填你的线上域名(或先填 `service-chine.<subdomain>.workers.dev`)。
- [ ] 复制 **Site Key** + **Secret Key**。
- [ ] Site Key → 替换 `src/components/homepage/Contacts.astro` 里的 `<PUBLIC_TURNSTILE_SITE_KEY>`(前端可见,也可后续做成环境变量注入)。
- [ ] Secret Key → 填进 Cloudflare 变量 `TURNSTILE_SECRET`(第 3 步)。

---

## 第 5 步:推送 + 触发部署

```bash
cd ~/projects/service-chine
# workflow 文件 + 文档已就绪,提交推送
git add .github .docs
git commit -m "ci: add Cloudflare Workers deploy workflow + verify checklist"
git push -u origin main
```

- [ ] push 成功(用新 PAT)。
- [ ] GitHub → Actions 标签 → 看到 "Deploy to Cloudflare Workers" 自动触发。
- [ ] Action 跑通(绿色 ✅)。若失败,看日志(常见:`CLOUDFLARE_API_TOKEN` 权限不足 → 重发 Token)。

---

## 第 6 步:线上验证(核心闭环)

部署成功后,线上 Worker 地址形如 `https://service-chine.<account>.workers.dev`(或你绑的域名)。

- [ ] **首页打开** `https://<域名>/` —— 看到法语站(导航 Accueil/Services/Équipe)。
- [ ] **Keystatic admin** `https://<域名>/keystatic` —— 能加载(本地模式;GitHub 模式需另配 OAuth,见下)。
- [ ] **表单端到端发信**(关键):
  1. 打开 `https://<域名>/contact`。
  2. 填法语表单(Nom / E-mail / Votre message)。
  3. 提交 → 跳转到 `/merci` 致谢页。
  4. 检查销售 Gmail:**应收到**线索邮件(主题 `Nouvelle demande de contact`)。
  5. 检查填写的客户邮箱:**应收到**法语确认信(主题 `Nous avons bien reçu votre demande`)。
- [ ] **若没收到邮件**:看 Cloudflare → service-chine → Logs,找 `SMTP send failed` 的具体错误(常见:Gmail App Password 错误 / Google 风控 / 587 端口限制)。

---

## 已知边界(诚实说明)

- **SMTP 实现**:`cloudflare:sockets` + STARTTLS。本地 workerd 验证到"Function 正常响应、env 检查生效",但**真实发信需线上 + 真实 Gmail 凭证**才能最终确认。第 6 步若发信失败,日志会给出 SMTP 错误,据此排查(最坏情况:改用 Resend API,只需改 Function 内 `sendViaGmailSmtp`,架构不变)。
- **Keystatic 上线**:`/keystatic` 当前是 `local` 模式(本地编辑)。要线上编辑需切 `github` 模式 + 建 OAuth App(见 `cms-keystatic.md` §GitHub 模式)。这是**下一步**,不在本次部署验证范围。
