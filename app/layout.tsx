import type { Metadata } from "next";
import "./globals.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  metadataBase: new URL("https://alittlebird.com"),
  title: "a little bird — some things are better left unsigned.",
  description: "A little note, carried your way. No name or account required.",
  icons: { icon: "/bird-icon.svg" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "a little bird",
    description: "some things are better left unsigned.",
    images: [{ url: "/artwork/homepage-final.png", width: 1448, height: 1086 }],
  },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
