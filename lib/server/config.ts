import "server-only";
export function secret(name: string) {
  const value = process.env[name];
  if (!value || value.length < 32 || /REPLACE|placeholder/i.test(value))
    throw new Error("Configuration unavailable");
  return value;
}
export function keyring(name: string): Record<string, string> {
  const parsed: unknown = JSON.parse(process.env[name] || "{}");
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new Error("Configuration unavailable");
  const entries = Object.entries(parsed);
  if (
    !entries.length ||
    entries.length > 8 ||
    entries.some(
      ([k, v]) =>
        !/^v[0-9]+$/.test(k) ||
        typeof v !== "string" ||
        v.length < 32 ||
        /REPLACE|placeholder/i.test(v),
    )
  )
    throw new Error("Configuration unavailable");
  return Object.fromEntries(entries) as Record<string, string>;
}
export function appOrigin() {
  const origin =
    process.env.APP_ORIGIN ||
    (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8080" : "https://alittlebird.com");
  const url = new URL(origin);
  if (url.origin !== origin || (url.protocol !== "https:" && process.env.NODE_ENV === "production"))
    throw new Error("Invalid origin");
  return origin;
}
export function deliveryConfigured() {
  try {
    if (process.env.SENDING_ENABLED !== "true" || process.env.PROVIDER_USE_APPROVED !== "true")
      return false;
    if (!["production", "allowlist"].includes(process.env.MAIL_MODE || "")) return false;
    const names = [
      "RESEND_API_KEY",
      "RESEND_WEBHOOK_SECRET",
      "UPSTASH_REDIS_REST_URL",
      "UPSTASH_REDIS_REST_TOKEN",
      "TURNSTILE_SECRET_KEY",
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
      "TURNSTILE_ALLOWED_HOSTNAMES",
    ];
    if (names.some((n) => !process.env[n])) return false;
    if (
      /^[123]x/.test(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!) ||
      /^[123]x/.test(process.env.TURNSTILE_SECRET_KEY!)
    )
      return false;
    secret("IP_HMAC_SECRET");
    secret("SUBMISSION_HMAC_SECRET");
    const rk = keyring("RECIPIENT_HMAC_KEYS"),
      tk = keyring("CONTROL_TOKEN_KEYS");
    if (
      !rk[process.env.RECIPIENT_HMAC_ACTIVE_KID || ""] ||
      !tk[process.env.CONTROL_TOKEN_ACTIVE_KID || ""]
    )
      return false;
    if (process.env.RESEND_FROM !== "a little bird <chirp@alittlebird.com>") return false;
    appOrigin();
    return true;
  } catch {
    return false;
  }
}
