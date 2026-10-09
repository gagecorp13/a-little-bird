import "server-only";
export async function verifyTurnstile(token: string) {
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
      idempotency_key: crypto.randomUUID(),
    }),
    signal: AbortSignal.timeout(5000),
    cache: "no-store",
  });
  if (!response.ok) return false;
  const data = await response.json();
  const hosts = (process.env.TURNSTILE_ALLOWED_HOSTNAMES || "").split(",").map((s) => s.trim());
  return data.success === true && data.action === "send_message" && hosts.includes(data.hostname);
}
