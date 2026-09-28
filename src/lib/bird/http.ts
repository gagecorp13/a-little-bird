import { COPY, type CopyCode } from "./copy.ts";

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

export function errorResponse(code: CopyCode, status: number): Response {
  return json({ ok: false, code, message: COPY[code] }, status);
}

export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwarded || request.headers.get("host") || "";
  if (host && originHost === host) return true;
  try {
    if (originHost === new URL(request.url).host) return true;
  } catch {
    return false;
  }
  return false;
}

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function publicOrigin(request: Request): string {
  const configured = process.env.APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  try {
    return new URL(request.url).origin;
  } catch {
    return "https://alittlebird.com";
  }
}

export function statusFor(code: CopyCode): number {
  if (code === "rate") return 429;
  if (code === "server") return 500;
  return 400;
}
