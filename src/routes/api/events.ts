import { createFileRoute } from "@tanstack/react-router";
import { handleEvent } from "@/lib/bird/deliver.server";

export const Route = createFileRoute("/api/events")({
  server: {
    handlers: {
      POST: ({ request }) => handleEvent(request),
    },
  },
});
