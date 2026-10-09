import { Webhook } from "svix";
import { z } from "zod";
import { readBody, json, safeFailure, HttpError } from "@/lib/server/http";
import { recipientIds } from "@/lib/server/identity";
import { redis, key } from "@/lib/server/store";
export const runtime = "nodejs";
const shape = z
  .object({
    type: z.string(),
    data: z
      .object({
        to: z.array(z.string()).max(100).optional(),
        bounce: z.object({ type: z.string().optional() }).passthrough().optional(),
      })
      .passthrough(),
  })
  .passthrough();
const APPLY = `
if redis.call('EXISTS',KEYS[1])==1 then return 1 end
for i=2,#KEYS do redis.call('SET',KEYS[i],ARGV[1]) end
redis.call('SET',KEYS[1],'1','EX',2592000)
return 1
`;
export async function POST(request: Request) {
  try {
    const signing = process.env.RESEND_WEBHOOK_SECRET;
    if (!signing) throw new Error("Not configured");
    const raw = await readBody(request, 65536);
    let verified: unknown;
    const id = request.headers.get("svix-id") || "";
    try {
      verified = new Webhook(signing).verify(raw, {
        "svix-id": id,
        "svix-timestamp": request.headers.get("svix-timestamp") || "",
        "svix-signature": request.headers.get("svix-signature") || "",
      });
    } catch {
      throw new HttpError(400, "invalid_signature", "Invalid signature.");
    }
    const parsed = shape.safeParse(verified);
    if (!parsed.success) throw new HttpError(400, "invalid_event", "Invalid event.");
    const event = parsed.data;
    const shouldBlock =
      event.type === "email.complained" ||
      event.type === "email.suppressed" ||
      (event.type === "email.bounced" && event.data.bounce?.type?.toLowerCase() === "permanent");
    if (!shouldBlock) return json({ received: true });
    if (!event.data.to?.length) throw new HttpError(400, "invalid_event", "Missing recipient.");
    const keys = event.data.to.flatMap((email) =>
      recipientIds(email).map((r) => key("suppression:" + r.kid + ":" + r.id)),
    );
    await redis().eval(
      APPLY,
      [key("webhook:" + id), ...keys],
      [JSON.stringify({ reason: event.type, date: new Date().toISOString().slice(0, 10) })],
    );
    return json({ received: true });
  } catch (error) {
    return safeFailure(error);
  }
}
