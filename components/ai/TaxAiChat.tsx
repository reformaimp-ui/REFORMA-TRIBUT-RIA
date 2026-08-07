"use client";

import { useEffect, useRef, useState } from "react";
import { Package, Wrench, Percent, ShieldCheck, Coins, FileCheck2, MessageSquare, Plus, Trash2 } from "lucide-react";
import { ACCENT } from "@/lib/design";
import { mdToHtml } from "@/lib/markdown";
import { Spinner } from "@/components/app/Spinner";
import { askTaxAssistant, type AiChatMessage } from "@/lib/aiAssistant";
import { RuixenChatInput, QuickAction } from "@/components/ui/ruixen-chat-input";
import {
  listConversations,
  getConversation,
  appendToConversation,
  deleteConversation,
  type ConversationSummary,
} from "@/app/pesquisa/saved-actions";

// Cada chip preenche o campo com um começo de pergunta e deixa o cursor no fim —
// o cliente completa com o produto/serviço dele antes de enviar.
const ATALHOS = [
  { icon: <Package className="h-4 w-4" />, label: "Produto (NCM)", prefix: "Vendo " },
  { icon: <Wrench className="h-4 w-4" />, label: "Serviço (NBS)", prefix: "Presto o serviço de " },
  { icon: <Percent className="h-4 w-4" />, label: "Alíquota IBS/CBS", prefix: "Qual a alíquota de IBS e CBS para " },
  { icon: <FileCheck2 className="h-4 w-4" />, label: "CST e cClassTrib", prefix: "Qual o CST e o cClassTrib de " },
  { icon: <Coins className="h-4 w-4" />, label: "Crédito", prefix: "Posso me creditar de IBS e CBS na compra de " },
  { icon: <ShieldCheck className="h-4 w-4" />, label: "Regime específico", prefix: "Meu produto se enquadra em algum regime específico? Vendo " },
];

export function TaxAiChat({
  heroTitle,
  heroSubtitle,
  persist = false,
}: {
  /** Quando informado, a tela vazia vira o hero centralizado (título + campo + atalhos). */
  heroTitle?: string;
  heroSubtitle?: string;
  /** Grava a conversa e mostra o histórico. Só no portal do cliente — a aba
   *  interna da equipe não tem cliente de pesquisa a quem vincular a conversa. */
  persist?: boolean;
}) {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (persist) void listConversations().then(setConversations);
  }, [persist]);

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

    // Gravação best-effort: se falhar, a conversa segue na tela normalmente.
    if (persist) {
      const { conversationId: id } = await appendToConversation({ conversationId, question: term, answer: res.reply });
      if (id) {
        setConversationId(id);
        void listConversations().then(setConversations);
      }
    }
  };

  const applyAtalho = (prefix: string) => {
    setInput(prefix);
    // setTimeout em vez de requestAnimationFrame: o rAF não dispara quando o
    // documento está oculto, e o foco ficaria pendurado até a aba voltar.
    setTimeout(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }, 0);
  };

  const openConversation = async (id: string) => {
    setOpeningId(id);
    const conv = await getConversation(id);
    setOpeningId(null);
    if (!conv) return;
    setError(null);
    setMessages(conv.messages);
    setConversationId(conv.id);
    scrollToEnd();
  };

  const newConversation = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setInput("");
  };

  const removeConversation = async (id: string) => {
    setConversations((cur) => cur.filter((c) => c.id !== id));
    if (id === conversationId) newConversation();
    const res = await deleteConversation(id);
    if (res.error) void listConversations().then(setConversations);
  };

  const isEmpty = messages.length === 0 && !loading;

  const composer = (
    <RuixenChatInput
      ref={inputRef}
      value={input}
      onChange={setInput}
      onSubmit={(text) => void send(text)}
      disabled={loading}
      placeholder="Descreva o produto ou serviço…"
    />
  );

  const atalhos = (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      {ATALHOS.map((a) => (
        <QuickAction key={a.label} icon={a.icon} label={a.label} onClick={() => applyAtalho(a.prefix)} disabled={loading} />
      ))}
    </div>
  );

  const erro = error ? <div style={{ fontSize: 12, color: "#b3402e", marginTop: 8 }}>{error}</div> : null;

  const historico =
    persist && conversations.length > 0 ? (
      <section className="mt-9">
        <div className="mb-2.5 text-[10.5px] font-bold uppercase tracking-[.05em] text-muted">Conversas anteriores</div>
        <div className="flex flex-col gap-2">
          {conversations.map((c) => (
            <div key={c.id} className="hv-card flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-2.5">
              <button
                type="button"
                onClick={() => void openConversation(c.id)}
                disabled={openingId === c.id}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left disabled:opacity-60"
              >
                {openingId === c.id ? <Spinner size={14} /> : <MessageSquare className="h-4 w-4 shrink-0 text-muted" />}
                <span className="truncate text-[13px] font-semibold text-ink">{c.title}</span>
              </button>
              <button
                type="button"
                onClick={() => void removeConversation(c.id)}
                aria-label={`Excluir conversa ${c.title}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-[#fdf2f0] hover:text-[#b3402e]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    ) : null;

  // Tela vazia: composição centralizada — título, campo, atalhos e histórico.
  if (isEmpty) {
    return (
      <div className="flex w-full flex-1 flex-col items-center justify-center overflow-y-auto" style={{ minHeight: 0 }}>
        <div className="w-full py-6" style={{ maxWidth: 768 }}>
          {heroTitle ? (
            <div className="mb-8 text-center">
              <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-.02em", color: "#1c1e26" }}>{heroTitle}</h1>
              {heroSubtitle ? <p style={{ marginTop: 8, fontSize: 13.5, color: "#8a8d98" }}>{heroSubtitle}</p> : null}
            </div>
          ) : null}
          {composer}
          {erro}
          {atalhos}
          {historico}
        </div>
      </div>
    );
  }

  // Conversa em andamento: lista rolável + campo fixo embaixo.
  return (
    <div className="flex w-full flex-1 flex-col items-center" style={{ minHeight: 0 }}>
      <div className="flex w-full flex-1 flex-col" style={{ maxWidth: 768, minHeight: 0 }}>
        {persist ? (
          <div className="mb-2.5 flex items-center justify-end">
            <button
              type="button"
              onClick={newConversation}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white py-1.5 pl-2.5 pr-3.5 text-xs font-semibold text-[#4b4e58] transition-colors hover:border-[#d8d8d4] hover:bg-paper hover:text-ink"
            >
              <Plus className="h-3.5 w-3.5" />
              Nova conversa
            </button>
          </div>
        ) : null}

        <div
          ref={listRef}
          style={{
            flex: 1, minHeight: 260, overflow: "auto", display: "flex", flexDirection: "column", gap: 12,
            background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, padding: 18,
          }}
        >
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div
                key={i}
                className="animate-fadeup"
                style={{
                  alignSelf: "flex-end", maxWidth: "85%", background: ACCENT, color: "#fff",
                  borderRadius: 12, padding: "10px 14px", fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap",
                }}
              >
                {m.text}
              </div>
            ) : (
              <div
                key={i}
                className="md-preview animate-fadeup"
                style={{ alignSelf: "flex-start", maxWidth: "85%", background: "#f7f7f4", borderRadius: 12, padding: "10px 14px" }}
                dangerouslySetInnerHTML={{ __html: mdToHtml(m.text) }}
              />
            ),
          )}
          {loading ? (
            <div className="animate-fadeup" style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#a0a3ad", fontStyle: "italic" }}>
              <Spinner size={12} />
              Consultando…
            </div>
          ) : null}
        </div>

        {erro}

        <div className="mt-2.5">{composer}</div>
      </div>
    </div>
  );
}
