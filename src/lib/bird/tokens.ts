import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export type TokenPurpose = "block" | "unblock" | "report";

export type TokenPayload = {
  p: TokenPurpose;
  r: string;
  m: string;
  e: number;
  n: string;
};

function secret(): string {
  return process.env.APP_SECRET?.trim() || "preview-bird-secret-not-for-production";
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function signToken(input: {
  purpose: TokenPurpose;
  recipientHash: string;
  messageFingerprint: string;
  ttlSec?: number;
}): string {
  const payload: TokenPayload = {
    p: input.purpose,
    r: input.recipientHash,
    m: input.messageFingerprint,
    e: Math.floor(Date.now() / 1000) + (input.ttlSec ?? 60 * 60 * 24 * 30),
    n: randomBytes(8).toString("hex"),
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function verifyToken(token: string, purpose: TokenPurpose): TokenPayload | null {
  if (typeof token !== "string" || token.length > 2000) return null;
  const dot = token.indexOf(".");
  if (dot <= 0 || token.indexOf(".", dot + 1) !== -1) return null;
  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(data);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as TokenPayload;
    if (payload.p !== purpose) return null;
    if (typeof payload.r !== "string" || typeof payload.m !== "string") return null;
    if (typeof payload.e !== "number" || payload.e < Date.now() / 1000) return null;
    if (!/^[a-f0-9]{16,128}$/i.test(payload.r)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function verifyWebhookSignature(opts: {
  secret: string;
  id: string;
  timestamp: string;
  signature: string;
  body: string;
  nowSec?: number;
  toleranceSec?: number;
}): boolean {
  if (!opts.secret || !opts.id || !opts.timestamp || !opts.signature) return false;
  const now = opts.nowSec ?? Math.floor(Date.now() / 1000);
  const ts = Number(opts.timestamp);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > (opts.toleranceSec ?? 300)) return false;
  let key: Buffer;
  try {
    key = Buffer.from(opts.secret.replace(/^whsec_/, ""), "base64");
  } catch {
    return false;
  }
  if (key.length === 0) return false;
  const expected = createHmac("sha256", key)
    .update(`${opts.id}.${opts.timestamp}.${opts.body}`)
    .digest("base64");
  return opts.signature.split(" ").some((part) => {
    const sig = part.startsWith("v1,") ? part.slice(3) : part;
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}
