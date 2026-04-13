import { useCallback, useEffect, useRef, useState } from "react";

function normalizeReplyText(s) {
  if (typeof s !== "string") return "";
  return s
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");
}

function AssistantMessageBody({ text }) {
  const lines = normalizeReplyText(typeof text === "string" ? text : "").split("\n");
  return lines.map((line, idx) => (
    <div key={idx} style={{ marginTop: idx ? 4 : 0 }}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((seg, j) => {
        const m = seg.match(/^\*\*([^*]+)\*\*$/);
        if (m) return <strong key={j}>{m[1]}</strong>;
        return seg;
      })}
    </div>
  ));
}

export default function PlanPageAiChat({ apiBase = "http://localhost:3000" }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await fetch(`${apiBase}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json().catch(() => ({}));
      const reply =
        typeof data.reply === "string"
          ? data.reply
          : res.ok
            ? ""
            : typeof data.error === "string"
              ? data.error
              : "Request failed";

      setMessages((m) => [
        ...m,
        { role: "assistant", text: reply || "(empty response)" },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Network error. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }, [apiBase, input, loading]);

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const shell = {
    position: "fixed",
    bottom: 20,
    right: 20,
    width: 300,
    maxHeight: "min(420px, 70vh)",
    display: "flex",
    flexDirection: "column",
    zIndex: 9999,
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
    background: "#fff",
    border: "1px solid #e8e8ec",
    fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    fontSize: 13,
  };

  const header = {
    padding: "10px 12px",
    background: "#f6f6f8",
    borderBottom: "1px solid #e8e8ec",
    fontWeight: 600,
    color: "#1a1a1e",
  };

  const list = {
    flex: 1,
    overflowY: "auto",
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minHeight: 200,
    maxHeight: 280,
  };

  const bubble = (role) => ({
    alignSelf: role === "user" ? "flex-end" : "flex-start",
    maxWidth: "88%",
    padding: "8px 10px",
    borderRadius: 12,
    lineHeight: 1.4,
    whiteSpace: role === "user" ? "pre-wrap" : "normal",
    wordBreak: "break-word",
    ...(role === "user"
      ? { background: "#2563eb", color: "#fff", borderBottomRightRadius: 4 }
      : { background: "#f0f0f3", color: "#222", borderBottomLeftRadius: 4 }),
  });

  const footer = {
    display: "flex",
    gap: 8,
    padding: 10,
    borderTop: "1px solid #e8e8ec",
    background: "#fafafa",
  };

  const inputStyle = {
    flex: 1,
    border: "1px solid #d4d4d8",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    outline: "none",
  };

  const btn = {
    padding: "8px 14px",
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600,
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.7 : 1,
  };

  const typing = {
    alignSelf: "flex-start",
    padding: "8px 10px",
    borderRadius: 12,
    background: "#f0f0f3",
    color: "#666",
    fontSize: 12,
  };

  return (
    <div style={shell} aria-label="AI chat">
      <div style={header}>Chat</div>
      <div ref={listRef} style={list}>
        {messages.length === 0 && !loading && (
          <div style={{ ...typing, alignSelf: "center", background: "transparent" }}>
            Ask anything…
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={bubble(msg.role)}>
            {msg.role === "assistant" ? (
              <AssistantMessageBody text={msg.text} />
            ) : (
              msg.text
            )}
          </div>
        ))}
        {loading && <div style={typing}>Thinking…</div>}
      </div>
      <div style={footer}>
        <input
          style={inputStyle}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Message…"
          disabled={loading}
          autoComplete="off"
        />
        <button type="button" style={btn} onClick={send} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}
