"use client";

import { useRef, useState } from "react";
import { ACCENT } from "@/lib/design";
import { askTaxAssistant, type AiChatMessage } from "@/lib/aiAssistant";

const SUGESTOES = [
  "Vendo parafusos de aço inoxidável para uso industrial",
  "Presto consultoria em desenvolvimento de sistemas sob encomenda",
  "Fabrico e revendo cadeiras de escritório estofadas",
];

export function TaxAiChat() {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToEnd = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  const send = async (text: string) => {
    const term = text.trim();
    if (!term || loading) return;
    setError(null);
    setInput("");
    const next = [...messages, { role: "user" as const, text: term }];
    setMessages(next);
    setLoading(true);
    scrollToEnd();
    const res = await askTaxAssistant(next);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setMessages((cur) => [...cur, { role: "assistant", text: res.reply }]);
    scrollToEnd();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", maxHeight: 640 }}>
      <div
        ref={listRef}
        style={{
          flex: 1, minHeight: 260, overflow: "auto", display: "flex", flexDirection: "column", gap: 12,
          background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, padding: 18,
        }}
      >
        {messages.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 12.5, color: "#8a8d98", lineHeight: 1.6 }}>
              Descreva o produto ou serviço que você vende ou presta. O assistente vai identificar o NCM ou NBS mais provável e a tributação de IBS e CBS — fazendo perguntas quando precisar de mais detalhes.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="hv-light"
                  style={{
                    textAlign: "left", fontSize: 12, color: "#4b4e58", background: "#fafaf8",
                    border: "1px solid #ececea", borderRadius: 9, padding: "9px 12px", cursor: "pointer",
                  }}
                >
                  “{s}”
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                background: m.role === "user" ? ACCENT : "#f7f7f4",
                color: m.role === "user" ? "#fff" : "#1c1e26",
                borderRadius: 12,
                padding: "10px 14px",
                fontSize: 13,
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
              }}
            >
              {m.text}
            </div>
          ))
        )}
        {loading ? (
          <div style={{ alignSelf: "flex-start", fontSize: 12, color: "#a0a3ad", fontStyle: "italic" }}>
            Consultando…
          </div>
        ) : null}
      </div>

      {error ? <div style={{ fontSize: 12, color: "#b3402e", marginTop: 8 }}>{error}</div> : null}

      <form onSubmit={onSubmit} style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Descreva o produto ou serviço…"
          style={{ flex: 1, fontSize: 13.5, padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e2e2de", outline: "none", background: "#fff" }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="hv-btn"
          style={{ fontSize: 13, fontWeight: 700, color: "#fff", background: ACCENT, padding: "0 20px", borderRadius: 10, border: "none", cursor: "pointer", opacity: loading || !input.trim() ? 0.6 : 1 }}
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
