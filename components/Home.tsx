"use client";
import { useState, useRef, type FormEvent, type CSSProperties } from "react";
import Link from "next/link";
import { SceneArtwork, Wordmark, Bird, PaperFrame } from "./Artwork";
import { TurnstileChallenge } from "./TurnstileChallenge";
import { characterCount, parseNote } from "@/lib/validation";
type State = "editing" | "sending" | "processed" | "partial" | "unknown" | "failed";
export function Home({
  ready,
  siteKey,
  nonce,
}: {
  ready: boolean;
  siteKey: string;
  nonce: string;
}) {
  const [recipients, setRecipients] = useState([""]),
    [message, setMessage] = useState(""),
    [token, setToken] = useState(""),
    [reset, setReset] = useState(0),
    [state, setState] = useState<State>("editing"),
    [error, setError] = useState("");
  const [website, setWebsite] = useState("");
  const attempt = useRef<string | null>(null),
    form = useRef<HTMLFormElement>(null);
  const count = characterCount(message),
    busy = state === "sending",
    complete = state === "processed",
    uncertain = state === "unknown" || state === "partial";
  const clear = () => {
    setRecipients([""]);
    setMessage("");
    setState("editing");
    setError("");
    setToken("");
    setReset((r) => r + 1);
    attempt.current = null;
    setTimeout(
      () => form.current?.querySelector<HTMLInputElement>("input[type=email]")?.focus(),
      0,
    );
  };
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || !ready || complete || uncertain) return;
    const id = attempt.current ?? crypto.randomUUID();
    const parsed = parseNote({
      submissionId: id,
      recipients,
      message,
      turnstileToken: token || "pending",
      website,
    });
    if (!parsed.note) {
      setError(parsed.error!);
      return;
    }
    if (!token) {
      setError("Please complete the small verification check.");
      return;
    }
    attempt.current = id;
    setError("");
    setState("sending");
    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.note, turnstileToken: token }),
        signal: AbortSignal.timeout(42000),
      });
      const data = await response.json();
      if (data.code === "processed") {
        setState("processed");
        setMessage("");
        setRecipients([""]);
      } else if (data.code === "partial") {
        setState("partial");
        setError(
          "Some notes may already be on their way. We couldn't complete the whole request. Please don't resend it immediately.",
        );
      } else if (data.code === "unknown" || data.code === "processing") {
        setState("unknown");
        setError(
          "We couldn't confirm the result. A note may already be on its way. Please don't resend it immediately.",
        );
      } else {
        setState("failed");
        setError(data.message || "The bird needs a moment. Please try again later.");
        attempt.current = null;
      }
    } catch {
      setState("unknown");
      setError(
        "We couldn't confirm the result. A note may already be on its way. Please don't resend it immediately.",
      );
    } finally {
      setToken("");
      setReset((r) => r + 1);
    }
  }
  return (
    <main className="home">
      <div
        className="scene"
        style={{ "--extra": `${Math.max(0, recipients.length - 1) * 65}px` } as CSSProperties}
      >
        <SceneArtwork />
        <Wordmark />
        <Bird flying={complete} />
        <form className="composer" ref={form} onSubmit={submit}>
          <div className="recipient-group">
            <label className="drawn-label" htmlFor="recipient-0">
              who should hear this?
            </label>
            <div className="hanging recipient-paper">
              <span className="tie tie-left" />
              <span className="tie tie-right" />
              <PaperFrame kind="recipient" />
              <div className="recipient-fields">
                {recipients.map((recipient, index) => (
                  <div className="recipient-row" key={index}>
                    <label htmlFor={`recipient-${index}`} className="sr-only">
                      Recipient {index + 1} email
                    </label>
                    <input
                      id={`recipient-${index}`}
                      aria-describedby="recipient-help"
                      type="email"
                      inputMode="email"
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="someone@email.com"
                      maxLength={254}
                      required
                      value={recipient}
                      disabled={busy || complete}
                      onChange={(e) =>
                        setRecipients((list) =>
                          list.map((v, i) => (i === index ? e.target.value : v)),
                        )
                      }
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        className="remove-recipient"
                        aria-label={`Remove recipient ${index + 1}`}
                        disabled={busy}
                        onClick={() => {
                          setRecipients((list) => list.filter((_, i) => i !== index));
                          setTimeout(
                            () => document.getElementById(`recipient-${index - 1}`)?.focus(),
                            0,
                          );
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="recipient-tools">
              <span id="recipient-help">Up to 5. Each gets a separate email.</span>
              {recipients.length < 5 && !complete && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setRecipients((r) => [...r, ""]);
                    setTimeout(
                      () => document.getElementById(`recipient-${recipients.length}`)?.focus(),
                      0,
                    );
                  }}
                >
                  + add another
                </button>
              )}
            </div>
          </div>
          <div className="message-group">
            <label className="drawn-label" htmlFor="message">
              what would you like to say?
            </label>
            <div className="hanging message-paper">
              <span className="tie tie-left" />
              <span className="tie tie-right" />
              <PaperFrame />
              <textarea
                id="message"
                aria-describedby="message-count note-help"
                aria-invalid={count > 1000}
                placeholder="psst..."
                value={message}
                disabled={busy || complete}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
              <span className={`counter ${count > 1000 ? "over-limit" : ""}`} id="message-count">
                {count.toLocaleString()} / 1,000
              </span>
              <svg className="paper-leaf" viewBox="0 0 54 42" aria-hidden="true">
                <path
                  d="M4 37Q20 27 47 3L39 23 23 29 14 34M15 29L18 18 35 12 47 3M23 15L27 22M35 12L34 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
              </svg>
            </div>
          </div>
          <div className="honeypot" aria-hidden="true">
            <label>
              Website
              <input
                tabIndex={-1}
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                autoComplete="off"
              />
            </label>
          </div>
          {ready && !complete && (
            <TurnstileChallenge siteKey={siteKey} nonce={nonce} onToken={setToken} reset={reset} />
          )}
          <div className="send-area">
            <button
              className="send-sign"
              type="submit"
              disabled={busy || complete || !ready || uncertain}
            >
              <span className="tie tie-left" />
              <span className="tie tie-right" />
              <PaperFrame kind="button" />
              <span>
                {busy ? "getting ready..." : complete ? "off it goes" : "let it fly"}{" "}
                <span aria-hidden="true">→</span>
              </span>
            </button>
          </div>
          <p className="note-help" id="note-help">
            No name. No account. Just a little note.
          </p>
          {!ready && (
            <p className="service-note">
              The bird is settling in.
              <br />
              Sending isn’t available just yet.
            </p>
          )}
          <div className="send-status" role="status" aria-live="polite" aria-atomic="true">
            {complete ? (
              <>
                <h2>Off it goes.</h2>
                <p>Your request is complete. Delivery isn’t guaranteed.</p>
                <button type="button" onClick={clear}>
                  send another note
                </button>
              </>
            ) : error ? (
              <p className="form-error">{error}</p>
            ) : null}
          </div>
          {uncertain && (
            <button className="reset-note" type="button" onClick={clear}>
              start a different note
            </button>
          )}
        </form>
        <nav className="scene-footer" aria-label="Information">
          <Link href="/about">what is this?</Link>
          <span aria-hidden="true">|</span>
          <Link href="/about#how-it-works">how it works</Link>
          <span aria-hidden="true">|</span>
          <Link href="/privacy">privacy</Link>
        </nav>
      </div>
      <noscript>
        <p className="noscript">
          The illustration is here, but sending a note needs JavaScript enabled.
        </p>
      </noscript>
    </main>
  );
}
