import { useEffect, useRef } from "react";

type TurnstileApi = {
  render: (
    el: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "error-callback": () => void;
      theme: "light";
    },
  ) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    onAlbTurnstile?: () => void;
  }
}

export function TurnstileField({ onToken }: { onToken: (token: string) => void }) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
  const holder = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!siteKey || !holder.current) return;
    let widgetId = "";
    let cancelled = false;

    const mount = () => {
      if (cancelled || !holder.current || !window.turnstile) return;
      widgetId = window.turnstile.render(holder.current, {
        sitekey: siteKey,
        theme: "light",
        callback: (token) => onTokenRef.current(token),
        "error-callback": () => onTokenRef.current(""),
      });
    };

    if (window.turnstile) {
      mount();
    } else {
      window.onAlbTurnstile = mount;
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onAlbTurnstile";
      script.async = true;
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey]);

  if (!siteKey) return null;
  return <div ref={holder} className="min-h-16" />;
}
