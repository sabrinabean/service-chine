// POST /api/lead — 接收法语咨询表单,经 Gmail SMTP 发线索邮件 + 客户确认信。
//
// 这是 Astro 原生 API 路由(src/pages/api/*),由 @astrojs/cloudflare adapter 打包进 Workers。
// (注:Astro 6 Workers 模式不识别 Pages 的 functions/ 目录约定,故用此路径。)
//
// 实现:Cloudflare Workers `cloudflare:sockets` + STARTTLS(Gmail smtp.gmail.com:587)。
// 参考:https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/
//   - secureTransport: "starttls" 允许 socket 升级到 TLS
//   - startTls() 返回新 Socket;原 socket 的 reader/writer 失效,必须从新 socket 重建
//
// 环境变量(Cloudflare 加密 secret,经 context.locals.runtime.env 访问):
//   GMAIL_USER          销售 Gmail 地址(同时作为发件人)
//   GMAIL_APP_PASS      Gmail App Password(非登录密码)
//   TURNSTILE_SECRET    Cloudflare Turnstile Secret(防机器人;未配则跳过校验)
//   LEAD_TO             (可选)线索收件人;缺省 = GMAIL_USER

import type { APIRoute } from "astro";
import { connect } from "cloudflare:sockets";
// Astro 6:locals.runtime.env 已移除,改用 cloudflare:workers 的 env
import { env as cfEnv } from "cloudflare:workers";

// 该端点用 cloudflare:sockets(仅 workerd 可用),必须 on-demand 渲染,
// 绝不被 node 预渲染阶段触及(否则报 ERR_UNSUPPORTED_ESM_URL_SCHEME)。
export const prerender = false;

interface Env {
  GMAIL_USER: string;
  GMAIL_APP_PASS: string;
  TURNSTILE_SECRET?: string;
  LEAD_TO?: string;
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};
const escapeHtml = (s: string) =>
  s.replace(/[&<>"]/g, (c) => HTML_ESCAPES[c] ?? c);

const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

const base64Utf8 = (s: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)));

const encodeSubject = (subject: string) => `=?UTF-8?B?${base64Utf8(subject)}?=`;

// ── SMTP 客户端(Gmail 587 STARTTLS,基于 cloudflare:sockets)──

class SmtpClient {
  private socket: any;
  private reader!: ReadableStreamDefaultReader<Uint8Array>;
  private writer!: WritableStreamDefaultWriter<Uint8Array>;
  private decoder = new TextDecoder();
  private buffer = "";

  private async readReply(): Promise<string> {
    // SMTP 多行回复:最后一行状态码后跟空格(而非 '-')表示结束
    while (!/\r?\n\d{3} /.test(this.buffer)) {
      const { value, done } = await this.reader.read();
      if (done) break;
      this.buffer += this.decoder.decode(value, { stream: true });
    }
    const idx = this.buffer.search(/\r?\n\d{3} /);
    const eol = this.buffer.indexOf("\n", idx >= 0 ? idx : 0);
    const out = this.buffer.slice(0, eol >= 0 ? eol + 1 : undefined);
    this.buffer = eol >= 0 ? this.buffer.slice(eol + 1) : "";
    return out;
  }

  private async expect(code: number) {
    const reply = await this.readReply();
    if (!reply.startsWith(String(code))) {
      throw new Error(`SMTP attendu ${code}, reçu: ${reply.trim()}`);
    }
    return reply;
  }

  private async send(cmd: string) {
    const encoder = new TextEncoder();
    await this.writer.write(encoder.encode(cmd + "\r\n"));
  }

  private attach(socket: any) {
    this.socket = socket;
    this.reader = socket.readable.getReader();
    this.writer = socket.writable.getWriter();
  }

  async connect() {
    // 先以明文 TCP 连接(secureTransport: starttls 允许后续升级)
    const socket = connect(
      { hostname: "smtp.gmail.com", port: 587 },
      { secureTransport: "starttls" },
    );
    this.attach(socket);
    await this.expect(220); // 服务器问候
  }

  async ehlo(): Promise<boolean> {
    await this.send("EHLO service-chine");
    const reply = await this.expect(250);
    return reply.toUpperCase().includes("STARTTLS");
  }

  async upgradeTls() {
    await this.send("STARTTLS");
    await this.expect(220);
    // 关键:startTls() 返回新 socket,旧的 reader/writer 失效
    const secureSocket = this.socket.startTls();
    this.attach(secureSocket);
    // 升级后重新 EHLO(服务器在 TLS 下可能通告不同能力)
    await this.send("EHLO service-chine");
    await this.expect(250);
  }

  async authLogin(user: string, pass: string) {
    await this.send("AUTH LOGIN");
    await this.expect(334);
    await this.send(base64Utf8(user));
    await this.expect(334);
    await this.send(base64Utf8(pass));
    await this.expect(235);
  }

  async sendMail(
    from: string,
    to: string,
    subject: string,
    textBody: string,
    htmlBody: string,
    replyTo?: string,
  ) {
    await this.send(`MAIL FROM:<${from}>`);
    await this.expect(250);
    await this.send(`RCPT TO:<${to}>`);
    await this.expect(250);
    await this.send("DATA");
    await this.expect(354);

    const boundary = "bsc" + Math.random().toString(36).slice(2);
    const date = new Date().toUTCString();
    const headers = [
      `From: ${from}`,
      `To: ${to}`,
      replyTo ? `Reply-To: ${replyTo}` : "",
      `Subject: ${encodeSubject(subject)}`,
      `Date: ${date}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ]
      .filter(Boolean)
      .join("\r\n");

    const body =
      `--${boundary}\r\n` +
      `Content-Type: text/plain; charset=UTF-8\r\n` +
      `Content-Transfer-Encoding: 8bit\r\n\r\n` +
      `${textBody}\r\n\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: text/html; charset=UTF-8\r\n` +
      `Content-Transfer-Encoding: 8bit\r\n\r\n` +
      `${htmlBody}\r\n\r\n` +
      `--${boundary}--\r\n`;

    await this.send(headers + "\r\n\r\n" + body + ".");
    await this.expect(250);
  }

  async quit() {
    try {
      await this.send("QUIT");
    } finally {
      try {
        await this.writer.close();
      } catch {
        /* ignore */
      }
    }
  }
}

async function sendViaGmailSmtp(
  env: Env,
  to: string,
  subject: string,
  textBody: string,
  htmlBody: string,
  replyTo?: string,
) {
  const client = new SmtpClient();
  await client.connect();
  try {
    const supportsStarttls = await client.ehlo();
    if (supportsStarttls) {
      await client.upgradeTls();
    }
    await client.authLogin(env.GMAIL_USER, env.GMAIL_APP_PASS);
    await client.sendMail(env.GMAIL_USER, to, subject, textBody, htmlBody, replyTo);
  } finally {
    await client.quit();
  }
}

// ── Turnstile 校验 ──

async function verifyTurnstile(
  token: string,
  secret: string,
): Promise<boolean> {
  if (!token) return false;
  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    },
  );
  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}

// ── 主处理函数 ──

export const POST: APIRoute = async ({ request }) => {
  const env = cfEnv as unknown as Env;

  if (!env.GMAIL_USER || !env.GMAIL_APP_PASS) {
    return json(500, { error: "Service e-mail non configuré." });
  }

  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const company = String(form.get("company") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const skype = String(form.get("skype") ?? "").trim();
  const address = String(form.get("address") ?? "").trim();
  const country = String(form.get("country") ?? "").trim();
  const subject = String(form.get("subject") ?? "").trim();
  const message = String(form.get("message") ?? "").trim();
  const turnstileToken = String(form.get("cf-turnstile-response") ?? "");

  // 蜜罐:机器人会填隐藏字段,命中即静默丢弃(伪装成功)
  if (String(form.get("company_website") ?? "").trim()) {
    return new Response(null, {
      status: 303,
      headers: { Location: "/merci" },
    });
  }

  // 服务端校验
  if (!name || !isValidEmail(email) || message.length < 10) {
    return json(400, {
      error: "Veuillez remplir correctement le formulaire.",
    });
  }

  // Turnstile 校验(配置了 secret 才启用)
  if (env.TURNSTILE_SECRET) {
    if (!(await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET))) {
      return json(400, { error: "Échec de la vérification anti-spam." });
    }
  }

  const salesTo = env.LEAD_TO ?? env.GMAIL_USER;

  // a) 线索邮件 → 销售
  const leadSubject = `Nouvelle demande de contact — ${name}${subject ? " — " + subject : ""}`;
  const leadText = [
    `Nouvelle demande de contact`,
    ``,
    `Nom :      ${name}`,
    `E-mail :   ${email}`,
    `Société :  ${company || "—"}`,
    `Tél :      ${phone || "—"}`,
    `Skype :    ${skype || "—"}`,
    `Adresse :  ${address || "—"}`,
    `Pays :     ${country || "—"}`,
    `Sujet :    ${subject || "—"}`,
    ``,
    `Message :`,
    message,
  ].join("\n");
  const leadHtml = `
    <h2>Nouvelle demande de contact</h2>
    <p><strong>Nom :</strong> ${escapeHtml(name)}<br/>
       <strong>E-mail :</strong> ${escapeHtml(email)}<br/>
       <strong>Société :</strong> ${escapeHtml(company || "—")}<br/>
       <strong>Tél :</strong> ${escapeHtml(phone || "—")}<br/>
       <strong>Skype :</strong> ${escapeHtml(skype || "—")}<br/>
       <strong>Adresse :</strong> ${escapeHtml(address || "—")}<br/>
       <strong>Pays :</strong> ${escapeHtml(country || "—")}<br/>
       <strong>Sujet :</strong> ${escapeHtml(subject || "—")}</p>
    <h3>Message</h3>
    <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>`;

  // b) 确认信 → 客户
  const custSubject = "Nous avons bien reçu votre demande";
  const custText = [
    `Bonjour ${name},`,
    ``,
    `Nous vous remercions pour votre message. Nous l'avons bien reçu`,
    `et reviendrons vers vous dans les plus brefs délais.`,
    ``,
    `Cordialement,`,
    `L'équipe Service Chine`,
  ].join("\n");
  const custHtml = `
    <p>Bonjour ${escapeHtml(name)},</p>
    <p>Nous vous remercions pour votre message. Nous l'avons bien reçu
       et reviendrons vers vous dans les plus brefs délais.</p>
    <p>Cordialement,<br/>L'équipe Service Chine</p>`;

  try {
    await sendViaGmailSmtp(env, salesTo, leadSubject, leadText, leadHtml, email);
    if (email !== salesTo) {
      await sendViaGmailSmtp(env, email, custSubject, custText, custHtml);
    }
  } catch (err) {
    console.error("SMTP send failed", err);
    return json(500, {
      error:
        "L'envoi de votre demande a échoué. Veuillez réessayer ultérieurement.",
    });
  }

  return new Response(null, { status: 303, headers: { Location: "/merci" } });
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
