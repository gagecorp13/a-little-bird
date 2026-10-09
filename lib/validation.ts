import { z } from "zod";
export const MAX_RECIPIENTS = 5;
export const MAX_CHARACTERS = 1000;
export const normalizeMessage = (s: string) => s.replace(/\r\n?/g, "\n");
export const characterCount = (s: string) => Array.from(normalizeMessage(s)).length;
export const canonicalEmail = (s: string) => s.trim().toLowerCase();
export function validEmail(s: string) {
  if (s.length > 254 || !/^[\x21-\x7e]+$/.test(s) || /[<>,;\s]/.test(s)) return false;
  const parts = s.split("@");
  return (
    parts.length === 2 &&
    parts[0].length <= 64 &&
    parts[1].split(".").every((p) => p.length <= 63) &&
    z.email().safeParse(s).success
  );
}
export const sendSchema = z
  .object({
    submissionId: z.uuid(),
    recipients: z.array(z.string().max(254)).min(1).max(5),
    message: z.string().max(4000),
    turnstileToken: z.string().min(1).max(2048),
    website: z.string().max(100).optional(),
  })
  .strict();
export type ValidNote = {
  submissionId: string;
  recipients: string[];
  message: string;
  turnstileToken: string;
  website?: string;
};
export function parseNote(input: unknown): { note?: ValidNote; error?: string } {
  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) return { error: "Check your email addresses and message, then try again." };
  const v = parsed.data;
  const message = normalizeMessage(v.message);
  if (!message.trim()) return { error: "Write a little note first." };
  if (characterCount(message) > 1000) return { error: "Keep your note to 1,000 characters." };
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(message))
    return { error: "Your note contains an unsupported control character." };
  if (v.recipients.some((r) => !validEmail(r.trim())))
    return { error: "Use one complete email address in each recipient field." };
  const seen = new Set<string>();
  const recipients = v.recipients
    .map((r) => r.trim())
    .filter((r) => {
      const c = canonicalEmail(r);
      if (seen.has(c)) return false;
      seen.add(c);
      return true;
    })
    .sort((a, b) => canonicalEmail(a).localeCompare(canonicalEmail(b)));
  return { note: { ...v, recipients, message } };
}
