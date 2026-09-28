import { createFileRoute } from "@tanstack/react-router";
import { handleSend } from "@/lib/bird/deliver.server";

export const Route = createFileRoute("/api/messages")({
  server: {
    handlers: {
      POST: ({ request }) => handleSend(request),
    },
  },
});
