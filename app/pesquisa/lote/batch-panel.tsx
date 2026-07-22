"use client";

import { useState } from "react";
import { ACCENT } from "@/lib/design";
import { friendlyTaxSummary } from "@/lib/taxSummary";
import { searchProdutosByNcmBatch, type ProdutoResult } from "../actions";

type Row = { ncm: string; results: ProdutoResult[] };

export function BatchPanel() {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);

  const ncms = text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const search = async () => {
    if (!ncms.length) return;
    setLoading(true);
    const r = await searchProdutosByNcmBatch(ncms);
    setRows(r);
    setLoading(false);
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={"Um NCM por linha, ex.:\n1006.30.11\n3004.90.99\n0102.21.10"}
        style={{
          width: "100%", fontSize: 13, fontFamily: "var(--font-jetbrains)", padding: "12px 14px",
          borderRadius: 12, border: "1.5px solid #e2e2de", outline: "none", resize: "vertical",
          lineHeight: 1.7, background: "#fff",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
        <div style={{ fontSize: 11.5, color: "#8a8d98" }}>{ncms.length} NCM(s) reconhecido(s)</div>
        <button
          onClick={search}
          disabled={loading || !ncms.length}
          className="hv-btn"
          style={{ marginLeft: "auto", fontSize: 12.5, fontWeight: 700, color: "#fff", background: ACCENT, padding: "9px 18px", borderRadius: 9, border: "none", cursor: "pointer", opacity: loading || !ncms.length ? 0.6 : 1 }}
        >
          {loading ? "Buscando…" : "Pesquisar em lote"}
        </button>
      </div>

      {rows ? (
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((row, i) => (
            <div key={`${row.ncm}-${i}`} style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12.5, fontWeight: 700, color: ACCENT }}>{row.ncm}</div>
                {row.results.length === 0 ? <div style={{ fontSize: 12, color: "#a0a3ad", fontStyle: "italic" }}>Não encontrado</div> : null}
              </div>
              {row.results.map((r) => (
                <div key={`${r.ncm}-${r.cst}-${r.cclass}`} style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #f0f0ed" }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.descr}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, marginTop: 4, textWrap: "pretty" }}>{friendlyTaxSummary(r)}</div>
                  <div style={{ fontSize: 11.5, color: "#6b6e78", marginTop: 2 }}>
                    Alíq. IBS {r.aliq_ibs || "—"} · Alíq. CBS {r.aliq_cbs || "—"} · Red. IBS {r.red_ibs || "—"} · Red. CBS {r.red_cbs || "—"}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
