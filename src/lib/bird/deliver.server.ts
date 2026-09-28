import { sendAnonymousMessage } from "@/lib/email/sendAnonymousMessage.server";
import { aiAllowsMessage } from "./aiModerate.server";
import { COPY, REPORT_CATEGORY_IDS, type ReportCategory } from "./copy";
import {
  allowBurst,
  assessLocalChallenge,
  assessSends,
  evaluateGuards,
} from "./guards";
import { messageFingerprint, pepperedHash, recipientHash } from "./hash.server";
import { clientIp, errorResponse, isAllowedOrigin, json, publicOrigin, statusFor } from "./http";
import { moderateMessage } from "./moderate";
import {
  blockHash,
  bumpCounter,
  hasRecentDuplicate,
  insertReport,
  isBlocked,
  recentSendTimes,
  recordSend,
  sweepOldRows,
  unblockHash,
} from "./store.server";
import { signToken, verifyToken } from "./tokens";
import { parseSendBody } from "./validate";

function signalsFor(request: Request, visitorKey: string): string[] {
  const ip = clientIp(request);
  const ua = (request.headers.get("user-agent") ?? "").slice(0, 180);
  const signals = [pepperedHash(`ip:${ip}`), pepperedHash(`uaip:${ip}:${ua}`)];
  if (/^[a-zA-Z0-9-]{8,80}$/.test(visitorKey)) {
    signals.push(pepperedHash(`visitor:${visitorKey}`));
  }
  return signals;
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip !== "unknown") body.set("remoteip", ip);
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;
    const data = (await response.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export async function handleSend(request: Request): Promise<Response> {
  try {
    if (!isAllowedOrigin(request)) return errorResponse("server", 403);
    const length = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(length) && length > 20_000) return errorResponse("too_long", 413);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("server", 400);
    }
    const parsed = parseSendBody(body);
    if (!parsed.ok) return errorResponse(parsed.code, statusFor(parsed.code));

    const now = Date.now();
    const localOk = assessLocalChallenge({
      honeypot: parsed.value.company,
      startedAt: parsed.value.startedAt,
      now,
    });
    const turnstileOk = localOk
      ? await verifyTurnstile(parsed.value.turnstileToken, clientIp(request))
      : false;

    const emailHash = recipientHash(parsed.value.recipientEmail);
    const fingerprint = messageFingerprint(parsed.value.message);
    const signalHashes = signalsFor(request, parsed.value.visitorKey);
    const burstOk = signalHashes.every((signal) => allowBurst(signal, now));

    const [blocked, timesList, duplicate] = await Promise.all([
      isBlocked(emailHash),
      Promise.all(signalHashes.map((signal) => recentSendTimes(signal))),
      hasRecentDuplicate(emailHash, fingerprint),
    ]);
    const rateLimited =
      !burstOk || timesList.some((times) => assessSends(times, now) === "rate");
    const heuristic = moderateMessage(parsed.value.message);
    let guard = evaluateGuards({
      challengeOk: localOk && turnstileOk,
      blocked,
      rateLimited,
      duplicate,
      moderationOk: heuristic.ok,
    });
    if (guard === "ok") {
      const aiOk = await aiAllowsMessage(parsed.value.message);
      if (!aiOk) guard = "moderation";
    }
    if (guard !== "ok") {
      await bumpCounter("send_failed").catch(() => undefined);
      return errorResponse(guard, statusFor(guard));
    }

    const origin = publicOrigin(request);
    const blockToken = signToken({
      purpose: "block",
      recipientHash: emailHash,
      messageFingerprint: fingerprint,
      ttlSec: 60 * 60 * 24 * 45,
    });
    const reportToken = signToken({
      purpose: "report",
      recipientHash: emailHash,
      messageFingerprint: fingerprint,
      ttlSec: 60 * 60 * 24 * 45,
    });

    const sent = await sendAnonymousMessage({
      to: parsed.value.recipientEmail,
      message: parsed.value.message,
      blockUrl: `${origin}/block?token=${encodeURIComponent(blockToken)}`,
      reportUrl: `${origin}/report?token=${encodeURIComponent(reportToken)}`,
      aboutUrl: `${origin}/about`,
      privacyUrl: `${origin}/privacy`,
      termsUrl: `${origin}/terms`,
    });

    if (!sent.ok) {
      await bumpCounter("send_failed").catch(() => undefined);
      return errorResponse("undeliverable", 502);
    }

    await Promise.all(
      signalHashes.map((signal) => recordSend(signal, emailHash, fingerprint)),
    );
    await bumpCounter("send_completed");
    await sweepOldRows();

    return json({ ok: true, delivery: sent.mode });
  } catch (error) {
    console.error("message send failed", error instanceof Error ? error.name : "error");
    return errorResponse("server", 500);
  }
}

export async function handleBlock(request: Request): Promise<Response> {
  try {
    if (!isAllowedOrigin(request)) return errorResponse("server", 403);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("server", 400);
    }
    const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const token = typeof record.token === "string" ? record.token : "";
    const action = record.action === "unblock" ? "unblock" : "block";
    const purpose = action === "unblock" ? "unblock" : "block";
    const payload = verifyToken(token, purpose);
    if (!payload) {
      return json(
        { ok: false, message: "this link has flown off. it may have expired." },
        400,
      );
    }
    if (action === "unblock") {
      await unblockHash(payload.r);
      return json({
        ok: true,
        state: "open",
        message: "birds can visit this address again.",
      });
    }
    await blockHash(payload.r);
    const undoToken = signToken({
      purpose: "unblock",
      recipientHash: payload.r,
      messageFingerprint: payload.m,
      ttlSec: 60 * 60 * 24 * 14,
    });
    return json({
      ok: true,
      state: "blocked",
      undoToken,
      message: "this address won't receive any more birds.",
    });
  } catch (error) {
    console.error("block failed", error instanceof Error ? error.name : "error");
    return errorResponse("server", 500);
  }
}

export async function handleReport(request: Request): Promise<Response> {
  try {
    if (!isAllowedOrigin(request)) return errorResponse("server", 403);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("server", 400);
    }
    const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const token = typeof record.token === "string" ? record.token : "";
    const category = typeof record.category === "string" ? record.category : "";
    const noteRaw = typeof record.note === "string" ? record.note : "";
    const payload = verifyToken(token, "report");
    if (!payload || !REPORT_CATEGORY_IDS.includes(category as ReportCategory)) {
      return json(
        { ok: false, message: "this link has flown off. it may have expired." },
        400,
      );
    }
    const note = noteRaw.replace(/\0/g, "").trim().slice(0, 500);
    const reportKey = pepperedHash(`report:${token}`);
    await insertReport(reportKey, category, note || null);
    await sweepOldRows();
    return json({
      ok: true,
      message: "thanks for letting us know. we'll review it.",
    });
  } catch (error) {
    console.error("report failed", error instanceof Error ? error.name : "error");
    return errorResponse("server", 500);
  }
}

export async function handleEvent(request: Request): Promise<Response> {
  try {
    if (!isAllowedOrigin(request)) return json({ ok: false }, 403);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false }, 400);
    }
    const name =
      body && typeof body === "object" && typeof (body as { name?: unknown }).name === "string"
        ? (body as { name: string }).name
        : "";
    const saved = await bumpCounter(name);
    if (!saved) return json({ ok: false }, 400);
    return json({ ok: true });
  } catch {
    return json({ ok: false }, 500);
  }
}

export { COPY };
