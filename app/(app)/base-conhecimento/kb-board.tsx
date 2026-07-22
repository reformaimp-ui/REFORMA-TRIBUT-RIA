"use client";

import { useMemo, useState, useTransition } from "react";
import { ACCENT } from "@/lib/design";
import { mdToHtml } from "@/lib/markdown";
import { addNote, deleteNote, updateNote } from "./actions";

export type NoteRow = { id: string; title: string; content: string; created_at: string };

const BTN: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 8,
  padding: "8px 14px",
  cursor: "pointer",
  border: "none",
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

type Perms = { create: boolean; edit: boolean; delete: boolean };

export function KbBoard({ notes, perms }: { notes: NoteRow[]; perms: Perms }) {
  const [selId, setSelId] = useState<string | null>(notes[0]?.id ?? null);
  const [mode, setMode] = useState<"view" | "edit" | "new">(notes.length ? "view" : perms.create ? "new" : "view");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [pending, startTransition] = useTransition();

  const sel = notes.find((n) => n.id === selId) ?? null;
  const previewHtml = useMemo(() => mdToHtml(draftContent), [draftContent]);
  const viewHtml = useMemo(() => (sel ? mdToHtml(sel.content) : ""), [sel]);

  const startNew = () => {
    setMode("new");
    setDraftTitle("");
    setDraftContent("");
  };
  const startEdit = () => {
    if (!sel) return;
    setMode("edit");
    setDraftTitle(sel.title);
    setDraftContent(sel.content);
  };
  const save = () => {
    if (!draftTitle.trim() || pending) return;
    const fd = new FormData();
    fd.set("title", draftTitle.trim());
    fd.set("content", draftContent);
    startTransition(async () => {
      if (mode === "new") {
        const id = await addNote(fd);
        if (id) setSelId(id);
      } else if (sel) {
        fd.set("id", sel.id);
        await updateNote(fd);
      }
      setMode("view");
    });
  };
  const remove = () => {
    if (!sel || pending) return;
    if (!window.confirm(`Excluir a nota "${sel.title}"?`)) return;
    const fd = new FormData();
    fd.set("id", sel.id);
    startTransition(async () => {
      await deleteNote(fd);
      const rest = notes.filter((n) => n.id !== sel.id);
      setSelId(rest[0]?.id ?? null);
      setMode(rest.length ? "view" : "new");
    });
  };

  const editing = mode === "edit" || mode === "new";

  return (
    <div style={{ height: "100%", display: "grid", gridTemplateColumns: "300px 1fr" }}>
      {/* lista */}
      <div style={{ borderRight: "1px solid #e7e7e3", background: "#fff", overflow: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", padding: "2px 8px 8px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".05em" }}>Notas</div>
          {perms.create ? (
            <button onClick={startNew} className="hv-btn" style={{ ...BTN, marginLeft: "auto", color: "#fff", background: ACCENT, padding: "6px 12px", fontSize: 11.5 }}>
              + Nova nota
            </button>
          ) : null}
        </div>
        <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {notes.map((n) => {
            const on = mode !== "new" && n.id === selId;
            return (
              <div
                key={n.id}
                onClick={() => {
                  setSelId(n.id);
                  setMode("view");
                }}
                className="hv-light"
                style={{
                  padding: "10px 12px",
                  borderRadius: 9,
                  cursor: "pointer",
                  ...(on ? { background: "#eef1ff", boxShadow: `inset 2.5px 0 0 ${ACCENT}` } : {}),
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.35 }}>{n.title}</div>
                <div style={{ fontSize: 10.5, color: "#8a8d98", marginTop: 3, fontFamily: "var(--font-jetbrains)" }}>{fmtDate(n.created_at)}</div>
              </div>
            );
          })}
          {notes.length === 0 ? (
            <div style={{ fontSize: 12, color: "#a0a3ad", fontStyle: "italic", padding: "6px 8px" }}>Nenhuma nota ainda.</div>
          ) : null}
        </div>
      </div>

      {/* conteúdo */}
      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }} className="animate-fadeup">
          <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 10, padding: "14px 22px", background: "#fff", borderBottom: "1px solid #e7e7e3" }}>
            <input
              className="fc"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              autoFocus
              placeholder="Título da nota…"
              style={{ flex: 1, font: "700 16px var(--font-instrument)", border: "1.5px solid #e2e2de", borderRadius: 9, padding: "8px 12px", outline: "none" }}
            />
            <button
              onClick={save}
              disabled={!draftTitle.trim() || pending}
              className={draftTitle.trim() ? "hv-btn" : undefined}
              style={{ ...BTN, color: "#fff", background: ACCENT, opacity: draftTitle.trim() && !pending ? 1 : 0.45, cursor: draftTitle.trim() && !pending ? "pointer" : "not-allowed" }}
            >
              {pending ? "Salvando…" : "Salvar"}
            </button>
            {mode === "edit" ? (
              <button onClick={() => setMode("view")} className="hv-light" style={{ ...BTN, color: "#4b4e58", background: "#fff", border: "1.5px solid #e2e2de" }}>
                Cancelar
              </button>
            ) : null}
          </div>
          <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ display: "flex", flexDirection: "column", minHeight: 0, borderRight: "1px solid #e7e7e3" }}>
              <div style={{ flex: "none", fontSize: 10.5, fontWeight: 600, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".05em", padding: "12px 18px 6px" }}>
                Markdown
              </div>
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                placeholder={"Escreva em markdown…\n\n# Título\n**negrito**, *itálico*, `código`\n- item de lista\n> citação"}
                style={{ flex: 1, minHeight: 0, width: "100%", font: "400 13px var(--font-jetbrains), monospace", border: "none", outline: "none", resize: "none", lineHeight: 1.7, padding: "6px 18px 20px", background: "#fafaf8" }}
              />
            </div>
            <div style={{ minHeight: 0, overflow: "auto", padding: "12px 22px 24px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>Pré-visualização</div>
              {draftContent.trim() ? (
                <div className="md-preview" style={{ fontSize: 14 }} dangerouslySetInnerHTML={{ __html: previewHtml }} />
              ) : (
                <div style={{ fontSize: 12.5, color: "#a0a3ad", fontStyle: "italic" }}>A formatação aparece aqui enquanto você escreve.</div>
              )}
            </div>
          </div>
        </div>
      ) : sel ? (
        <div style={{ overflow: "auto", padding: "28px 44px", maxWidth: 860 }} className="animate-fadeup">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em", margin: 0, textWrap: "pretty", flex: 1 }}>{sel.title}</h1>
            {perms.edit ? (
              <button onClick={startEdit} className="hv-light" style={{ ...BTN, flex: "none", color: "#4b4e58", background: "#fff", border: "1.5px solid #e2e2de" }}>
                Editar
              </button>
            ) : null}
            {perms.delete ? (
              <button onClick={remove} className="hv-redbg" style={{ ...BTN, flex: "none", color: "#b3402e", background: "#fff", border: "1.5px solid #f0d5d0" }}>
                Excluir
              </button>
            ) : null}
          </div>
          <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 20, fontFamily: "var(--font-jetbrains)" }}>{fmtDate(sel.created_at)}</div>
          {sel.content.trim() ? (
            <div className="md-preview" style={{ fontSize: 14 }} dangerouslySetInnerHTML={{ __html: viewHtml }} />
          ) : (
            <div style={{ fontSize: 12.5, color: "#a0a3ad", fontStyle: "italic" }}>Nota sem conteúdo — clique em Editar.</div>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", placeItems: "center", color: "#a0a3ad", fontSize: 13 }}>Selecione ou crie uma nota.</div>
      )}
    </div>
  );
}
