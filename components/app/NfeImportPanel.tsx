"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ACCENT } from "@/lib/design";
import { Spinner } from "@/components/app/Spinner";
import { parseNfeXml, checkTipoModConsistency, formatCnpjCpf, type ParsedNfe } from "@/lib/nfe/parseNfe";
import { importNfeChunk, finishNfeImport, type NfeTipo, type NfeRejected } from "@/app/(app)/analise/actions";

export type EmpresaOption = { id: string; nome: string; cnpj: string | null };

type FileEntry = {
  name: string;
  xml: string;
  parsed?: ParsedNfe;
  error?: string;
};

const CHUNK_SIZE = 15;

function readFileAsText(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    r.readAsText(f);
  });
}

/** Extrai todos os .xml de um .zip (ignora pastas e outros tipos de arquivo dentro dele). */
async function readZipXmls(f: File): Promise<{ name: string; xml: string }[]> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(f);
  const entries = Object.values(zip.files).filter((e) => !e.dir && e.name.toLowerCase().endsWith(".xml"));
  return Promise.all(
    entries.map(async (e) => ({ name: e.name.split("/").pop() || e.name, xml: await e.async("string") })),
  );
}

const BRL = (v: number | null) => (v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
const LBL: React.CSSProperties = { fontSize: 10.5, fontWeight: 600, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 };

export function NfeImportPanel({ canImport, empresas }: { canImport: boolean; empresas: EmpresaOption[] }) {
  const router = useRouter();
  const [tipo, setTipo] = useState<NfeTipo>("compra");
  const [empresaId, setEmpresaId] = useState(empresas[0]?.id ?? "");
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [running, setRunning] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<{ inserted: number; rejected: NfeRejected[]; error?: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const buildEntry = (name: string, xml: string): FileEntry => {
    const res = parseNfeXml(xml);
    if (!res.ok) return { name, xml, error: res.error };
    const mismatch = checkTipoModConsistency(tipo, res.data.mod);
    if (mismatch) return { name, xml, error: mismatch };
    return { name, xml, parsed: res.data };
  };

  const addFiles = async (files: FileList | File[]) => {
    const all = Array.from(files);
    const xmlFiles = all.filter((f) => f.name.toLowerCase().endsWith(".xml"));
    const zipFiles = all.filter((f) => f.name.toLowerCase().endsWith(".zip"));

    const fromXml = await Promise.all(
      xmlFiles.map(async (f) => {
        try {
          const xml = await readFileAsText(f);
          return buildEntry(f.name, xml);
        } catch {
          return { name: f.name, xml: "", error: "Falha ao ler o arquivo." };
        }
      }),
    );

    let fromZip: FileEntry[] = [];
    if (zipFiles.length) {
      setExtracting(true);
      try {
        const perZip = await Promise.all(
          zipFiles.map(async (f) => {
            try {
              const xmls = await readZipXmls(f);
              return xmls.map(({ name, xml }) => buildEntry(name, xml));
            } catch {
              return [{ name: f.name, xml: "", error: "Falha ao abrir o arquivo .zip." } as FileEntry];
            }
          }),
        );
        fromZip = perZip.flat();
      } finally {
        setExtracting(false);
      }
    }

    setEntries((prev) => [...prev, ...fromXml, ...fromZip]);
    setReport(null);
  };

  // Trocar o tipo revalida a consistência mod↔tipo de todos os arquivos já lidos.
  const changeTipo = (next: NfeTipo) => {
    setTipo(next);
    setEntries((prev) =>
      prev.map((e) => {
        if (!e.xml) return e;
        const res = parseNfeXml(e.xml);
        if (!res.ok) return { ...e, parsed: undefined, error: res.error };
        const mismatch = checkTipoModConsistency(next, res.data.mod);
        return mismatch ? { ...e, parsed: undefined, error: mismatch } : { ...e, parsed: res.data, error: undefined };
      }),
    );
    setReport(null);
  };

  const removeEntry = (name: string) => setEntries((prev) => prev.filter((e) => e.name !== name));
  const clearAll = () => {
    setEntries([]);
    setReport(null);
  };

  const valid = entries.filter((e) => e.parsed);
  const invalid = entries.filter((e) => e.error);

  const runImport = async () => {
    if (!valid.length || !empresaId) return;
    setRunning(true);
    setReport(null);
    setProgress(0);
    let inserted = 0;
    const rejected: NfeRejected[] = invalid.map((e) => ({ file: e.name, reason: e.error || "Arquivo inválido." }));
    let failed = false;
    try {
      for (let i = 0; i < valid.length; i += CHUNK_SIZE) {
        const chunk = valid.slice(i, i + CHUNK_SIZE).map((e) => ({ name: e.name, xml: e.xml }));
        const res = await importNfeChunk(tipo, empresaId, chunk);
        if (res.error) {
          setReport({ inserted, rejected: [...rejected, ...res.rejected], error: `Lote ${Math.floor(i / CHUNK_SIZE) + 1}: ${res.error}` });
          failed = true;
          break;
        }
        inserted += res.inserted;
        rejected.push(...res.rejected);
        setProgress(Math.min(1, (i + chunk.length) / Math.max(1, valid.length)));
      }
    } catch (e) {
      setReport({ inserted, rejected, error: e instanceof Error ? e.message : "Falha na importação." });
      failed = true;
    }
    setRunning(false);
    if (failed) return;
    setReport({ inserted, rejected });
    await finishNfeImport();
    router.refresh();
  };

  const busy = running;
  const n = valid.length;
  const hasEmpresas = empresas.length > 0;
  const canUse = canImport && hasEmpresas;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, background: "#fff", border: "1px solid #e7e7e3", borderRadius: 14, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, flex: "none", borderRadius: 9, background: "#eef1ff", display: "grid", placeItems: "center", color: ACCENT }}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 10V2M8 2L5 5M8 2l3 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 10v2.5A1.5 1.5 0 003.5 14h9a1.5 1.5 0 001.5-1.5V10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>Importar XML de NF-e/NFC-e</div>
          <div style={{ fontSize: 11, color: "#8a8d98", marginTop: 1, lineHeight: 1.45 }}>
            Selecione se os XMLs são notas de compra (recebidas) ou de venda (emitidas/NFC-e) e arraste os arquivos.
          </div>
        </div>
      </div>

      {!hasEmpresas ? (
        <div style={{ fontSize: 12.5, color: "#9a5b1f", background: "#fdf6ef", border: "1px solid #f0ddc0", borderRadius: 9, padding: "10px 12px" }}>
          Cadastre uma empresa antes de importar — vá na aba{" "}
          <Link href="/analise?tab=empresas" style={{ color: ACCENT, fontWeight: 600 }}>Empresas</Link>.
        </div>
      ) : (
        <div>
          <div style={LBL}>Empresa</div>
          <select
            className="fc"
            value={empresaId}
            onChange={(e) => setEmpresaId(e.target.value)}
            disabled={!canImport}
            style={{ width: "100%", maxWidth: 360, fontSize: 13, padding: "9px 11px", borderRadius: 8, border: "1px solid #e2e2de", outline: "none", background: "#fff" }}
          >
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>{e.nome}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        {(["compra", "venda"] as const).map((t) => (
          <button
            key={t}
            type="button"
            disabled={!canUse}
            onClick={() => changeTipo(t)}
            className={tipo === t ? undefined : "hv-light"}
            style={{
              fontSize: 12.5, fontWeight: 700, padding: "8px 16px", borderRadius: 8,
              color: tipo === t ? "#fff" : "#4b4e58", background: tipo === t ? ACCENT : "#fff",
              border: `1px solid ${tipo === t ? ACCENT : "#e2e2de"}`, cursor: canUse ? "pointer" : "not-allowed",
            }}
          >
            {t === "compra" ? "Compra (recebida)" : "Venda (emitida / NFC-e)"}
          </button>
        ))}
      </div>

      <div
        onClick={() => canUse && fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (canUse) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!canUse) return;
          if (e.dataTransfer.files?.length) void addFiles(e.dataTransfer.files);
        }}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "18px 14px", borderRadius: 10,
          border: `1.5px dashed ${dragOver ? ACCENT : "#d0d0cb"}`, background: dragOver ? "#f7f8ff" : "#fafaf8",
          cursor: canUse ? "pointer" : "not-allowed", opacity: canUse ? 1 : 0.6, transition: "border-color .12s, background .12s",
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".xml,text/xml,.zip,application/zip"
          multiple
          disabled={!canUse}
          onChange={(e) => { if (e.target.files?.length) void addFiles(e.target.files); e.target.value = ""; }}
          style={{ display: "none" }}
        />
        <svg width="15" height="15" viewBox="0 0 16 16" style={{ color: "#a0a3ad", flex: "none" }}>
          <path d="M9.5 1.5H4a1 1 0 00-1 1v11a1 1 0 001 1h8a1 1 0 001-1V5z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M9.5 1.5V5H13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: 12.5, color: "#4b4e58" }}>
          <b style={{ color: ACCENT }}>Escolher arquivos .xml ou .zip</b> ou arraste aqui — pode selecionar vários de uma vez, inclusive .zip com vários XMLs dentro
        </span>
      </div>

      {extracting ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "#8a8d98" }}>
          <Spinner size={11} /> Extraindo XMLs do .zip…
        </div>
      ) : null}

      {entries.length ? (
        <div style={{ border: "1px solid #ececea", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ maxHeight: 260, overflow: "auto" }}>
            {entries.map((e) => (
              <div
                key={e.name}
                style={{
                  display: "grid", gridTemplateColumns: "1fr 1.4fr 90px 120px 24px", gap: 8, alignItems: "center",
                  padding: "8px 12px", borderBottom: "1px solid #f0f0ed", fontSize: 11.5,
                }}
              >
                <div style={{ fontFamily: "var(--font-jetbrains)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#4b4e58" }}>{e.name}</div>
                {e.parsed ? (
                  <>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {tipo === "compra" ? e.parsed.emitNome : e.parsed.destNome || "Consumidor final"}
                      {" · "}
                      <span style={{ color: "#8a8d98" }}>
                        {formatCnpjCpf(tipo === "compra" ? e.parsed.emitDocumento : e.parsed.destDocumento)}
                      </span>
                    </div>
                    <div style={{ color: "#8a8d98" }}>{tipo === "compra" ? e.parsed.emitUf : e.parsed.destUf || "—"}</div>
                    <div style={{ fontWeight: 700, color: "#0e7a6f", fontFamily: "var(--font-jetbrains)" }}>{BRL(e.parsed.valorTotal)}</div>
                  </>
                ) : (
                  <div style={{ gridColumn: "2 / span 3", color: "#b3402e" }}>{e.error}</div>
                )}
                <button
                  type="button"
                  onClick={() => removeEntry(e.name)}
                  title="Remover"
                  className="hv-danger"
                  style={{ color: "#c2c3c9", cursor: "pointer", padding: 2, background: "none", border: "none" }}
                >
                  <svg width="12" height="12" viewBox="0 0 15 15">
                    <path d="M2 3.5h11M6 3.5V2h3v1.5M3.5 3.5l.7 9.5h6.6l.7-9.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#fafaf8" }}>
            <span style={{ fontSize: 11, color: "#8a8d98" }}>
              {valid.length} válido(s){invalid.length ? ` · ${invalid.length} com erro` : ""}
            </span>
            <button type="button" onClick={clearAll} className="hv-light" style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#8a8d98", background: "none", border: "none", cursor: "pointer" }}>
              Limpar tudo
            </button>
          </div>
        </div>
      ) : null}

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
            {report.inserted} nota(s) importada(s){report.rejected.length ? ` · ${report.rejected.length} ignorada(s)` : ""}
          </div>
          {report.error ? <div style={{ color: "#b3402e", marginTop: 4 }}>{report.error}</div> : null}
          {report.rejected.length ? (
            <details style={{ marginTop: 6 }}>
              <summary style={{ cursor: "pointer", color: "#8a8d98" }}>Ver arquivos ignorados</summary>
              <div style={{ maxHeight: 160, overflow: "auto", marginTop: 6, fontFamily: "var(--font-jetbrains)", fontSize: 11 }}>
                {report.rejected.map((r, i) => (
                  <div key={i} style={{ padding: "2px 0", color: "#6b6e78" }}>
                    <span style={{ color: "#b3402e" }}>{r.file}</span> — {r.reason}
                  </div>
                ))}
              </div>
            </details>
          ) : null}
        </div>
      ) : null}

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, padding: "4px 10px", borderRadius: 99, background: n ? "#e8f5f0" : "#f4f4f2", color: n ? "#0e7a6f" : "#8a8d98" }}>
          {n} nota(s) pronta(s) para importar
        </div>
        <button
          type="button"
          onClick={runImport}
          disabled={busy || n === 0 || !canUse}
          className={n ? "hv-btn" : undefined}
          style={{
            marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "#fff", background: ACCENT, padding: "9px 16px",
            borderRadius: 8, border: "none", cursor: n && !busy && canUse ? "pointer" : "not-allowed", opacity: n && !busy && canUse ? 1 : 0.45,
          }}
        >
          {busy ? "Importando…" : `Importar ${n} nota(s)`}
        </button>
      </div>
    </div>
  );
}
