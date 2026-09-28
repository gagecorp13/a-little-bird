const NAMES = ["homepage_viewed", "send_started", "send_completed", "send_failed"] as const;

export type TrackName = (typeof NAMES)[number];

export function track(name: TrackName) {
  try {
    if (name === "homepage_viewed") {
      if (sessionStorage.getItem("alb-home") === "1") return;
      sessionStorage.setItem("alb-home", "1");
    }
  } catch {
    /* private mode */
  }
  void fetch("/api/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
    keepalive: true,
  }).catch(() => undefined);
}

export function visitorKey(): string {
  const storageKey = "alb-visitor";
  try {
    const existing = localStorage.getItem(storageKey);
    if (existing && /^[a-zA-Z0-9-]{8,80}$/.test(existing)) return existing;
    const next = crypto.randomUUID();
    localStorage.setItem(storageKey, next);
    return next;
  } catch {
    return "";
  }
}
