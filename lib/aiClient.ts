export type AiResponse = {
  content: string;
  raw?: unknown;
  error?: string;
  details?: unknown;
};

export async function askAI(prompt: string, options?: { temperature?: number; max_tokens?: number }) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, ...options }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI request failed: ${res.status} ${text}`);
  }

  const data: AiResponse = await res.json();
  if (data.error) {
    throw new Error(String(data.error));
  }
  return data;
}
