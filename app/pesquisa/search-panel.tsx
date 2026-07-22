"use client";

import { useState } from "react";
import { ACCENT } from "@/lib/design";
import { friendlyTaxSummary } from "@/lib/taxSummary";
import { NcmTreeView } from "@/components/app/NcmTreeView";
import { searchProdutoPublic, type ProdutoResult } from "./actions";

export function SearchPanel() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<ProdutoResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ProdutoResult | null>(null);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim()) return;
    setLoading(true);
    setSelected(null);
    const r = await searchProdutoPublic(term);
    setResults(r);
    setLoading(false);
    if (r.length === 1) setSelected(r[0]);
  };

  return (
    <div>
      <form onSubmit={search} style={{ display: "flex", gap: 10 }}>
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder='Ex.: 1006.30.11 ou "arroz beneficiado"'
          autoFocus
          style={{ flex: 1, fontSize: 14.5, padding: "13px 16px", borderRadius: 12, border: "1.5px solid #e2e2de", outline: "none", background: "#fff" }}
        />
        <button
          type="submit"
          disabled={loading || !term.trim()}
          className="hv-btn"
          style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", background: ACCENT, padding: "0 24px", borderRadius: 12, border: "none", cursor: "pointer", opacity: loading || !term.trim() ? 0.6 : 1 }}
        >
          {loading ? "Buscando…" : "Pesquisar"}
        </button>
      </form>

      {results && !selected ? (
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          {results.length === 0 ? (
            <div style={{ fontSize: 13, color: "#a0a3ad", fontStyle: "italic", textAlign: "center", padding: 24 }}>
              Nenhum produto encontrado para “{term}”.
            </div>
          ) : (
            results.map((r) => (
              <div
                key={`${r.ncm}-${r.cst}-${r.cclass}`}
                onClick={() => setSelected(r)}
                className="hv-card"
                style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, padding: "14px 18px", cursor: "pointer" }}
              >
                <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, color: ACCENT, fontWeight: 700 }}>{r.ncm}</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 2 }}>{r.descr}</div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {selected ? (
        <div style={{ marginTop: 24 }}>
          {results && results.length > 1 ? (
            <button
              onClick={() => setSelected(null)}
              style={{ fontSize: 12, fontWeight: 600, color: ACCENT, background: "none", border: "none", cursor: "pointer", marginBottom: 14, padding: 0 }}
            >
              ← Voltar aos resultados
            </button>
          ) : null}
          <ResultCard result={selected} />
        </div>
      ) : null}
    </div>
  );
}

function ResultCard({ result }: { result: ProdutoResult }) {
  const headline = friendlyTaxSummary(result);
  const isento = headline.startsWith("Isento");
  return (
    <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 16, padding: 26 }}>
      <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 13, color: "#8a8d98", fontWeight: 700 }}>{result.ncm}</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, textWrap: "pretty" }}>{result.descr}</div>

      <div style={{ marginTop: 18, padding: "16px 20px", borderRadius: 12, background: isento ? "#e8f5f0" : "#f7f8ff", border: `1.5px solid ${isento ? "#c9ebdf" : "#d9deff"}` }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: isento ? "#0e7a6f" : ACCENT, textWrap: "pretty" }}>{headline}</div>
        {result.cstDescr ? <div style={{ fontSize: 12, color: "#6b6e78", marginTop: 4 }}>CST {result.cst} — {result.cstDescr}</div> : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginTop: 18 }}>
        <RateBox label="Alíquota de referência — IBS" value={result.aliq_ibs} />
        <RateBox label="Alíquota de referência — CBS" value={result.aliq_cbs} />
        <RateBox label="Redução — IBS" value={result.red_ibs} accent />
        <RateBox label="Redução — CBS" value={result.red_cbs} accent />
      </div>

      {result.cclassDescr ? (
        <div style={{ marginTop: 16, fontSize: 12.5, color: "#4b4e58", lineHeight: 1.5 }}>
          <b>Classificação tributária ({result.cclass}):</b> {result.cclassDescr}
        </div>
      ) : null}

      <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid #f0f0ed" }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>
          Onde esse produto está na tabela de NCM
        </div>
        <NcmTreeView code={result.ncm} />
      </div>
    </div>
  );
}

function RateBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fafaf8", border: "1px solid #ececea" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2, color: accent ? "#0e7a6f" : "#1c1e26" }}>{value || "—"}</div>
    </div>
  );
}
