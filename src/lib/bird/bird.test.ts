import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import { renderAnonymousMessageEmail } from "../../emails/anonymousMessage.ts";
import { readSmtpConfig, sendAnonymousMessage } from "../email/sendAnonymousMessage.server.ts";
import { COPY } from "./copy.ts";
import { escapeHtml } from "./escape.ts";
import {
  allowBurst,
  assessLocalChallenge,
  assessSends,
  evaluateGuards,
  isDuplicate,
} from "./guards.ts";
import { moderateMessage } from "./moderate.ts";
import { signToken, verifyToken, verifyWebhookSignature } from "./tokens.ts";
import { normalizeEmail, normalizeMessage, parseSendBody } from "./validate.ts";

const now = 1_700_000_000_000;

describe("email validation", () => {
  it("accepts a normal address and lowercases the domain", () => {
    assert.equal(normalizeEmail("  Ada@Example.com "), "ada@example.com");
  });

  it("rejects empty, spaced, and nonsense addresses", () => {
    assert.equal(normalizeEmail(""), null);
    assert.equal(normalizeEmail("not an email"), null);
    assert.equal(normalizeEmail("a@b"), null);
    assert.equal(normalizeEmail("bird@example.com\nBcc:evil@example.com"), null);
  });
});

describe("messages", () => {
  it("rejects a blank note", () => {
    assert.deepEqual(normalizeMessage("   \n"), { ok: false, code: "empty" });
  });

  it("rejects a note over 1,000 characters", () => {
    const huge = "a".repeat(1001);
    assert.deepEqual(normalizeMessage(huge), { ok: false, code: "too_long" });
  });

  it("trims and keeps a normal note", () => {
    assert.deepEqual(normalizeMessage("  hello there  "), { ok: true, text: "hello there" });
  });
});

describe("guards", () => {
  it("rate-limits a burst inside the hour", () => {
    const stamps = Array.from({ length: 5 }, (_, i) => now - i * 60_000);
    assert.equal(assessSends(stamps, now), "rate");
  });

  it("rate-limits a second send inside the rest gap", () => {
    assert.equal(assessSends([now - 1000], now), "rate");
  });

  it("allows a quiet sender", () => {
    assert.equal(assessSends([now - 60_000], now), "ok");
  });

  it("detects a duplicate inside the window", () => {
    assert.equal(
      isDuplicate([{ fingerprint: "abc", at: now - 1000 }], "abc", now),
      true,
    );
    assert.equal(
      isDuplicate([{ fingerprint: "abc", at: now - 31 * 60 * 1000 }], "abc", now),
      false,
    );
  });

  it("refuses blocked recipients with a generic result", () => {
    assert.equal(
      evaluateGuards({
        challengeOk: true,
        blocked: true,
        rateLimited: false,
        duplicate: false,
        moderationOk: true,
      }),
      "undeliverable",
    );
    assert.equal(COPY.undeliverable, "we couldn't deliver this note.");
  });

  it("rejects an invalid local challenge", () => {
    assert.equal(
      assessLocalChallenge({ honeypot: "filled", startedAt: now - 5000, now }),
      false,
    );
    assert.equal(
      assessLocalChallenge({ honeypot: "", startedAt: now - 100, now }),
      false,
    );
    assert.equal(
      evaluateGuards({
        challengeOk: false,
        blocked: false,
        rateLimited: false,
        duplicate: false,
        moderationOk: true,
      }),
      "captcha",
    );
  });

  it("slows a process-local burst", () => {
    const key = `burst-${now}`;
    assert.equal(allowBurst(key, now), true);
    assert.equal(allowBurst(key, now + 1), true);
    assert.equal(allowBurst(key, now + 2), true);
    assert.equal(allowBurst(key, now + 3), true);
    assert.equal(allowBurst(key, now + 4), false);
  });
});

describe("tokens", () => {
  it("round-trips a report token and rejects a tampered one", () => {
    const token = signToken({
      purpose: "report",
      recipientHash: "ab".repeat(32),
      messageFingerprint: "cd".repeat(32),
      ttlSec: 60,
    });
    assert.ok(verifyToken(token, "report"));
    assert.equal(verifyToken(token, "block"), null);
    const [data, sig] = token.split(".");
    assert.equal(verifyToken(`${data}.${sig.slice(0, -2)}aa`, "report"), null);
  });

  it("rejects an expired block token", () => {
    const token = signToken({
      purpose: "block",
      recipientHash: "ab".repeat(32),
      messageFingerprint: "cd".repeat(32),
      ttlSec: -10,
    });
    assert.equal(verifyToken(token, "block"), null);
  });

  it("verifies a webhook signature and rejects a bad body", () => {
    const secret = Buffer.from("bird-secret").toString("base64");
    const body = JSON.stringify({ type: "email.bounced" });
    const id = "msg_1";
    const timestamp = "1700000000";
    const signature = createHmac("sha256", Buffer.from(secret, "base64"))
      .update(`${id}.${timestamp}.${body}`)
      .digest("base64");
    const header = `v1,${signature}`;
    assert.equal(
      verifyWebhookSignature({
        secret: `whsec_${secret}`,
        id,
        timestamp,
        signature: header,
        body,
        nowSec: 1700000000,
      }),
      true,
    );
    assert.equal(
      verifyWebhookSignature({
        secret: `whsec_${secret}`,
        id,
        timestamp,
        signature: header,
        body: body + " ",
        nowSec: 1700000000,
      }),
      false,
    );
  });
});

describe("content safety and injection", () => {
  it("blocks threats, markup, and allows an ordinary note", () => {
    assert.equal(moderateMessage("I will kill you").ok, false);
    assert.equal(moderateMessage("<script>alert(1)</script>").ok, false);
    assert.equal(moderateMessage("thanks for sitting with me yesterday").ok, true);
  });

  it("escapes HTML before it can become markup in the email", () => {
    const raw = `<script>alert("x")</script>`;
    const escaped = escapeHtml(raw);
    assert.equal(escaped.includes("<script>"), false);
    const email = renderAnonymousMessageEmail({
      message: "hello < friend",
      blockUrl: "https://alittlebird.com/block?token=a",
      reportUrl: "https://alittlebird.com/report?token=b",
      aboutUrl: "https://alittlebird.com/about",
      privacyUrl: "https://alittlebird.com/privacy",
      termsUrl: "https://alittlebird.com/terms",
    });
    const expectedHtml = "hello " + String.fromCharCode(38) + "lt; friend";
    assert.equal(email.html.includes("<script>"), false);
    assert.equal(email.html.includes(expectedHtml), true);
    assert.equal(email.text.includes("sender IP"), false);
  });
});

describe("email sending", () => {
  it("does not claim delivery when the provider fails", async () => {
    const result = await sendAnonymousMessage(
      {
        to: "a@example.com",
        message: "hi",
        blockUrl: "https://alittlebird.com/block",
        reportUrl: "https://alittlebird.com/report",
        aboutUrl: "https://alittlebird.com/about",
        privacyUrl: "https://alittlebird.com/privacy",
        termsUrl: "https://alittlebird.com/terms",
      },
      {
        apiKey: "re_test",
        fetchImpl: async () => new Response("nope", { status: 500 }),
      },
    );
    assert.deepEqual(result, { ok: false, mode: "failed" });
  });

  it("stays in preview when no provider key is configured", async () => {
    let called = false;
    const result = await sendAnonymousMessage(
      {
        to: "a@example.com",
        message: "hi",
        blockUrl: "https://alittlebird.com/block",
        reportUrl: "https://alittlebird.com/report",
        aboutUrl: "https://alittlebird.com/about",
        privacyUrl: "https://alittlebird.com/privacy",
        termsUrl: "https://alittlebird.com/terms",
      },
      {
        apiKey: null,
        smtp: null,
        fetchImpl: async () => {
          called = true;
          return new Response("{}");
        },
      },
    );
    assert.equal(called, false);
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.mode, "preview");
  });

  it("sends through SMTP when a mailbox is configured", async () => {
    let captured: { from?: string; to?: string; subject?: string; replyTo?: string } | null = null;
    const result = await sendAnonymousMessage(
      {
        to: "a@example.com",
        message: "hi",
        blockUrl: "https://alittlebird.com/block",
        reportUrl: "https://alittlebird.com/report",
        aboutUrl: "https://alittlebird.com/about",
        privacyUrl: "https://alittlebird.com/privacy",
        termsUrl: "https://alittlebird.com/terms",
      },
      {
        apiKey: null,
        smtp: {
          host: "smtp.purelymail.com",
          port: 465,
          secure: true,
          user: "bird@alittlebird.com",
          pass: "secret",
        },
        sendMail: async (message) => {
          captured = message;
          return { messageId: "<abc@alittlebird.com>" };
        },
      },
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.mode, "accepted");
      assert.equal(result.providerId, "<abc@alittlebird.com>");
    }
    assert.equal(captured?.to, "a@example.com");
    assert.equal(captured?.subject, "a little bird told us something...");
    assert.equal(captured?.replyTo, "noreply@alittlebird.com");
  });

  it("reads Purelymail defaults from SMTP user and password", () => {
    const smtp = readSmtpConfig({
      SMTP_USER: "bird@alittlebird.com",
      SMTP_PASS: "secret",
    });
    assert.deepEqual(smtp, {
      host: "smtp.purelymail.com",
      port: 465,
      secure: true,
      user: "bird@alittlebird.com",
      pass: "secret",
    });
    assert.equal(readSmtpConfig({}), null);
  });
});

describe("request parsing", () => {
  it("rejects a body that is not a note", () => {
    const parsed = parseSendBody({
      recipientEmail: "nope",
      message: "hello",
      startedAt: now,
    });
    assert.equal(parsed.ok, false);
  });
});
