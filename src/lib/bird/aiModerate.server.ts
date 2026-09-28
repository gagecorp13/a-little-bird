/**
 * Optional second pass. Heuristics always run first.
 * One short call, only when a visitor actually sends, and only if a key exists.
 */
export async function aiAllowsMessage(text: string): Promise<boolean> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) return true;

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0,
        max_tokens: 30,
        messages: [
          {
            role: "user",
            content:
              'Safety classifier for an anonymous note. Reply JSON only: {"allow":true} or {"allow":false}. ' +
              "allow false ONLY for serious threats of violence, clearly abusive harassment, sexual content involving minors, " +
              "doxxing (addresses, government ids, private phone numbers presented as someone else's), or scams asking for money, credentials, or gift cards. " +
              "allow true for compliments, apologies, crushes, thanks, mild criticism, jokes, and ordinary personal notes.\n\nNote:\n" +
              text.slice(0, 1000),
          },
        ],
      }),
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) return true;
    const body = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = body.choices?.[0]?.message?.content ?? "";
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return true;
    const parsed = JSON.parse(match[0]) as { allow?: unknown };
    return parsed.allow !== false;
  } catch {
    return true;
  }
}
