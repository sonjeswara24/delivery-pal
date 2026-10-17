import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  stops: z
    .array(z.object({ id: z.string(), customer: z.string(), address: z.string(), item: z.string(), eta: z.string() }))
    .min(1)
    .max(30),
});

export const planRoute = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const { createAnthropic } = await import("@ai-sdk/anthropic");
    const { streamText } = await import("ai");
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { error: "AI is not configured." };

    let runId: string | undefined;
    const runFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
      const res = await fetch(input, { ...init, headers });
      runId ??= res.headers.get("X-Lovable-AIG-Run-ID") ?? undefined;
      return res;
    };
    const anthropic = createAnthropic({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runFetch,
    });

    try {
      const result = streamText({
        model: anthropic("anthropic/claude-sonnet-5"),
        maxOutputTokens: 2000,
        maxRetries: 0,
        system:
          "You are a dispatch assistant for a delivery rider. Given pending stops, suggest an efficient visiting order considering area proximity and time windows (ETA). Reply in short markdown-free plain text: a numbered list 'ID – customer – area – reason', then one line of tips. Keep under 150 words.",
        prompt: JSON.stringify(data.stops),
      });
      const text = await result.text;
      if (!text.trim()) return { error: "The assistant couldn't produce a plan." };
      return { text };
    } catch (e: any) {
      const status = e?.statusCode ?? e?.status;
      if (status === 402) return { error: "AI credits are used up. Please add credits to continue." };
      if (status === 429) return { error: "Too many requests — please try again in a moment." };
      if (status === 403) return { error: "AI access was denied for this request." };
      console.error(e);
      return { error: "Couldn't generate a route plan right now." };
    }
  });
