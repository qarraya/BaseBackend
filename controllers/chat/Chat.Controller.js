import OpenAI from "openai";

function normalizeReplyContent(s) {
  if (typeof s !== "string") return "";
  return s
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .trim();
}

/** Some Groq models (e.g. Compound / JSON-style) return a JSON string; extract plain text. */
function unwrapNestedJsonText(s) {
  if (typeof s !== "string") return "";
  const original = s.trim();
  let t = original;
  const fenced = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) t = fenced[1].trim();
  if (t.startsWith("{")) {
    try {
      const obj = JSON.parse(t);
      for (const key of [
        "reply",
        "message",
        "response",
        "text",
        "answer",
        "content",
      ]) {
        if (obj && typeof obj[key] === "string" && obj[key].trim()) {
          return obj[key].trim();
        }
      }
    } catch {
      /* use full string */
    }
  }
  return original;
}

/** Remove junk scripts and markdown; do not strip Latin (avoids broken words like «خبز ي» after mixed output). */
function arabicOnlyReply(s) {
  if (typeof s !== "string") return "";
  let t = s.replace(/\\+/g, " ");
  t = t.replace(/\s*\/\s*/g, " ");
  t = t.replace(/\*{1,2}/g, "");
  t = t.replace(/[\u0370-\u03FF]/g, "");
  t = t.replace(/[\u0400-\u052F\u1C90-\u1CBF]/g, "");
  t = t.replace(/[\u4E00-\u9FFF\u3400-\u4DBF]/g, "");
  t = t.replace(/[\u3040-\u30FF]/g, "");
  t = t.replace(/[\uAC00-\uD7AF]/g, "");
  t = t.replace(/[\u0590-\u05FF]/g, "");
  t = t.replace(/[\u0900-\u09FF]/g, "");
  if (process.env.CHAT_STRIP_LATIN === "1" || process.env.CHAT_STRIP_LATIN === "true") {
    t = t.replace(/[A-Za-z]/g, "");
  }
  t = t.replace(/[ \t]+/g, " ");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

function flattenReplyLineBreaks(s) {
  if (typeof s !== "string") return "";
  return s
    .replace(/\r\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/\\n/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CHAT_SYSTEM_PROMPT =
  process.env.CHAT_SYSTEM_PROMPT?.trim() ||
  `You are a professional nutritionist assistant.

IMPORTANT RULES:
- Always respond ONLY in Arabic
- Do NOT use any English words
- Use clear and simple Arabic
- Format answers in a clean and readable way

If the response is not fully in Arabic, it is considered incorrect.

IMPORTANT:
- Do NOT use \\n or any escape characters in your response
- Return plain text only
- Keep the response in one clean paragraph or simple sentences`;

const USER_MESSAGE_ARABIC_SUFFIX = "\n\n(أجب باللغة العربية فقط)";

function chatTemperature() {
  const t = Number.parseFloat(process.env.CHAT_TEMPERATURE ?? "0.35");
  if (!Number.isFinite(t)) return 0.35;
  return Math.min(2, Math.max(0, t));
}

let chatRuntime = null;

function getChatRuntime() {
  if (chatRuntime) return chatRuntime;

  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    chatRuntime = {
      client: new OpenAI({
        apiKey: groqKey,
        baseURL: "https://api.groq.com/openai/v1",
      }),
      model:
        process.env.GROQ_CHAT_MODEL?.trim() || "llama-3.3-70b-versatile",
      provider: "groq",
    };
    return chatRuntime;
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    chatRuntime = {
      client: new OpenAI({ apiKey: openaiKey }),
      model: process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-4o-mini",
      provider: "openai",
    };
    return chatRuntime;
  }

  return null;
}

export const postChat = async (req, res) => {
  try {
    const raw = req.body?.message;
    const message = typeof raw === "string" ? raw.trim() : "";

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const runtime = getChatRuntime();
    if (!runtime) {
      return res.status(503).json({
        error:
          "Chat is not configured. Set GROQ_API_KEY (free: https://console.groq.com/keys ) or OPENAI_API_KEY in .env",
      });
    }

    const completion = await runtime.client.chat.completions.create({
      model: runtime.model,
      temperature: chatTemperature(),
      messages: [
        { role: "system", content: CHAT_SYSTEM_PROMPT },
        { role: "user", content: message + USER_MESSAGE_ARABIC_SUFFIX },
      ],
    });

    const rawContent =
      completion.choices[0]?.message?.content?.trim() || "";
    const unwrapped = unwrapNestedJsonText(rawContent);
    const reply = flattenReplyLineBreaks(
      arabicOnlyReply(normalizeReplyContent(unwrapped))
    );

    res.json({ reply });
  } catch (err) {
    const status = err?.status;
    const msg = (err?.message || String(err)).trim();
    const rt = getChatRuntime();
    console.error("postChat LLM error:", rt?.provider || "?", status || "", msg);

    let error = "Failed to get chat response";
    let http = 500;
    const lower = msg.toLowerCase();

    if (status === 401) {
      error =
        "Invalid API key. For Groq: console.groq.com/keys — For OpenAI: platform.openai.com/api-keys";
    } else if (status === 403) {
      error =
        "Provider refused the request (403). Check account or model access.";
    } else if (status === 429) {
      http = 429;
      if (lower.includes("quota") || err?.code === "insufficient_quota") {
        error =
          "Quota or billing limit reached for this provider. For OpenAI add credits; for Groq check rate limits on console.groq.com";
      } else {
        error = "Rate limit. Wait a moment and try again.";
      }
    } else if (
      lower.includes("insufficient_quota") ||
      lower.includes("billing") ||
      lower.includes("exceeded your current quota")
    ) {
      error =
        "Billing/quota issue on the configured provider. Try Groq (free tier) with GROQ_API_KEY, or add credits for OpenAI.";
    } else if (
      status === 400 &&
      (lower.includes("model") || lower.includes("does not exist"))
    ) {
      error = `Model may be wrong. Provider: ${rt?.provider || "?"}, model: ${rt?.model || "?"}. Set GROQ_CHAT_MODEL or OPENAI_CHAT_MODEL in .env.`;
    }

    const payload = { error };
    if (process.env.NODE_ENV !== "production") {
      payload.detail = msg;
    }

    res.status(http).json(payload);
  }
};
