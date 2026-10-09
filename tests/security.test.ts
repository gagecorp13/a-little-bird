import { beforeEach, describe, it, expect, vi } from "vitest";
import { ipBucket, recipientIds } from "@/lib/server/identity";
import { createToken, verifyToken } from "@/lib/server/control-tokens";
import { escapeHtml, renderEmail } from "@/lib/server/email";
import { summary, type Operation } from "@/lib/server/store";
import { readBody } from "@/lib/server/http";
import { deliveryConfigured } from "@/lib/server/config";
const op: Operation = {
  id: "a".repeat(64),
  ip: "b".repeat(64),
  fingerprint: "c".repeat(64),
  started: Date.now(),
  items: [{ rid: "d".repeat(64), kid: "v1", suppress: [], state: "accepted" }],
};
beforeEach(() => {
  vi.stubEnv("RECIPIENT_HMAC_KEYS", JSON.stringify({ v1: "r".repeat(40) }));
  vi.stubEnv("RECIPIENT_HMAC_ACTIVE_KID", "v1");
  vi.stubEnv("CONTROL_TOKEN_KEYS", JSON.stringify({ v1: "t".repeat(40) }));
  vi.stubEnv("CONTROL_TOKEN_ACTIVE_KID", "v1");
  vi.stubEnv("SUBMISSION_HMAC_SECRET", "s".repeat(40));
});
describe("privacy primitives", () => {
  it("canonicalizes IPv4 mapped addresses and IPv6 /64", () => {
    expect(ipBucket("::ffff:192.0.2.1")).toBe(ipBucket("192.0.2.1"));
    expect(ipBucket("2001:db8:1:2::1")).toBe(ipBucket("2001:db8:1:2::abcd"));
    expect(() => ipBucket("1.2.3.4,5.6.7.8")).toThrow();
  });
  it("uses keyed stable recipient IDs", () => {
    expect(recipientIds("A@example.com")).toEqual(recipientIds("a@EXAMPLE.com"));
    expect(JSON.stringify(recipientIds("a@example.com"))).not.toContain("@");
  });
  it("scopes, authenticates and expires control tokens", () => {
    const token = createToken("opt-out", op.items[0].rid, "v1", op.id, Date.now());
    expect(verifyToken(token, "opt-out")).toBeTruthy();
    expect(verifyToken(token, "report")).toBeNull();
    expect(verifyToken(token.slice(0, -1) + "z", "opt-out")).toBeNull();
    expect(
      verifyToken(
        createToken("report", op.items[0].rid, "v1", op.id, Date.now() - 31 * 86400000),
        "report",
      ),
    ).toBeNull();
    expect(
      verifyToken(
        createToken("opt-out", op.items[0].rid, "v1", op.id, Date.now() - 365 * 86400000),
        "opt-out",
      ),
    ).toBeTruthy();
  });
  it("contains all text without HTML injection", () => {
    const message = "<script>alert('x')</script>\n& 🌿";
    const e = renderEmail(message, op, 0);
    expect(e.text).toContain(message);
    expect(e.html).not.toContain("<script>");
    expect(e.html).toContain("&lt;script&gt;");
    expect(escapeHtml("<&")).toBe("&lt;&amp;");
    expect(e.idempotencyKey).toMatch(/^[a-f0-9]{64}$/);
    expect(renderEmail(message, op, 0)).toEqual(e);
  });
  it("does not turn private suppression into public status", () => {
    expect(summary({ ...op, items: [{ ...op.items[0], state: "skipped" }] })).toBe("processed");
    expect(summary({ ...op, items: [{ ...op.items[0], state: "unknown" }] })).toBe("unknown");
    expect(summary({ ...op, items: [op.items[0], { ...op.items[0], state: "failed" }] })).toBe(
      "partial",
    );
  });
  it("caps actual body bytes", async () => {
    await expect(
      readBody(
        new Request("https://alittlebird.com/api/send", {
          method: "POST",
          body: "a".repeat(17000),
        }),
      ),
    ).rejects.toMatchObject({ status: 413 });
  });
  it("does not enable without configuration", () => {
    vi.stubEnv("SENDING_ENABLED", "false");
    expect(deliveryConfigured()).toBe(false);
  });
});
