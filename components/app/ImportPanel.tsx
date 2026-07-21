"use client";

import { useRef, useState } from "react";
import { ACCENT } from "@/lib/design";

/**
 * Painel de importação em lote: dropzone estilizada (.csv), botão de template,
 * textarea com contagem ao vivo e submit. Usado em Clientes e IBS/CBS.
 */
export function ImportPanel({
  action,
  pending,
  error,
  hidden,
  desc,
  placeholder,
  noun,
  confirmLabel,
  template,
}: {
  action: (fd: FormData) => void;
  pending: boolean;
  error?: string;
  hidden?: Record<string, string>;
  desc: React.ReactNode;
  placeholder: string;
  noun: string;
  confirmLabel: (n: number) => string;
  template: { filename: string; content: string };
}) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const n = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => l.split(",")[0].trim() && !/^nome$/i.test(l.split(",")[0].trim())).length;

  const readFile = (f: File) => {
    const r = new FileReader();
    r.onload = () => {
      setText(String(r.result || ""));
      setFileName(f.name);
    };
    r.readAsText(f);
  };

  const downloadTemplate = () => {
    const blob = new Blob(["﻿" + template.content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = template.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <form
      action={action}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        background: "#fff",
        border: "1px solid #e7e7e3",
        borderRadius: 14,
        padding: 20,
      }}
    >
      {Object.entries(hidden ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            flex: "none",
            borderRadius: 9,
            background: "#eef1ff",
            display: "grid",
            placeItems: "center",
            color: ACCENT,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 10V2M8 2L5 5M8 2l3 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 10v2.5A1.5 1.5 0 003.5 14h9a1.5 1.5 0 001.5-1.5V10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>Importar vários de uma vez</div>
          <div style={{ fontSize: 11, color: "#8a8d98", marginTop: 1, lineHeight: 1.45 }}>{desc}</div>
        </div>
        <button
          type="button"
          onClick={downloadTemplate}
          className="hv-light"
          style={{
            flex: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11.5,
            fontWeight: 600,
            color: "#4b4e58",
            background: "#fff",
            border: "1.5px solid #e2e2de",
            borderRadius: 8,
            padding: "7px 12px",
            cursor: "pointer",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 16 16">
            <path d="M8 2v8M8 10l-3-3M8 10l3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 11v1.5A1.5 1.5 0 003.5 14h9a1.5 1.5 0 001.5-1.5V11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Baixar template
        </button>
      </div>

      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) readFile(f);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "18px 14px",
          borderRadius: 10,
          border: `1.5px dashed ${dragOver ? ACCENT : fileName ? "#0e7a6f" : "#d0d0cb"}`,
          background: dragOver ? "#f7f8ff" : fileName ? "#f2faf7" : "#fafaf8",
          cursor: "pointer",
          transition: "border-color .12s, background .12s",
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) readFile(f);
          }}
          style={{ display: "none" }}
        />
        {fileName ? (
          <>
            <svg width="15" height="15" viewBox="0 0 16 16" style={{ color: "#0e7a6f", flex: "none" }}>
              <path d="M3 8.5l3.2 3.2L13 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#0e7a6f", fontFamily: "var(--font-jetbrains)" }}>{fileName}</span>
            <span style={{ fontSize: 11.5, color: "#8a8d98" }}>· clique para trocar</span>
          </>
        ) : (
          <>
            <svg width="15" height="15" viewBox="0 0 16 16" style={{ color: "#a0a3ad", flex: "none" }}>
              <path d="M9.5 1.5H4a1 1 0 00-1 1v11a1 1 0 001 1h8a1 1 0 001-1V5z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M9.5 1.5V5H13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 12.5, color: "#4b4e58" }}>
              <b style={{ color: ACCENT }}>Escolher arquivo .csv</b> ou arraste aqui
            </span>
          </>
        )}
      </div>

      <div>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>
          Ou cole as linhas
        </div>
        <textarea
          name="batchText"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setFileName(null);
          }}
          rows={6}
          placeholder={placeholder}
          className="fc"
          style={{
            width: "100%",
            font: "400 12px var(--font-jetbrains), monospace",
            padding: "10px 12px",
            borderRadius: 9,
            border: "1px solid #e2e2de",
            outline: "none",
            resize: "vertical",
            lineHeight: 1.6,
            background: "#fafaf8",
          }}
        />
      </div>

      {error ? <div style={{ fontSize: 12, color: "#b3402e" }}>{error}</div> : null}

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: 99,
            background: n ? "#e8f5f0" : "#f4f4f2",
            color: n ? "#0e7a6f" : "#8a8d98",
          }}
        >
          {n} {noun} reconhecido(s)
        </div>
        <button
          type="submit"
          disabled={pending || n === 0}
          className={n ? "hv-btn" : undefined}
          style={{
            marginLeft: "auto",
            fontSize: 12,
            fontWeight: 600,
            color: "#fff",
            background: ACCENT,
            padding: "9px 16px",
            borderRadius: 8,
            border: "none",
            cursor: n && !pending ? "pointer" : "not-allowed",
            opacity: n && !pending ? 1 : 0.45,
          }}
        >
          {pending ? "Importando…" : confirmLabel(n)}
        </button>
      </div>
    </form>
  );
}
