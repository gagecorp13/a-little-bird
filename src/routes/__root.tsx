import { createRootRoute, HeadContent, Link, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { PageShell } from "@/components/site/PageShell";
import appCss from "../styles.css?url";

const DESCRIPTION =
  "Have something to say? Send a private anonymous note and let a little bird deliver it.";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "a little bird — send an anonymous note" },
      { name: "description", content: DESCRIPTION },
      { name: "theme-color", content: "#f3ecdf" },
      { name: "robots", content: "index, follow" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,520;9..144,640&family=Source+Sans+3:ital,wght@0,400;0,580;0,680;1,400&display=swap",
      },
      { rel: "canonical", href: "https://alittlebird.com/" },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  headers: () => ({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  }),
  component: () => (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
  notFoundComponent: () => (
    <PageShell>
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-display text-4xl text-ink">this page flew away.</h1>
        <p className="mt-3 text-ink/75">that address isn't on the route.</p>
        <Link
          to="/"
          className="mt-6 inline-flex min-h-12 items-center rounded-full bg-ink px-5 text-paper"
        >
          back home
        </Link>
      </div>
    </PageShell>
  ),
});
