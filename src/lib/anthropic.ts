export async function anthropicText(
  key: string,
  system: string,
  messages: { role: "user" | "assistant"; content: string }[],
  model = "claude-haiku-4-5",
  maxTokens = 512,
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
  });
  if (!res.ok) throw new Error(`AI error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return (j.content?.[0]?.text ?? "").trim();
}
