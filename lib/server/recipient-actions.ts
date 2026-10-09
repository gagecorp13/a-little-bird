import "server-only";
import { z } from "zod";
import { checkOrigin, readJson, json, safeFailure, HttpError } from "./http";
import { verifyToken } from "./control-tokens";
import { redis, key } from "./store";
const schema = z
  .object({
    token: z.string().min(1).max(1600),
    reason: z.enum(["unwanted", "harassment", "scam", "other"]).optional(),
  })
  .strict();
const APPLY = `
redis.call('SET',KEYS[1],ARGV[1])
if ARGV[2]=='report' then redis.call('SET',KEYS[2],ARGV[3],'EX',2592000,'NX') end
return 1
`;
export async function recipientAction(request: Request, purpose: "opt-out" | "report") {
  try {
    checkOrigin(request);
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) throw new HttpError(400, "invalid_request", "That link isn't valid.");
    const token = verifyToken(parsed.data.token, purpose);
    if (!token)
      throw new HttpError(
        400,
        "invalid_link",
        purpose === "report"
          ? "That report link is invalid or expired. You can still use the stop-emails link in your email."
          : "That link isn't valid. Open the stop-emails link in your original email.",
      );
    if (purpose === "report" && !parsed.data.reason)
      throw new HttpError(400, "invalid_request", "Choose a reason.");
    const suppression = key("suppression:" + token.rk + ":" + token.r);
    const value = JSON.stringify({
      reason: purpose === "report" ? "report" : "opt-out",
      date: new Date().toISOString().slice(0, 10),
    });
    const report = JSON.stringify({
      recipient: token.r,
      kid: token.rk,
      delivery: token.d,
      reason: parsed.data.reason,
      date: new Date().toISOString().slice(0, 10),
    });
    await redis().eval(APPLY, [suppression, key("report:" + token.d)], [value, purpose, report]);
    return json({ code: "complete" });
  } catch (error) {
    return safeFailure(error);
  }
}
