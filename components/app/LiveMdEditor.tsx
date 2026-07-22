"use client";

import { useEffect, useRef, useState } from "react";
import { mdToHtml } from "@/lib/markdown";

type Caret = "start" | "end" | number;
type Line = { id: number; text: string };

function splitLines(src: string): Line[] {
  const parts = src.split(/\r?\n/);
  return (parts.length ? parts : [""]).map((text, i) => ({ id: i, text }));
}

/**
 * Editor de markdown "ao vivo", linha a linha (estilo Notion/Typora) — sem
 * painel dividido. A linha em edição mostra a sintaxe crua; ao sair dela
 * (Enter, seta, clique em outra linha, ou clique fora), ela é renderizada
 * como HTML formatado. Cada linha do mdToHtml já produz um bloco
 * independente (título, item de lista, parágrafo…), então renderizar
 * linha a linha reaproveita o parser existente sem duplicar regras.
 */
export function LiveMdEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [lines, setLines] = useState<Line[]>(() => splitLines(value));
  const [activeId, setActiveId] = useState<number | null>(value.trim() ? null : 0);
  const nextId = useRef(lines.length);
  const pendingCaret = useRef<Caret | null>(value.trim() ? null : "end");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const blurTimeout = useRef<number | null>(null);

  const emit = (next: Line[]) => {
    setLines(next);
    onChange(next.map((l) => l.text).join("\n"));
  };

  const cancelBlur = () => {
    if (blurTimeout.current !== null) {
      window.clearTimeout(blurTimeout.current);
      blurTimeout.current = null;
    }
  };

  const activate = (id: number, caret: Caret = "end") => {
    cancelBlur();
    pendingCaret.current = caret;
    setActiveId(id);
  };

  useEffect(() => {
    if (activeId === null) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    const caret = pendingCaret.current;
    pendingCaret.current = null;
    if (caret === "start") el.setSelectionRange(0, 0);
    else if (typeof caret === "number") {
      const pos = Math.min(caret, el.value.length);
      el.setSelectionRange(pos, pos);
    } else el.setSelectionRange(el.value.length, el.value.length);
  }, [activeId]);

  const indexOf = (id: number) => lines.findIndex((l) => l.id === id);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: number) => {
    const i = indexOf(id);
    const el = e.currentTarget;
    if (e.key === "Enter") {
      e.preventDefault();
      const pos = el.selectionStart ?? el.value.length;
      const before = el.value.slice(0, pos);
      const after = el.value.slice(pos);
      const newId = nextId.current++;
      const next = [...lines];
      next[i] = { ...next[i], text: before };
      next.splice(i + 1, 0, { id: newId, text: after });
      emit(next);
      activate(newId, "start");
      return;
    }
    if (e.key === "Backspace" && el.selectionStart === 0 && el.selectionEnd === 0 && i > 0) {
      e.preventDefault();
      const prev = lines[i - 1];
      const mergeAt = prev.text.length;
      const next = [...lines];
      next[i - 1] = { ...prev, text: prev.text + el.value };
      next.splice(i, 1);
      emit(next);
      activate(prev.id, mergeAt);
      return;
    }
    if (e.key === "ArrowUp" && i > 0) {
      e.preventDefault();
      activate(lines[i - 1].id, el.selectionStart ?? "end");
      return;
    }
    if (e.key === "ArrowDown" && i < lines.length - 1) {
      e.preventDefault();
      activate(lines[i + 1].id, el.selectionStart ?? "end");
      return;
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, id: number) => {
    const text = e.clipboardData.getData("text");
    if (!text.includes("\n")) return; // deixa o comportamento padrão do input (linha única)
    e.preventDefault();
    const i = indexOf(id);
    const el = e.currentTarget;
    const pos = el.selectionStart ?? el.value.length;
    const before = el.value.slice(0, pos);
    const after = el.value.slice(el.selectionEnd ?? pos);
    const pasted = text.split(/\r?\n/);
    const middle = pasted.slice(1, -1).map((t) => ({ id: nextId.current++, text: t }));
    const lastId = pasted.length > 1 ? nextId.current++ : id;
    const next = [...lines];
    next.splice(
      i,
      1,
      { id, text: before + pasted[0] },
      ...middle,
      ...(pasted.length > 1 ? [{ id: lastId, text: pasted[pasted.length - 1] + after }] : []),
    );
    emit(next);
    activate(lastId, pasted[pasted.length - 1].length);
  };

  return (
    <div
      style={{ minHeight: "100%" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) activate(lines[lines.length - 1].id);
      }}
    >
      {lines.map((line) =>
        line.id === activeId ? (
          <input
            key={line.id}
            ref={inputRef}
            value={line.text}
            onChange={(e) => {
              const i = indexOf(line.id);
              const next = [...lines];
              next[i] = { ...next[i], text: e.target.value };
              emit(next);
            }}
            onKeyDown={(e) => handleKeyDown(e, line.id)}
            onPaste={(e) => handlePaste(e, line.id)}
            onBlur={() => {
              blurTimeout.current = window.setTimeout(() => setActiveId(null), 0);
            }}
            placeholder={lines.length === 1 && !line.text ? placeholder : undefined}
            style={{
              display: "block",
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              font: "400 13px var(--font-jetbrains), monospace",
              padding: "2px 0",
              color: "#1c1e26",
              minHeight: 22,
            }}
          />
        ) : (
          <div
            key={line.id}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => activate(line.id)}
            className="md-preview"
            style={{ minHeight: 22, cursor: "text" }}
            dangerouslySetInnerHTML={{ __html: mdToHtml(line.text) || "<p>&nbsp;</p>" }}
          />
        ),
      )}
    </div>
  );
}
