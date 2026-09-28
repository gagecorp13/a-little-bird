import { useEffect, useId, useRef, useState } from "react";
import { BirdMark } from "@/components/site/BirdLogo";
import { COPY } from "@/lib/bird/copy";
import { track, visitorKey } from "@/lib/bird/track";
import { MAX_MESSAGE_LENGTH, normalizeEmail, normalizeMessage } from "@/lib/bird/validate";
import { CharacterCounter } from "./CharacterCounter";
import { MessagePreview } from "./MessagePreview";
import { SuccessAnimation } from "./SuccessAnimation";
import { TurnstileField } from "./TurnstileField";

type Step = "compose" | "confirm" | "success";

const fieldClass =
  "mt-2 w-full rounded-xl border border-ink/15 bg-paper px-3 py-3 text-base text-ink placeholder:text-ink/40";

export function MessageForm() {
  const emailId = useId();
  const messageId = useId();
  const startedAt = useRef(Date.now());
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState<Step>("compose");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [delivery, setDelivery] = useState<"accepted" | "preview">("preview");

  useEffect(() => {
    if (step !== "compose") headingRef.current?.focus();
  }, [step]);

  function goConfirm() {
    const normalizedEmail = normalizeEmail(email);
    const normalizedMessage = normalizeMessage(message);
    if (!normalizedEmail) {
      setError(COPY.invalid_email);
      return;
    }
    if (!normalizedMessage.ok) {
      setError(COPY[normalizedMessage.code]);
      return;
    }
    setError("");
    setEmail(normalizedEmail);
    setMessage(normalizedMessage.text);
    setStep("confirm");
    track("send_started");
  }

  async function send() {
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          recipientEmail: email,
          message,
          visitorKey: visitorKey(),
          company,
          startedAt: startedAt.current,
          turnstileToken: token,
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        delivery?: "accepted" | "preview";
      };
      if (!response.ok || !payload.ok) {
        track("send_failed");
        setError(payload.message || COPY.server);
        setSending(false);
        return;
      }
      track("send_completed");
      setDelivery(payload.delivery === "accepted" ? "accepted" : "preview");
      setStep("success");
    } catch {
      track("send_failed");
      setError(COPY.server);
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setEmail("");
    setMessage("");
    setCompany("");
    setError("");
    setStep("compose");
    startedAt.current = Date.now();
  }

  return (
    <div className="relative mx-auto mt-8 w-full max-w-xl">
      <BirdMark className="pointer-events-none absolute -top-8 right-2 z-10 h-12 w-14 sm:-top-9 sm:right-5 sm:h-16 sm:w-20" />
      <section id="note" className="stationery rounded-2xl border border-ink/10 px-4 pt-9 pb-5 sm:px-6 sm:pt-10 sm:pb-6">
        {step === "compose" ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              goConfirm();
            }}
          >
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <label htmlFor="company">company</label>
              <input
                id="company"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            <label htmlFor={emailId} className="block pr-12 font-display text-lg text-ink">
              who should the bird visit?
            </label>
            <input
              id={emailId}
              data-testid="recipient-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClass}
              required
            />
            <label htmlFor={messageId} className="mt-5 block font-display text-lg text-ink">
              what should the bird tell them?
            </label>
            <textarea
              id={messageId}
              data-testid="message"
              placeholder="write your message here..."
              value={message}
              onChange={(event) => {
                const next = event.target.value;
                const chars = [...next];
                setMessage(chars.length > MAX_MESSAGE_LENGTH ? chars.slice(0, MAX_MESSAGE_LENGTH).join("") : next);
              }}
              rows={6}
              className={`${fieldClass} min-h-36 resize-y`}
              required
            />
            <div className="mt-2">
              <CharacterCounter value={message} />
            </div>
            <TurnstileField onToken={setToken} />
            {error ? (
              <p role="alert" className="mt-3 text-sm text-coral">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              data-testid="send-bird"
              className="group mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-coral px-5 text-base text-paper transition-transform duration-150 ease-out active:scale-[0.96] sm:w-auto"
            >
              <BirdMark className="h-6 w-8" />
              send the bird →
            </button>
            <p className="mt-4 text-sm text-ink/65">Your identity isn't included with the message.</p>
          </form>
        ) : null}

        {step === "confirm" ? (
          <div>
            <h2 ref={headingRef} tabIndex={-1} className="font-display text-3xl text-ink outline-none">
              ready to let it fly?
            </h2>
            <div className="mt-4">
              <MessagePreview email={email} message={message} />
            </div>
            <p className="mt-4 text-sm text-ink/70">Your identity won't be included with the message.</p>
            {error ? (
              <p role="alert" className="mt-3 text-sm text-coral">
                {error}
              </p>
            ) : null}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep("compose");
                }}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-ink/20 bg-paper px-5 text-base text-ink"
              >
                ← make a change
              </button>
              <button
                type="button"
                data-testid="confirm-send"
                onClick={() => void send()}
                disabled={sending}
                aria-busy={sending}
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-coral px-5 text-base text-paper transition-transform duration-150 ease-out active:scale-[0.96] disabled:opacity-70"
              >
                {sending ? "sending…" : "send it →"}
              </button>
            </div>
          </div>
        ) : null}

        {step === "success" ? (
          <div data-testid="success">
            <SuccessAnimation delivery={delivery} onAgain={reset} />
          </div>
        ) : null}
      </section>
    </div>
  );
}
