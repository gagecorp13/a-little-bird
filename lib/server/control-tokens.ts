import "server-only";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { keyring } from "./config";
import { mac } from "./identity";
const schema = z
  .object({
    v: z.literal(1),
    kid: z.string().regex(/^v[0-9]+$/),
    purpose: z.enum(["opt-out", "report"]),
    rk: z.string().regex(/^v[0-9]+$/),
    r: z.string().regex(/^[a-f0-9]{64}$/),
    d: z.string().regex(/^[a-f0-9]{64}$/),
    iat: z.number().int().positive(),
    exp: z.number().int().positive().optional(),
  })
  .strict();
export type ControlToken = z.infer<typeof schema>;
export function createToken(
  purpose: ControlToken["purpose"],
  rid: string,
  rk: string,
  delivery: string,
  time: number,
) {
  const kid = process.env.CONTROL_TOKEN_ACTIVE_KID!;
  const value: ControlToken = {
    v: 1,
    kid,
    purpose,
    rk,
    r: rid,
    d: delivery,
    iat: Math.floor(time / 1000),
    ...(purpose === "report" ? { exp: Math.floor(time / 1000) + 30 * 86400 } : {}),
  };
  const encoded = Buffer.from(JSON.stringify(value)).toString("base64url");
  return encoded + "." + mac(keyring("CONTROL_TOKEN_KEYS")[kid], "control", encoded);
}
export function verifyToken(token: string, purpose: ControlToken["purpose"]): ControlToken | null {
  try {
    if (
      typeof token !== "string" ||
      token.length > 1600 ||
      !/^[A-Za-z0-9_-]+\.[a-f0-9]{64}$/.test(token)
    )
      return null;
    const [body, signature] = token.split(".");
    const p = schema.parse(JSON.parse(Buffer.from(body, "base64url").toString("utf8")));
    const signingKey = keyring("CONTROL_TOKEN_KEYS")[p.kid];
    if (!signingKey) return null;
    const expected = mac(signingKey, "control", body);
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
    if (
      p.purpose !== purpose ||
      !keyring("RECIPIENT_HMAC_KEYS")[p.rk] ||
      p.iat > Date.now() / 1000 + 300
    )
      return null;
    if (purpose === "report" && (!p.exp || p.exp < Date.now() / 1000)) return null;
    return p;
  } catch {
    return null;
  }
}
