import "server-only";
import { appOrigin } from "./config";
import { createToken } from "./control-tokens";
import { mac } from "./identity";
import { secret } from "./config";
import type { Operation } from "./store";
export const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
export function renderEmail(message: string, op: Operation, index: number) {
  const item = op.items[index];
  const delivery = mac(secret("SUBMISSION_HMAC_SECRET"), "delivery", op.id + ":" + index);
  const origin = appOrigin();
  const opt =
    origin + "/opt-out#token=" + createToken("opt-out", item.rid, item.kid, delivery, op.started);
  const report =
    origin + "/report#token=" + createToken("report", item.rid, item.kid, delivery, op.started);
  const site = process.env.EMAIL_INCLUDE_SITE_LINK !== "false";
  const footer =
    "Sent through a little bird without a sender name or email. Replies will not reach the sender.";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f4eddf;color:#241c15;font-family:Georgia,serif"><div style="display:none;max-height:0;overflow:hidden">A little note, carried your way.</div><table role="presentation" width="100%" style="border-collapse:collapse"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" style="max-width:600px;margin:auto;border-collapse:collapse"><tr><td style="background:#a7310d;color:#fff9ed;padding:22px 28px;font-size:28px">a little bird</td></tr><tr><td style="background:#fffcf4;padding:28px"><p style="margin-top:0">A little bird brought you a note.</p><div style="white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;font-family:Georgia,serif;font-size:18px;line-height:1.65;border-left:2px solid #ad3b19;padding:12px 18px;margin:24px 0">${escapeHtml(message)}</div><p style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6">${footer}</p>${site ? `<p><a style="color:#8f290b" href="${origin}">Visit a little bird</a></p>` : ""}<p style="font-family:Arial,sans-serif;font-size:13px;line-height:1.8"><a style="color:#8f290b" href="${report}">Report this message</a><br><a style="color:#8f290b" href="${opt}">Stop future emails</a><br><a style="color:#8f290b" href="${origin}/privacy">Privacy</a></p></td></tr></table></td></tr></table></body></html>`;
  const text = [
    "a little bird",
    "",
    "A little bird brought you a note.",
    "",
    message,
    "",
    footer,
    ...(site ? ["", "Visit a little bird: " + origin] : []),
    "",
    "Report this message: " + report,
    "Stop future emails: " + opt,
    "Privacy: " + origin + "/privacy",
  ].join("\n");
  return { html, text, idempotencyKey: delivery };
}
