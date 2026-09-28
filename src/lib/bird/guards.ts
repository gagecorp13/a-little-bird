export const LIMITS = {
  minGapMs: 8_000,
  perHour: 5,
  perDay: 20,
  duplicateWindowMs: 30 * 60 * 1000,
  dayMs: 24 * 60 * 60 * 1000,
  hourMs: 60 * 60 * 1000,
};

export type GuardResult =
  | "ok"
  | "captcha"
  | "undeliverable"
  | "rate"
  | "duplicate"
  | "moderation";

export function assessSends(timestamps: number[], now: number): "ok" | "rate" {
  const day = timestamps.filter((t) => now - t < LIMITS.dayMs && now - t >= 0);
  if (day.length >= LIMITS.perDay) return "rate";
  const hour = day.filter((t) => now - t < LIMITS.hourMs);
  if (hour.length >= LIMITS.perHour) return "rate";
  let last = 0;
  for (const t of timestamps) if (t > last && t <= now) last = t;
  if (last && now - last < LIMITS.minGapMs) return "rate";
  return "ok";
}

export function isDuplicate(
  prior: { fingerprint: string; at: number }[],
  fingerprint: string,
  now: number,
): boolean {
  return prior.some(
    (item) => item.fingerprint === fingerprint && now - item.at < LIMITS.duplicateWindowMs && now >= item.at,
  );
}

export function assessLocalChallenge(input: {
  honeypot: string;
  startedAt: number;
  now: number;
}): boolean {
  if (input.honeypot.trim() !== "") return false;
  if (!Number.isFinite(input.startedAt)) return false;
  const elapsed = input.now - input.startedAt;
  if (elapsed < 400) return false;
  if (elapsed > LIMITS.dayMs) return false;
  return true;
}

export function evaluateGuards(input: {
  challengeOk: boolean;
  blocked: boolean;
  rateLimited: boolean;
  duplicate: boolean;
  moderationOk: boolean;
}): GuardResult {
  if (!input.challengeOk) return "captcha";
  if (input.blocked) return "undeliverable";
  if (input.rateLimited) return "rate";
  if (input.duplicate) return "duplicate";
  if (!input.moderationOk) return "moderation";
  return "ok";
}

const bursts = new Map<string, number[]>();

/** Per-process speed bump. The database window is the durable limit. */
export function allowBurst(key: string, now: number): boolean {
  if (bursts.size > 5000) bursts.clear();
  const recent = (bursts.get(key) ?? []).filter((t) => now - t < 10_000);
  if (recent.length >= 4) {
    bursts.set(key, recent);
    return false;
  }
  recent.push(now);
  bursts.set(key, recent);
  return true;
}
