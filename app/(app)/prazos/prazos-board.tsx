"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { ACCENT, sevMap, badgeMap } from "@/lib/design";
import { mdToHtml } from "@/lib/markdown";
import { AddChange } from "./add-change";
import { addMonth, deleteChange, deleteMonth, saveChangeContent, type PrazosState } from "./actions";

export type ChangeRow = {
  id: string;
  month: string;
  severity: string;
  title: string;
  description: string;
  date: string;
  badge: string;
  content: string;
};

function monthLabel(mk: string) {
  const [yy, mm] = mk.split("-").map(Number);
  return new Date(yy, mm - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function Drawer({ change, onClose }: { change: ChangeRow; onClose: () => void }) {
  const [text, setText] = useState(change.content);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const html = useMemo(() => mdToHtml(text), [text]);
  const dirty = text !== change.content && !saved;

  const save = () => {
    setError(null);
    const fd = new FormData();
    fd.set("id", change.id);
    fd.set("content", text);
    startTransition(async () => {
      const res = await saveChangeContent(fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <>
      <div onClick={onClose} className="overlay-in" style={{ position: "fixed", inset: 0, background: "rgba(20,20,30,.32)", zIndex: 40 }} />
      <div className="drawer-in" style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 880, maxWidth: "96vw", background: "#fff", zIndex: 50, display: "flex", flexDirection: "column", boxShadow: "-16px 0 48px rgba(20,20,30,.2)" }}>
        <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: "1px solid #e7e7e3" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.3, textWrap: "pretty" }}>{change.title}</div>
            <div style={{ fontSize: 11, color: "#8a8d98", fontFamily: "var(--font-jetbrains)", marginTop: 2 }}>{change.date}</div>
          </div>
          {error ? <div style={{ fontSize: 11.5, color: "#b3402e", flex: "none" }}>{error}</div> : null}
          <button
            onClick={save}
            disabled={pending}
            className="hv-btn"
            style={{ marginLeft: "auto", flex: "none", fontSize: 12, fontWeight: 600, color: "#fff", background: saved ? "#0e7a6f" : ACCENT, border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", opacity: pending ? 0.7 : 1 }}
          >
            {pending ? "Salvando…" : saved ? "Salvo ✓" : "Salvar"}
          </button>
          <button onClick={onClose} className="hv-light" style={{ flex: "none", width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center", cursor: "pointer", color: "#4b4e58", background: "none", border: "none", fontSize: 15 }}>
            ✕
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          <div style={{ display: "flex", flexDirection: "column", minHeight: 0, borderRight: "1px solid #e7e7e3" }}>
            <div style={{ flex: "none", fontSize: 10.5, fontWeight: 600, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".05em", padding: "12px 20px 6px" }}>
              Anotações (markdown) {dirty ? <span style={{ color: "#c98a2e" }}>· não salvo</span> : null}
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
              placeholder={"Escreva em markdown…\n\n# Título\n**negrito**, *itálico*, `código`\n- item de lista\n> citação"}
              style={{ flex: 1, minHeight: 0, width: "100%", font: "400 13px var(--font-jetbrains), monospace", border: "none", outline: "none", resize: "none", lineHeight: 1.7, padding: "6px 20px 20px", background: "#fafaf8" }}
            />
          </div>
          <div style={{ minHeight: 0, overflow: "auto", padding: "12px 22px 24px" }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>Pré-visualização</div>
            {text.trim() ? (
              <div className="md-preview" style={{ fontSize: 14 }} dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <div style={{ fontSize: 12, color: "#a0a3ad", fontStyle: "italic" }}>A formatação aparece aqui enquanto você escreve.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export function PrazosBoard({ months, changes }: { months: string[]; changes: ChangeRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = changes.find((c) => c.id === openId) ?? null;
  const [monthState, monthAction, monthPending] = useActionState<PrazosState, FormData>(
    async (_prev, fd) => addMonth(fd),
    {},
  );

  return (
    <div className="stagger" style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 24, height: "100%", overflow: "auto" }}>
      <form
        action={monthAction}
        style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, padding: "12px 16px" }}
      >
        <div style={{ fontSize: 12.5, fontWeight: 700 }}>Adicionar mês</div>
        <input type="month" name="month" required style={{ fontSize: 12.5, padding: "7px 9px", borderRadius: 8, border: "1px solid #e2e2de", color: "#33363f", fontFamily: "var(--font-jetbrains)" }} />
        <button type="submit" disabled={monthPending} className="hv-btn" style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: ACCENT, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", opacity: monthPending ? 0.7 : 1 }}>
          {monthPending ? "Adicionando…" : "+ Adicionar"}
        </button>
        {monthState.error ? <div style={{ fontSize: 11.5, color: "#b3402e" }}>{monthState.error}</div> : null}
        <div style={{ marginLeft: "auto", fontSize: 11.5, color: "#8a8d98" }}>Clique em um card para abrir as anotações em markdown</div>
      </form>

      {months.map((mk) => {
        const cards = changes.filter((c) => c.month === mk);
        return (
          <div key={mk}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#6b6e78", letterSpacing: ".06em", textTransform: "uppercase" }}>{monthLabel(mk)}</div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <AddChange month={mk} />
                <form action={async (fd) => { await deleteMonth(fd); }}>
                  <input type="hidden" name="month" value={mk} />
                  <button type="submit" title="Remover mês" className="hv-redbg" style={{ width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center", color: "#b3402e", cursor: "pointer", border: "1px solid #f0d5d0", background: "none" }}>
                    <svg width="13" height="13" viewBox="0 0 13 13"><path d="M2 3.5h9M5 3.5V2h3v1.5M3 3.5l.6 8h5.8l.6-8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </form>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
              {cards.map((c) => {
                const sv = sevMap[c.severity] || sevMap.informativo;
                const bd = c.badge ? badgeMap[c.badge] || { bg: "#f4f4f2", fg: "#6b6e78" } : null;
                return (
                  <div key={c.id} onClick={() => setOpenId(c.id)} className="hv-card" style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, padding: "16px 18px", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 99, background: sv.dot }} />
                      <div style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: sv.tagBg, color: sv.tagFg }}>{sv.label}</div>
                      {c.content.trim() ? (
                        <div title="Tem anotações" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 600, color: ACCENT }}>
                          <svg width="12" height="12" viewBox="0 0 13 13"><path d="M2.5 1.5h6l2 2v8h-8z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M4.5 6h4M4.5 8.2h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                          notas
                        </div>
                      ) : null}
                      <form action={async (fd) => { await deleteChange(fd); }} onClick={(e) => e.stopPropagation()} style={{ marginLeft: "auto" }}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" title="Remover" className="hv-danger" style={{ color: "#c2c3c9", cursor: "pointer", padding: 2, background: "none", border: "none" }}>
                          <svg width="14" height="14" viewBox="0 0 15 15"><path d="M2 3.5h11M6 3.5V2h3v1.5M3.5 3.5l.7 9.5h6.6l.7-9.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                      </form>
                    </div>
                    <div style={{ fontSize: 14.5, fontWeight: 700, marginTop: 9, lineHeight: 1.35, textWrap: "pretty" }}>{c.title}</div>
                    {c.description ? <div style={{ fontSize: 12, color: "#8a8d98", marginTop: 6, lineHeight: 1.5, textWrap: "pretty" }}>{c.description}</div> : null}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14 }}>
                      <svg width="12" height="12" viewBox="0 0 13 13" style={{ color: "#a0a3ad", flex: "none" }}><rect x="1" y="2.5" width="11" height="9.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.3" /><line x1="1" y1="5.3" x2="12" y2="5.3" stroke="currentColor" strokeWidth="1.3" /></svg>
                      <div style={{ fontSize: 11.5, color: "#8a8d98", fontFamily: "var(--font-jetbrains)" }}>{c.date}</div>
                      {bd ? <div style={{ marginLeft: "auto", flex: "none", fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: bd.bg, color: bd.fg }}>{c.badge}</div> : null}
                    </div>
                  </div>
                );
              })}
              {cards.length === 0 ? (
                <div style={{ fontSize: 12, color: "#a0a3ad", fontStyle: "italic", padding: "8px 2px" }}>Mês sem mudanças — use “+ Nova mudança”.</div>
              ) : null}
            </div>
          </div>
        );
      })}
      {months.length === 0 ? <div style={{ fontSize: 12.5, color: "#a0a3ad", fontStyle: "italic" }}>Nenhum mês cadastrado — adicione um mês acima.</div> : null}

      {open ? <Drawer key={open.id} change={open} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}
