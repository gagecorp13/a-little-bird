import { createHmac } from "node:crypto";

function pepper(): string {
  return process.env.APP_SECRET?.trim() || "preview-bird-secret-not-for-production";
}

export function pepperedHash(value: string): string {
  return createHmac("sha256", pepper()).update(value).digest("hex");
}

export function recipientHash(email: string): string {
  return pepperedHash(`email:${email}`);
}

export function messageFingerprint(text: string): string {
  return pepperedHash(`msg:${text}`);
}
