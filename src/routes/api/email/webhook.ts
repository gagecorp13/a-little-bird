import { createFileRoute } from "@tanstack/react-router";
import { bumpCounter } from "@/lib/bird/store.server";
import { verifyWebhookSignature } from "@/lib/bird/tokens";

async function handle(request: Request): Promise<Response> {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!secret) return new Response("webhook signing is not configured", { status: 401 });
  const raw = await request.text();
  const ok = verifyWebhookSignature({
    secret,
    id: request.headers.get("svix-id") ?? "",
    timestamp: request.headers.get("svix-timestamp") ?? "",
    signature: request.headers.get("svix-signature") ?? "",
    body: raw,
  });
  if (!ok) return new Response("invalid signature", { status: 401 });
  await bumpCounter("bounce_received").catch(() => undefined);
  return new Response(null, { status: 204 });
}

export const Route = createFileRoute("/api/email/webhook")({
  server: {
    handlers: {
      POST: ({ request }) => handle(request),
    },
  },
});
