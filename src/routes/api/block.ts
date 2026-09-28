import { createFileRoute } from "@tanstack/react-router";
import { handleBlock } from "@/lib/bird/deliver.server";

export const Route = createFileRoute("/api/block")({
  server: {
    handlers: {
      POST: ({ request }) => handleBlock(request),
    },
  },
});
