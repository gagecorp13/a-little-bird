import { beforeAll, beforeEach, afterAll, describe, it, expect, vi } from "vitest";
import {
  redis,
  key,
  reserve,
  transition,
  getOperation,
  summary,
  type Operation,
} from "@/lib/server/store";
const enabled = process.env.RUN_STORE_INTEGRATION === "true";
const namespaces: string[] = [];
let clock: number;
const op = (n: number, ip = "a".repeat(64), count = 1): Operation => ({
  id: n.toString(16).padStart(64, "0"),
  ip,
  fingerprint: "f".repeat(64),
  started: clock,
  items: Array.from({ length: count }, (_, i) => ({
    rid: (i + 1).toString(16).padStart(64, "0"),
    kid: "v1",
    suppress: [key("suppression:v1:" + (i + 1).toString(16).padStart(64, "0"))],
    state: "pending",
  })),
});
describe.skipIf(!enabled)("real shared Redis atomic controls", () => {
  beforeAll(() => {
    clock = Date.now();
    vi.spyOn(Date, "now").mockImplementation(() => clock);
  });
  beforeEach(async () => {
    const ns = "alb:verify:" + crypto.randomUUID();
    namespaces.push(ns);
    vi.stubEnv("REDIS_NAMESPACE", ns);
    await redis().set(key("security:initialized"), "1");
    await redis().set(key("security:sending_enabled"), "1");
  });
  afterAll(async () => {
    for (const ns of namespaces) {
      const keys = await redis().keys(ns + ":*");
      if (keys.length) await redis().del(...keys);
    }
    vi.restoreAllMocks();
  });
  it("rejects missing initialization and disabled delivery markers", async () => {
    await redis().del(key("security:initialized"));
    expect((await reserve(op(1))).kind).toBe("disabled");
    await redis().set(key("security:initialized"), "1");
    await redis().set(key("security:sending_enabled"), "0");
    expect((await reserve(op(2))).kind).toBe("disabled");
  });
  it("allows only one simultaneous reservation from an IP", async () => {
    const results = await Promise.all(Array.from({ length: 8 }, (_, i) => reserve(op(i + 1))));
    expect(results.filter((x) => x.kind === "created")).toHaveLength(1);
    expect(results.filter((x) => x.kind === "limited")).toHaveLength(7);
  });
  it("reserves recipient units atomically and bounds global volume", async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) => reserve(op(i + 1, i.toString(16).padStart(64, "0"), 5))),
    );
    expect(results.filter((x) => x.kind === "created")).toHaveLength(16);
    expect(await redis().zcard(key("global:day"))).toBe(80);
  });
  it("never recharges a repeated submission", async () => {
    const first = await reserve(op(1));
    expect(first.kind).toBe("created");
    expect((await reserve(op(1))).kind).toBe("existing");
    expect(await redis().zcard(key("global:day"))).toBe(1);
  });
  it("honors suppression during reservation and immediately before dispatch", async () => {
    const proposed = op(1);
    await redis().set(proposed.items[0].suppress[0], "blocked");
    const first = await reserve(proposed);
    expect(first.op?.items[0].state).toBe("skipped");
    expect(summary(first.op!)).toBe("processed");
    clock += 61000;
    const second = op(2, "b".repeat(64));
    second.items[0].rid = "c".repeat(64);
    second.items[0].suppress = [key("suppression:v1:" + second.items[0].rid)];
    await reserve(second);
    await redis().set(second.items[0].suppress[0], "blocked");
    expect(await transition(second, 0, "pending", "dispatching")).toBe("skipped");
  });
  it("enforces pair limits privately and preserves expiry on transitions", async () => {
    const first = op(1);
    await reserve(first);
    await transition(first, 0, "pending", "dispatching");
    await transition(first, 0, "dispatching", "accepted", "id");
    const ttl = await redis().ttl(key("op:" + first.id));
    expect(ttl).toBeGreaterThan(93000);
    clock += 61000;
    const second = await reserve(op(2));
    expect(second.op?.items[0].state).toBe("skipped");
    expect((await getOperation(first.id))?.items[0].state).toBe("accepted");
  });
  it("prevents duplicate dispatch claims and observes emergency pause", async () => {
    const proposed = op(1);
    await reserve(proposed);
    const claims = await Promise.all([
      transition(proposed, 0, "pending", "dispatching"),
      transition(proposed, 0, "pending", "dispatching"),
    ]);
    expect(claims.filter((x) => x === "dispatching")).toHaveLength(1);
    expect(claims.filter((x) => x === "unchanged")).toHaveLength(1);
    await redis().set(key("security:sending_enabled"), "0");
    clock += 61000;
    const next = op(2, "b".repeat(64));
    expect((await reserve(next)).kind).toBe("disabled");
  });
});
