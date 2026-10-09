import { deliveryConfigured } from "@/lib/server/config";
import { parseNote, canonicalEmail } from "@/lib/validation";
import { checkOrigin, json, readJson, safeFailure, HttpError } from "@/lib/server/http";
import { clientKey, operationId, recipientIds, fingerprint } from "@/lib/server/identity";
import {
  attemptAllowed,
  getOperation,
  key,
  reserve,
  summary,
  transition,
  providerPermit,
  type Operation,
} from "@/lib/server/store";
import { verifyTurnstile } from "@/lib/server/turnstile";
import { renderEmail } from "@/lib/server/email";
export const runtime = "nodejs";
export const maxDuration = 60;
function result(op: Operation) {
  const code = summary(op);
  return json({ code }, code === "processing" ? 202 : code === "failed" ? 503 : 200);
}
export async function POST(request: Request) {
  let dispatchStarted = false;
  try {
    if (!deliveryConfigured())
      return json(
        {
          code: "unavailable",
          message: "The bird is settling in. Sending isn't available just yet.",
        },
        503,
      );
    checkOrigin(request);
    const ip = clientKey(request);
    if (!(await attemptAllowed(ip)))
      throw new HttpError(429, "try_later", "Please let the bird rest and try again later.");
    const parsed = parseNote(await readJson(request));
    if (!parsed.note) throw new HttpError(400, "invalid_request", parsed.error!);
    const note = parsed.note;
    if (note.website)
      return json({ code: "unavailable", message: "We couldn't send that note." }, 400);
    if (process.env.MAIL_MODE === "allowlist") {
      const allowed = (process.env.TEST_RECIPIENT_ALLOWLIST || "").split(",").map(canonicalEmail);
      if (note.recipients.some((r) => !allowed.includes(canonicalEmail(r))))
        throw new HttpError(
          403,
          "verification_required",
          "Sending is limited to test recipients for now.",
        );
    }
    const id = operationId(note.submissionId),
      digest = fingerprint(note.message, note.recipients);
    const existing = await getOperation(id);
    const checkExisting = (op: Operation) => {
      if (op.ip !== ip || op.fingerprint !== digest)
        throw new HttpError(
          409,
          "submission_conflict",
          "That attempt has changed. Please start a new note.",
        );
      return result(op);
    };
    if (existing) return checkExisting(existing);
    if (!(await verifyTurnstile(note.turnstileToken)))
      throw new HttpError(403, "verification_required", "Please complete the verification again.");
    const proposed: Operation = {
      id,
      ip,
      fingerprint: digest,
      started: Date.now(),
      items: note.recipients.map((email) => {
        const ids = recipientIds(email),
          active = ids.find((r) => r.kid === process.env.RECIPIENT_HMAC_ACTIVE_KID)!;
        return {
          rid: active.id,
          kid: active.kid,
          suppress: ids.map((r) => key("suppression:" + r.kid + ":" + r.id)),
          state: "pending",
        };
      }),
    };
    const reservation = await reserve(proposed);
    if (reservation.kind === "existing") return checkExisting(reservation.op!);
    if (reservation.kind === "limited")
      throw new HttpError(
        429,
        "try_later",
        "The bird has carried enough for now. Please try again later.",
      );
    if (reservation.kind !== "created" || !reservation.op) throw new Error("Unavailable");
    const op = reservation.op,
      deadline = op.started + 35000;
    for (let i = 0; i < op.items.length; i++) {
      if (op.items[i].state === "skipped") continue;
      const permit = await providerPermit(deadline);
      if (!permit) {
        for (let j = i; j < op.items.length; j++) await transition(op, j, "pending", "unattempted");
        break;
      }
      const state = await transition(op, i, "pending", "dispatching");
      if (state === "skipped") {
        op.items[i].state = "skipped";
        continue;
      }
      if (state !== "dispatching") {
        for (let j = i; j < op.items.length; j++) await transition(op, j, "pending", "unattempted");
        break;
      }
      dispatchStarted = true;
      const email = renderEmail(note.message, op, i);
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + process.env.RESEND_API_KEY,
            "Content-Type": "application/json",
            "Idempotency-Key": email.idempotencyKey,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM,
            to: [note.recipients[i]],
            subject: "A little bird has a message for you",
            html: email.html,
            text: email.text,
          }),
          signal: AbortSignal.timeout(Math.min(5000, Math.max(1, deadline - Date.now()))),
          cache: "no-store",
        });
        if (response.ok) {
          const data = await response.json();
          if (typeof data.id !== "string") throw new Error("Unknown response");
          await transition(op, i, "dispatching", "accepted", data.id);
        } else {
          // A 5xx can be ambiguous after an upstream accepted the request.
          await transition(op, i, "dispatching", response.status >= 500 ? "unknown" : "failed");
          if (response.status === 429 || response.status >= 500) {
            for (let j = i + 1; j < op.items.length; j++)
              await transition(op, j, "pending", "unattempted");
            break;
          }
        }
      } catch {
        try {
          await transition(op, i, "dispatching", "unknown");
          for (let j = i + 1; j < op.items.length; j++)
            await transition(op, j, "pending", "unattempted");
        } catch {}
        return json({ code: "unknown" });
      }
    }
    const final = await getOperation(id);
    if (!final) return json({ code: "unknown" });
    return result(final);
  } catch (error) {
    return dispatchStarted ? json({ code: "unknown" }) : safeFailure(error);
  }
}
