import { beforeEach, describe, it, expect, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  ready: vi.fn(),
  attempt: vi.fn(),
  get: vi.fn(),
  reserve: vi.fn(),
  transition: vi.fn(),
  permit: vi.fn(),
  verify: vi.fn(),
}));
vi.mock("@/lib/server/config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/server/config")>()),
  deliveryConfigured: mocks.ready,
}));
vi.mock("@/lib/server/store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/server/store")>()),
  attemptAllowed: mocks.attempt,
  getOperation: mocks.get,
  reserve: mocks.reserve,
  transition: mocks.transition,
  providerPermit: mocks.permit,
}));
vi.mock("@/lib/server/turnstile", () => ({ verifyTurnstile: mocks.verify }));
import { POST } from "@/app/api/send/route";
import { operationId, fingerprint, clientKey } from "@/lib/server/identity";
import type { Operation } from "@/lib/server/store";
const payload = {
  submissionId: "01911111-1111-4111-8111-111111111111",
  recipients: ["a@example.com", "b@example.com"],
  message: "Private note <b>as text</b>",
  turnstileToken: "test-token",
  website: "",
};
const request = (origin = "https://alittlebird.com") =>
  new Request("https://alittlebird.com/api/send", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
let current: Operation | undefined;
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("APP_ORIGIN", "https://alittlebird.com");
  vi.stubEnv("MAIL_MODE", "production");
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("IP_HMAC_SECRET", "i".repeat(40));
  vi.stubEnv("SUBMISSION_HMAC_SECRET", "s".repeat(40));
  vi.stubEnv("RECIPIENT_HMAC_KEYS", JSON.stringify({ v1: "r".repeat(40) }));
  vi.stubEnv("RECIPIENT_HMAC_ACTIVE_KID", "v1");
  vi.stubEnv("CONTROL_TOKEN_KEYS", JSON.stringify({ v1: "t".repeat(40) }));
  vi.stubEnv("CONTROL_TOKEN_ACTIVE_KID", "v1");
  current = undefined;
  mocks.ready.mockReturnValue(true);
  mocks.attempt.mockResolvedValue(true);
  mocks.verify.mockResolvedValue(true);
  mocks.permit.mockResolvedValue(true);
  mocks.get.mockImplementation(async () => current);
  mocks.reserve.mockImplementation(async (op: Operation) => {
    current = structuredClone(op);
    return { kind: "created", op: structuredClone(op) };
  });
  mocks.transition.mockImplementation(
    async (_op: Operation, i: number, from: string, to: Operation["items"][number]["state"]) => {
      if (current?.items[i].state === from) current.items[i].state = to;
      return current?.items[i].state;
    },
  );
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async () => Response.json({ id: "provider-id" })),
  );
});
describe("send failure and retry behavior", () => {
  it("fails closed before providers when disabled", async () => {
    mocks.ready.mockReturnValue(false);
    expect((await POST(request())).status).toBe(503);
    expect(mocks.attempt).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("rejects a different origin before consuming store or bot checks", async () => {
    expect((await POST(request("https://other.example"))).status).toBe(403);
    expect(mocks.attempt).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("requires bot verification before reservation and delivery", async () => {
    mocks.verify.mockResolvedValue(false);
    expect((await POST(request())).status).toBe(403);
    expect(mocks.reserve).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("sends separate private messages with stable idempotency keys", async () => {
    expect(await (await POST(request())).json()).toEqual({ code: "processed" });
    expect(fetch).toHaveBeenCalledTimes(2);
    const calls = vi.mocked(fetch).mock.calls;
    expect(JSON.parse(calls[0][1]!.body as string).to).toEqual(["a@example.com"]);
    expect(JSON.parse(calls[1][1]!.body as string).to).toEqual(["b@example.com"]);
    expect(calls[0][1]!.headers).toHaveProperty("Idempotency-Key");
    const retry = await POST(request());
    expect(await retry.json()).toEqual({ code: "processed" });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("never retries after an ambiguous network timeout", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network timeout"));
    expect(await (await POST(request())).json()).toEqual({ code: "unknown" });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(await (await POST(request())).json()).toEqual({ code: "unknown" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("reports uncertainty if storing an accepted provider response fails", async () => {
    mocks.transition.mockImplementation(
      async (_op: Operation, i: number, from: string, to: string) => {
        if (to !== "dispatching") throw new Error("store down");
        if (current) current.items[i].state = "dispatching";
        return "dispatching";
      },
    );
    expect(await (await POST(request())).json()).toEqual({ code: "unknown" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("does not disclose recipient suppression", async () => {
    mocks.reserve.mockImplementation(async (op: Operation) => {
      current = structuredClone(op);
      current.items.forEach((x) => (x.state = "skipped"));
      return { kind: "created", op: current };
    });
    expect(await (await POST(request())).json()).toEqual({ code: "processed" });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("binds retries to the original IP and message", async () => {
    current = {
      id: operationId(payload.submissionId),
      ip: clientKey(request()),
      fingerprint: fingerprint("a different note", payload.recipients),
      started: Date.now(),
      items: [],
    };
    expect((await POST(request())).status).toBe(409);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("makes no delivery attempt after the shared store fails", async () => {
    mocks.attempt.mockRejectedValue(new Error("store unavailable"));
    expect((await POST(request())).status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });
});
