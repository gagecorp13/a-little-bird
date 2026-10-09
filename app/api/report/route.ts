import { recipientAction } from "@/lib/server/recipient-actions";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return recipientAction(request, "report");
}
