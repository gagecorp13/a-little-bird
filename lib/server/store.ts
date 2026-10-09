import "server-only";
import { Redis } from "@upstash/redis";
let client: Redis | undefined;
export function redis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN)
    throw new Error("Store unavailable");
  return (client ??= new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    retry: false,
    signal: () => AbortSignal.timeout(4000),
  }));
}
export function key(value: string) {
  const ns = process.env.REDIS_NAMESPACE || "alb:prod:v1";
  if (!/^[a-z0-9:_-]{1,60}$/i.test(ns)) throw new Error("Invalid namespace");
  return ns + ":" + value;
}
export type ItemState =
  "pending" | "dispatching" | "accepted" | "skipped" | "failed" | "unknown" | "unattempted";
export type Item = {
  rid: string;
  kid: string;
  suppress: string[];
  state: ItemState;
  providerId?: string;
};
export type Operation = {
  id: string;
  ip: string;
  fingerprint: string;
  started: number;
  items: Item[];
};
export const OP_TTL = 26 * 3600;
export const HOUR = 3600000,
  DAY = 24 * HOUR;
export const READY_KEY = () => key("security:initialized"),
  ENABLE_KEY = () => key("security:sending_enabled");
export const RESERVE = `
local existing=redis.call('GET',KEYS[1])
if existing then return {'existing',existing} end
if redis.call('GET',KEYS[2])~='1' or redis.call('GET',KEYS[3])~='1' then return {'disabled'} end
local op=cjson.decode(ARGV[1])
local limits=cjson.decode(ARGV[2])
local recipients=cjson.decode(ARGV[3])
local now=tonumber(ARGV[4])
for _,g in ipairs(limits) do
 redis.call('ZREMRANGEBYSCORE',KEYS[g.k],'-inf',now-g.window)
 if redis.call('ZCARD',KEYS[g.k])+g.cost>g.cap then return {'limited'} end
end
for i,r in ipairs(recipients) do
 local skip=false
 for _,s in ipairs(r.suppression) do if redis.call('EXISTS',KEYS[s])==1 then skip=true end end
 for _,g in ipairs(r.gates) do
  redis.call('ZREMRANGEBYSCORE',KEYS[g.k],'-inf',now-g.window)
  if redis.call('ZCARD',KEYS[g.k])+1>g.cap then skip=true end
 end
 if skip then op.items[i].state='skipped' end
end
for _,g in ipairs(limits) do
 for i=1,g.cost do redis.call('ZADD',KEYS[g.k],now,op.id..':'..i) end
 redis.call('PEXPIRE',KEYS[g.k],g.window+300000)
end
for i,r in ipairs(recipients) do
 if op.items[i].state=='pending' then
  for _,g in ipairs(r.gates) do
   redis.call('ZADD',KEYS[g.k],now,op.id..':'..i)
   redis.call('PEXPIRE',KEYS[g.k],g.window+300000)
  end
 end
end
local value=cjson.encode(op)
redis.call('SET',KEYS[1],value,'EX',93600)
return {'created',value}
`;
export async function reserve(op: Operation) {
  const keys = [key("op:" + op.id), READY_KEY(), ENABLE_KEY()];
  const add = (v: string) => {
    keys.push(v);
    return keys.length;
  };
  const gate = (name: string, window: number, cap: number, cost = 1) => ({
    k: add(key(name)),
    window,
    cap,
    cost,
  });
  const n = op.items.length;
  const limits = [
    gate("ip:min:" + op.ip, 60000, 1),
    gate("ip:hour:" + op.ip, HOUR, 3),
    gate("ip:day:" + op.ip, DAY, 10, n),
    gate("global:day", DAY, 80, n),
    gate("global:month", 31 * DAY, 2000, n),
  ];
  const recipients = op.items.map((item) => ({
    suppression: item.suppress.map(add),
    gates: [
      gate("recipient:" + item.kid + ":" + item.rid, DAY, 2),
      gate("pair:" + op.ip + ":" + item.kid + ":" + item.rid, DAY, 1),
    ],
  }));
  const result = await redis().eval<unknown[], [string, (string | Operation)?]>(RESERVE, keys, [
    JSON.stringify(op),
    JSON.stringify(limits),
    JSON.stringify(recipients),
    Date.now(),
  ]);
  return {
    kind: result[0],
    op: result[1]
      ? typeof result[1] === "string"
        ? (JSON.parse(result[1]) as Operation)
        : result[1]
      : undefined,
  };
}
export async function getOperation(id: string) {
  return redis().get<Operation>(key("op:" + id));
}
const UPDATE = `
local raw=redis.call('GET',KEYS[1]);if not raw then return 'missing' end
local op=cjson.decode(raw);local i=tonumber(ARGV[1]);local item=op.items[i]
if item.state~=ARGV[2] then return 'unchanged' end
if ARGV[3]=='dispatching' then
 if redis.call('GET',KEYS[2])~='1' or redis.call('GET',KEYS[3])~='1' then return 'disabled' end
 if tonumber(ARGV[5])-op.started>35000 then return 'expired' end
 for j=4,#KEYS do if redis.call('EXISTS',KEYS[j])==1 then item.state='skipped';redis.call('SET',KEYS[1],cjson.encode(op),'KEEPTTL');return 'skipped' end end
end
item.state=ARGV[3];if ARGV[4]~='' then item.providerId=ARGV[4] end
redis.call('SET',KEYS[1],cjson.encode(op),'KEEPTTL');return item.state
`;
export async function transition(
  op: Operation,
  index: number,
  from: ItemState,
  to: ItemState,
  providerId = "",
) {
  return redis().eval<unknown[], string>(
    UPDATE,
    [key("op:" + op.id), READY_KEY(), ENABLE_KEY(), ...op.items[index].suppress],
    [index + 1, from, to, providerId, Date.now()],
  );
}
const EARLY = `
local gates=cjson.decode(ARGV[1]);local now=tonumber(ARGV[2])
for i,g in ipairs(gates) do redis.call('ZREMRANGEBYSCORE',KEYS[i],'-inf',now-g.window);if redis.call('ZCARD',KEYS[i])>=g.cap then return 0 end end
for i,g in ipairs(gates) do redis.call('ZADD',KEYS[i],now,ARGV[3]);redis.call('PEXPIRE',KEYS[i],g.window+1000) end
return 1
`;
export async function attemptAllowed(ip: string) {
  const gates = [
    { window: 60000, cap: 60 },
    { window: DAY, cap: 5000 },
    { window: 60000, cap: 10 },
    { window: HOUR, cap: 60 },
  ];
  return (
    (await redis().eval<unknown[], number>(
      EARLY,
      [
        "requests:global:min",
        "requests:global:day",
        "requests:ip:min:" + ip,
        "requests:ip:hour:" + ip,
      ].map(key),
      [JSON.stringify(gates), Date.now(), crypto.randomUUID()],
    )) === 1
  );
}
export async function providerPermit(deadline: number) {
  while (Date.now() < deadline - 6000) {
    if (await redis().set(key("provider:permit"), "1", { nx: true, px: 1100 })) return true;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}
export function summary(op: Operation) {
  const states = op.items.map((i) => i.state);
  if (
    states.includes("unknown") ||
    (states.includes("dispatching") && Date.now() - op.started > 35000)
  )
    return "unknown";
  if (states.some((s) => s === "dispatching" || s === "pending")) return "processing";
  if (states.every((s) => s === "accepted" || s === "skipped")) return "processed";
  if (states.some((s) => s === "accepted" || s === "skipped")) return "partial";
  return "failed";
}
