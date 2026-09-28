export const COPY = {
  invalid_email: "hmm... that doesn't look like somewhere our bird can fly.",
  empty: "the bird needs something to say.",
  too_long: "that note is a little too long for one flight. keep it under 1,000 characters.",
  rate: "that bird needs a quick rest. try again in a little while.",
  undeliverable: "we couldn't deliver this note.",
  moderation: "we can't deliver this message.",
  captcha: "please try that again.",
  duplicate: "a matching note is already on its way. give it a little time.",
  server: "our bird got a little lost. please try again.",
} as const;

export type CopyCode = keyof typeof COPY;

export const REPORT_CATEGORIES = [
  ["harassment", "harassment or bullying"],
  ["threats", "threats or violence"],
  ["hate", "hate or discrimination"],
  ["sexual", "sexual or inappropriate content"],
  ["spam", "spam"],
  ["scam", "scam or fraud"],
  ["personal", "personal information"],
  ["other", "other"],
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number][0];

export const REPORT_CATEGORY_IDS = REPORT_CATEGORIES.map(([id]) => id);
