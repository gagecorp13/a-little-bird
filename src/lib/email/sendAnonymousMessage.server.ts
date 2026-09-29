import { renderAnonymousMessageEmail } from "../../emails/anonymousMessage.ts";

export type EmailSendInput = {
  to: string;
  message: string;
  blockUrl: string;
  reportUrl: string;
  aboutUrl: string;
  privacyUrl: string;
  termsUrl: string;
};

export type EmailSendResult =
  | { ok: true; mode: "accepted"; providerId: string | null }
  | { ok: true; mode: "preview"; providerId: null }
  | { ok: false; mode: "failed" };

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
};

type OutboundMail = {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
};

type SendOptions = {
  apiKey?: string | null;
  /** `null` forces no SMTP. Omit to read `SMTP_*` from the environment. */
  smtp?: SmtpConfig | null;
  from?: string;
  replyTo?: string;
  fetchImpl?: typeof fetch;
  sendMail?: (message: OutboundMail) => Promise<{ messageId?: string | null }>;
};

const SUBJECT = "a little bird told us something...";

export function readSmtpConfig(
  env: Record<string, string | undefined> = process.env,
): SmtpConfig | null {
  const user = env.SMTP_USER?.trim();
  const pass = env.SMTP_PASS?.trim();
  if (!user || !pass) return null;
  const port = Number(env.SMTP_PORT?.trim() || "465");
  const host = env.SMTP_HOST?.trim() || "smtp.purelymail.com";
  const secure =
    env.SMTP_SECURE === undefined || env.SMTP_SECURE.trim() === ""
      ? port === 465
      : env.SMTP_SECURE.trim() !== "false";
  return {
    host,
    port: Number.isFinite(port) ? port : 465,
    secure,
    user,
    pass,
  };
}

async function deliverSmtp(
  smtp: SmtpConfig,
  message: OutboundMail,
  sendMail?: SendOptions["sendMail"],
): Promise<string | null> {
  if (sendMail) {
    const info = await sendMail(message);
    return info.messageId ?? null;
  }
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  const info = await transporter.sendMail(message);
  return typeof info.messageId === "string" ? info.messageId : null;
}

export async function sendAnonymousMessage(
  input: EmailSendInput,
  options: SendOptions = {},
): Promise<EmailSendResult> {
  const smtp = options.smtp === undefined ? readSmtpConfig() : options.smtp;
  const apiKey =
    options.apiKey === undefined ? process.env.RESEND_API_KEY?.trim() || null : options.apiKey;
  if (!smtp && !apiKey) return { ok: true, mode: "preview", providerId: null };

  const rendered = renderAnonymousMessageEmail(input);
  const from =
    options.from ??
    (process.env.EMAIL_FROM?.trim() || "a little bird <bird@alittlebird.com>");
  const replyTo =
    options.replyTo ?? (process.env.EMAIL_REPLY_TO?.trim() || "noreply@alittlebird.com");
  const message: OutboundMail = {
    from,
    to: input.to,
    replyTo,
    subject: SUBJECT,
    html: rendered.html,
    text: rendered.text,
  };

  if (smtp) {
    try {
      const providerId = await deliverSmtp(smtp, message, options.sendMail);
      return { ok: true, mode: "accepted", providerId };
    } catch {
      return { ok: false, mode: "failed" };
    }
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  try {
    const response = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        reply_to: replyTo,
        subject: SUBJECT,
        html: rendered.html,
        text: rendered.text,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return { ok: false, mode: "failed" };
    const payload = (await response.json()) as { id?: unknown };
    const providerId = typeof payload.id === "string" ? payload.id : null;
    return { ok: true, mode: "accepted", providerId };
  } catch {
    return { ok: false, mode: "failed" };
  }
}
