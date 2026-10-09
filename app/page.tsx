import { headers } from "next/headers";
import { Home } from "@/components/Home";
import { deliveryConfigured } from "@/lib/server/config";
export const dynamic = "force-dynamic";
export default async function Page() {
  const h = await headers();
  return (
    <Home
      ready={deliveryConfigured()}
      nonce={h.get("x-nonce") || ""}
      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
    />
  );
}
