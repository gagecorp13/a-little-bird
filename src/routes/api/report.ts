import { createFileRoute } from "@tanstack/react-router";
import { handleReport } from "@/lib/bird/deliver.server";

export const Route = createFileRoute("/api/report")({
  server: {
    handlers: {
      POST: ({ request }) => handleReport(request),
    },
  },
});
