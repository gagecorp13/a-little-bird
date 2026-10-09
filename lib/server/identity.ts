import "server-only";
import { createHmac } from "node:crypto";
import ipaddr from "ipaddr.js";
import { canonicalEmail } from "@/lib/validation";
import { keyring, secret } from "./config";
export const mac = (key: string, purpose: string, value: string) =>
  createHmac("sha256", key)
    .update(purpose + "\0" + value)
    .digest("hex");
export function ipBucket(raw: string) {
  if (!raw || raw.includes(",") || raw.includes("%") || raw.length > 64 || !ipaddr.isValid(raw))
    throw new Error("Invalid IP");
  let addr = ipaddr.parse(raw);
  if (addr.kind() === "ipv6" && (addr as ipaddr.IPv6).isIPv4MappedAddress())
    addr = (addr as ipaddr.IPv6).toIPv4Address();
  if (addr.kind() === "ipv4") return addr.toString();
  const bytes = addr.toByteArray();
  bytes.fill(0, 8);
  return ipaddr.fromByteArray(bytes).toNormalizedString() + "/64";
}
export function clientKey(request: Request) {
  const raw =
    process.env.VERCEL === "1"
      ? request.headers.get("x-vercel-forwarded-for")
      : process.env.NODE_ENV !== "production"
        ? "127.0.0.1"
        : null;
  if (!raw) throw new Error("Trusted connection unavailable");
  return mac(secret("IP_HMAC_SECRET"), "ip", ipBucket(raw.trim()));
}
export function recipientIds(email: string) {
  return Object.entries(keyring("RECIPIENT_HMAC_KEYS")).map(([kid, key]) => ({
    kid,
    id: mac(key, "recipient", canonicalEmail(email)),
  }));
}
export function fingerprint(message: string, recipients: string[]) {
  return mac(
    secret("SUBMISSION_HMAC_SECRET"),
    "payload",
    JSON.stringify([message, recipients.map(canonicalEmail)]),
  );
}
export const operationId = (id: string) => mac(secret("SUBMISSION_HMAC_SECRET"), "operation", id);
