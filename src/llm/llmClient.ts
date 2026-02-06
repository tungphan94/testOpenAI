import OpenAI from "openai";
import "dotenv/config";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryable(err: any) {
  const s = err?.status ?? err?.response?.status;
  if ([408, 429].includes(s)) return true;
  if (typeof s === "number" && s >= 500) return true;
  return /timeout|ECONNRESET|ENOTFOUND|EAI_AGAIN/i.test(String(err?.message));
}

/** Call LLM → JSON object */
export async function llmJson<T>(
  system: string,
  payload: unknown,
  response_schema:object,
  opts?: { model?: string; timeoutMs?: number; retries?: number }
): Promise<T> {
  const model = opts?.model ?? "gpt-5-mini";
  const retries = opts?.retries ?? 2;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await client.responses.create(
        {
          model,
          service_tier: "priority",
          input: [
            { role: "system", content: system },
            { role: "user", content: JSON.stringify(payload) },
          ],
          text: {
            format: {
              type: "json_schema",
              name: (response_schema as any).name,
              strict: (response_schema as any).strict ?? true,
              schema: (response_schema as any).schema,
            }
          },
        },
      );
      return JSON.parse(res.output_text ?? "{}") as T;
    } catch (e) {
      console.log(e);
      if (i < retries && isRetryable(e)) {
        await sleep(300 * (i + 1));
        continue;
      }
      throw e;
    }
  }
  throw new Error("llmJson failed");
}
