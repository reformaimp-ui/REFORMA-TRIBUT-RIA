"use client";

import { useRef, useState } from "react";
import { ACCENT } from "@/lib/design";

type CsvTemplate = { filename: string; content: string };
type XlsxTemplate = { filename: string; rows: string[][] };

export type ChunkResult = { inserted: number; error?: string };
export type Rejected = { row: string[]; reason: string };
export type Validation = { valid: string[][]; rejected: Rejected[] };

const HEADER_WORDS = /^(nome|cst|cclasstrib|ncm|c[oó]digo|code|descri[cç][aã]o)$/i;
const CHUNK_SIZE = 500;

/**
 * Painel de importação em lote: dropzone estilizada, botão de template,
 * textarea com contagem ao vivo e submit. Usado em Clientes (.csv) e IBS/CBS (.xlsx).
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
  format = "csv",
  chunkImport,
  validate,
  onFinish,
}: {
  action: (fd: FormData) => void;
  pending: boolean;
  error?: string;
  hidden?: Record<string, string>;
  desc: React.ReactNode;
  placeholder: string;
  noun: string;
  confirmLabel: (n: number) => string;
  template: CsvTemplate | XlsxTemplate;
  format?: "csv" | "xlsx";
  // Modo lote: quando fornecido, o envio é feito em chunks com progresso e relatório.
  chunkImport?: (cells: string[][], startPos: number) => Promise<ChunkResult>;
  validate?: (cells: string[][]) => Validation;
  onFinish?: () => Promise<void> | void;
}) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<string[][]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Estado do import em lote.
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [report, setReport] = useState<{ inserted: number; rejected: Rejected[]; error?: string } | null>(null);

  const csvRows = (t: string) =>
    t
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.split(",").map((c) => c.trim()))
      .filter((c) => c[0] && !HEADER_WORDS.test(c[0]));

  const tabRows = (t: string) =>
    t
      .split("\n")
      .map((l) => l.replace(/\r$/, ""))
      .filter((l) => l.trim())
      .map((l) => l.split("\t").map((c) => c.trim()))
      .filter((c) => c[0] && !HEADER_WORDS.test(c[0]));

  const n = format === "xlsx" ? rows.length : csvRows(text).length;

  const runChunkImport = async () => {
    if (!chunkImport) return;
    const all = format === "xlsx" ? (rows.length ? rows : tabRows(text)) : csvRows(text);
    const { valid, rejected } = validate ? validate(all) : { valid: all, rejected: [] as Rejected[] };
    setRunning(true);
    setReport(null);
    setProgress(0);
    let inserted = 0;
    try {
      for (let i = 0; i < valid.length; i += CHUNK_SIZE) {
        const chunk = valid.slice(i, i + CHUNK_SIZE);
        const res = await chunkImport(chunk, i);
        if (res.error) {
          setReport({ inserted, rejected, error: `Lote ${i / CHUNK_SIZE + 1}: ${res.error}` });
          setRunning(false);
          return;
        }
        inserted += res.inserted;
        setProgress(Math.min(1, (i + chunk.length) / Math.max(1, valid.length)));
      }
      setReport({ inserted, rejected });
      setRunning(false);
      if (onFinish) await onFinish();
    } catch (e) {
      setReport({ inserted, rejected, error: e instanceof Error ? e.message : "Falha na importação." });
      setRunning(false);
    }
  };

  const readFile = (f: File) => {
    setFileName(f.name);
    if (format === "xlsx") {
      const r = new FileReader();
      r.onload = async () => {
        const buf = r.result as ArrayBuffer;
        const XLSX = await import("xlsx");
        const wb = XLSX.read(buf, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false });
        const parsed = aoa
          .map((r) => (Array.isArray(r) ? r : []).map((c) => String(c ?? "").trim()))
          .filter((c) => c[0] && !HEADER_WORDS.test(c[0]));
        setRows(parsed);
        setText(parsed.map((c) => c.join("\t")).join("\n"));
      };
      r.readAsArrayBuffer(f);
    } else {
      const r = new FileReader();
      r.onload = () => setText(String(r.result || ""));
      r.readAsText(f);
    }
  };

  const downloadTemplate = async () => {
    if (format === "xlsx" && "rows" in template) {
      const XLSX = await import("xlsx");
      const sheet = XLSX.utils.aoa_to_sheet(template.rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, sheet, "Modelo");
      const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = template.filename;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    if ("content" in template) {
      const blob = new Blob(["﻿" + template.content], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = template.filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const chunkMode = !!chunkImport;
  const busy = pending || running;

  return (
    <form
      action={chunkMode ? undefined : action}
      onSubmit={chunkMode ? (e) => { e.preventDefault(); void runChunkImport(); } : undefined}
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
      {format === "xlsx" ? (
        <input type="hidden" name="rowsJson" value={JSON.stringify(rows.length ? rows : tabRows(text))} />
      ) : (
        <input type="hidden" name="batchText" value={text} />
      )}

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
          accept={format === "xlsx" ? ".xlsx" : ".csv,text/csv"}
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
              <b style={{ color: ACCENT }}>Escolher arquivo {format === "xlsx" ? ".xlsx" : ".csv"}</b> ou arraste aqui
            </span>
          </>
        )}
      </div>

      <div>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>
          {format === "xlsx" ? "Ou cole as linhas (colunas separadas por tabulação, como ao colar do Excel)" : "Ou cole as linhas"}
        </div>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setRows([]);
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

      {running ? (
        <div>
          <div style={{ height: 6, borderRadius: 99, background: "#eef0f4", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.round(progress * 100)}%`, background: ACCENT, transition: "width .15s" }} />
          </div>
          <div style={{ fontSize: 11, color: "#8a8d98", marginTop: 6 }}>Importando… {Math.round(progress * 100)}%</div>
        </div>
      ) : null}

      {report ? (
        <div style={{ fontSize: 12, borderRadius: 9, padding: "10px 12px", background: report.error ? "#fdf2f0" : "#f2faf7", border: `1px solid ${report.error ? "#f0c8bf" : "#c9ebdf"}` }}>
          <div style={{ fontWeight: 700, color: report.error ? "#b3402e" : "#0e7a6f" }}>
            {report.error ? "Importação interrompida" : "Importação concluída"}
          </div>
          <div style={{ color: "#4b4e58", marginTop: 3 }}>
            {report.inserted} {noun} importado(s){report.rejected.length ? ` · ${report.rejected.length} ignorado(s)` : ""}
          </div>
          {report.error ? <div style={{ color: "#b3402e", marginTop: 4 }}>{report.error}</div> : null}
          {report.rejected.length ? (
            <details style={{ marginTop: 6 }}>
              <summary style={{ cursor: "pointer", color: "#8a8d98" }}>Ver linhas ignoradas</summary>
              <div style={{ maxHeight: 160, overflow: "auto", marginTop: 6, fontFamily: "var(--font-jetbrains)", fontSize: 11 }}>
                {report.rejected.slice(0, 200).map((r, i) => (
                  <div key={i} style={{ padding: "2px 0", color: "#6b6e78" }}>
                    <span style={{ color: "#b3402e" }}>{r.reason}</span> — {r.row.slice(0, 4).join(" · ")}
                  </div>
                ))}
                {report.rejected.length > 200 ? <div style={{ color: "#a0a3ad", paddingTop: 4 }}>…e mais {report.rejected.length - 200}</div> : null}
              </div>
            </details>
          ) : null}
        </div>
      ) : null}

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
          disabled={busy || n === 0}
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
            cursor: n && !busy ? "pointer" : "not-allowed",
            opacity: n && !busy ? 1 : 0.45,
          }}
        >
          {busy ? "Importando…" : confirmLabel(n)}
        </button>
      </div>
    </form>
  );
}
