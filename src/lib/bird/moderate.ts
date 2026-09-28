const THREATS = [
  /\b(i(?:'|’)ll|i will|i'm going to|im going to|going to|gonna)\s+(kill|murder|rape)\b/i,
  /\b(kill|murder)\s+(you|yourself|urself|him|her|them|everyone)\b/i,
  /\b(shoot|stab)\s+(you|him|her|them)\b/i,
  /\b(kys|kill yourself)\b/i,
  /\b(bomb|shoot up)\s+(the |a |your )?(school|building|office|workplace|house)\b/i,
];

const EXPLOITATION = [
  /\bchild\s*porn/i,
  /\b(child|children|underage|minor|preteen|toddler)\b.{0,48}\b(sex|sexual|nude|nudes|porn|naked)\b/i,
  /\b(sex|sexual|nude|nudes|porn|naked)\b.{0,48}\b(child|children|underage|minor|preteen|toddler)\b/i,
];

const SCAMS = [
  /\b(gift\s*cards?|wire transfer|western union|bitcoin|crypto wallet)\b/i,
  /\b(password|passcode|one[- ]time code|ssn|social security)\b/i,
];

const PERSONAL = [
  /\b\d{3}-\d{2}-\d{4}\b/,
  /\b(?:\d{4}[- ]?){3}\d{4}\b/,
  /\b\d{1,6}\s+[a-z0-9.'-]+\s+(street|st\.|avenue|ave\.|road|rd\.|boulevard|blvd\.|lane|ln\.|drive|dr\.)\b/i,
];

const MARKUP = /<\s*\/?\s*[a-z!][^>]*>/i;

export function moderateMessage(text: string): { ok: true } | { ok: false } {
  const urls = text.match(/https?:\/\//gi);
  if (urls && urls.length >= 3) return { ok: false };
  if (MARKUP.test(text)) return { ok: false };
  if (/javascript\s*:/i.test(text) || /\bon(?:error|load|click)\s*=/i.test(text)) {
    return { ok: false };
  }
  const rules = [...THREATS, ...EXPLOITATION, ...SCAMS, ...PERSONAL];
  for (const rule of rules) {
    if (rule.test(text)) return { ok: false };
  }
  return { ok: true };
}
