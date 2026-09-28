import { COPY, type CopyCode } from "./copy.ts";

export const MAX_MESSAGE_LENGTH = 1000;

const EMAIL_RE =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export function normalizeEmail(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || trimmed.length > 254) return null;
  if (/[\s\r\n]/.test(trimmed)) return null;
  if (!EMAIL_RE.test(trimmed)) return null;
  const at = trimmed.lastIndexOf("@");
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (!local || !domain || local.length > 64) return null;
  if (domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) return null;
  return `${local}@${domain}`;
}

export function normalizeMessage(
  raw: string,
): { ok: true; text: string } | { ok: false; code: "empty" | "too_long" } {
  if (typeof raw !== "string") return { ok: false, code: "empty" };
  const text = raw.replace(/\r\n/g, "\n").replace(/\0/g, "").trim();
  if (!text) return { ok: false, code: "empty" };
  if ([...text].length > MAX_MESSAGE_LENGTH) return { ok: false, code: "too_long" };
  return { ok: true, text };
}

export type SendInput = {
  recipientEmail: string;
  message: string;
  visitorKey: string;
  company: string;
  startedAt: number;
  turnstileToken: string;
};

export function parseSendBody(
  body: unknown,
): { ok: true; value: SendInput } | { ok: false; code: CopyCode } {
  if (!body || typeof body !== "object") return { ok: false, code: "server" };
  const record = body as Record<string, unknown>;
  if (typeof record.recipientEmail !== "string") return { ok: false, code: "invalid_email" };
  const email = normalizeEmail(record.recipientEmail);
  if (!email) return { ok: false, code: "invalid_email" };
  if (typeof record.message !== "string") return { ok: false, code: "empty" };
  const message = normalizeMessage(record.message);
  if (!message.ok) return { ok: false, code: message.code };
  const visitorKey = typeof record.visitorKey === "string" ? record.visitorKey.slice(0, 80) : "";
  const company = typeof record.company === "string" ? record.company.slice(0, 200) : "";
  const startedAt = typeof record.startedAt === "number" ? record.startedAt : Number.NaN;
  const turnstileToken =
    typeof record.turnstileToken === "string" ? record.turnstileToken.slice(0, 2048) : "";
  return {
    ok: true,
    value: {
      recipientEmail: email,
      message: message.text,
      visitorKey,
      company,
      startedAt,
      turnstileToken,
    },
  };
}

export function fieldMessage(code: CopyCode): string {
  return COPY[code];
}
