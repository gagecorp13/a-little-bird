import { getSql } from "@/lib/db";

function toMs(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string" || typeof value === "number") {
    const n = new Date(value).getTime();
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

let sweepTick = 0;

export async function sweepOldRows(): Promise<void> {
  sweepTick += 1;
  if (sweepTick % 8 !== 0) return;
  const sql = await getSql();
  await sql.query(`delete from send_events where created_at < now() - interval '48 hours'`);
  await sql.query(`delete from reports where created_at < now() - interval '90 days'`);
}

export async function isBlocked(emailHash: string): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql.query<{ email_hash: string }>(
    `select email_hash from blocked_recipients where email_hash = $1 limit 1`,
    [emailHash],
  );
  return rows.length > 0;
}

export async function blockHash(emailHash: string): Promise<void> {
  const sql = await getSql();
  await sql.query(
    `insert into blocked_recipients (email_hash) values ($1) on conflict (email_hash) do nothing`,
    [emailHash],
  );
}

export async function unblockHash(emailHash: string): Promise<void> {
  const sql = await getSql();
  await sql.query(`delete from blocked_recipients where email_hash = $1`, [emailHash]);
}

export async function recentSendTimes(signalHash: string): Promise<number[]> {
  const sql = await getSql();
  const rows = await sql.query<{ created_at: unknown }>(
    `select created_at from send_events
     where signal_hash = $1 and created_at > now() - interval '24 hours'`,
    [signalHash],
  );
  return rows.map((row) => toMs(row.created_at));
}

export async function hasRecentDuplicate(
  recipientHash: string,
  fingerprint: string,
): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql.query<{ hit: number }>(
    `select 1 as hit from send_events
     where recipient_hash = $1
       and message_fingerprint = $2
       and created_at > now() - interval '30 minutes'
     limit 1`,
    [recipientHash, fingerprint],
  );
  return rows.length > 0;
}

export async function recordSend(
  signalHash: string,
  recipientHashValue: string,
  fingerprint: string,
): Promise<void> {
  const sql = await getSql();
  await sql.query(
    `insert into send_events (signal_hash, recipient_hash, message_fingerprint)
     values ($1, $2, $3)`,
    [signalHash, recipientHashValue, fingerprint],
  );
}

export async function insertReport(
  reportKey: string,
  category: string,
  note: string | null,
): Promise<"created" | "exists"> {
  const sql = await getSql();
  const rows = await sql.query<{ report_key: string }>(
    `insert into reports (report_key, category, note)
     values ($1, $2, $3)
     on conflict (report_key) do nothing
     returning report_key`,
    [reportKey, category, note],
  );
  return rows.length > 0 ? "created" : "exists";
}

const COUNTERS = new Set([
  "homepage_viewed",
  "send_started",
  "send_completed",
  "send_failed",
  "bounce_received",
]);

export async function bumpCounter(name: string): Promise<boolean> {
  if (!COUNTERS.has(name)) return false;
  const sql = await getSql();
  await sql.query(
    `insert into product_counters (name, count) values ($1, 1)
     on conflict (name) do update set count = product_counters.count + 1`,
    [name],
  );
  return true;
}
