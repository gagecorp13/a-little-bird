"use client";
import { useEffect, useRef } from "react";
import Script from "next/script";
type API = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: API;
  }
}
export function TurnstileChallenge({
  siteKey,
  nonce,
  onToken,
  reset,
}: {
  siteKey: string;
  nonce: string;
  onToken: (token: string) => void;
  reset: number;
}) {
  const container = useRef<HTMLDivElement>(null),
    widget = useRef<string | undefined>(undefined),
    callback = useRef(onToken);
  useEffect(() => {
    callback.current = onToken;
  }, [onToken]);
  useEffect(() => {
    let cancelled = false;
    const timer = setInterval(() => {
      if (cancelled || !container.current || !window.turnstile || widget.current) return;
      widget.current = window.turnstile.render(container.current, {
        sitekey: siteKey,
        action: "send_message",
        theme: "light",
        size: "flexible",
        callback: (token: string) => callback.current(token),
        "expired-callback": () => callback.current(""),
        "error-callback": () => callback.current(""),
      });
    }, 150);
    return () => {
      cancelled = true;
      clearInterval(timer);
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = undefined;
    };
  }, [siteKey, reset]);
  return (
    <div className="challenge">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        nonce={nonce}
      />
      <div ref={container} />
      <p className="challenge-help">A small check to keep unwanted mail away.</p>
    </div>
  );
}
