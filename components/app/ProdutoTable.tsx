"use client";

import { useMemo, useState } from "react";
import { ACCENT } from "@/lib/design";
import { CclassInfo } from "@/components/app/CclassInfo";
import { TableSearch } from "@/components/app/TableSearch";

const th: React.CSSProperties = {
  padding: "10px 18px", background: "#fafaf8", borderBottom: "1px solid #ececea",
  fontSize: 10.5, fontWeight: 700, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".05em",
};

export type ProdRow = { ncm: string; descr: string; cst: string; cclass: string; aliq_ibs: string; aliq_cbs: string; red_ibs: string; red_cbs: string };

export function ProdutoTable({ rows, cclassDescr }: { rows: ProdRow[]; cclassDescr: Record<string, string> }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.ncm.toLowerCase().includes(term) ||
        r.descr.toLowerCase().includes(term) ||
        r.cst.toLowerCase().includes(term) ||
        r.cclass.toLowerCase().includes(term),
    );
  }, [rows, q]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <TableSearch value={q} onChange={setQ} placeholder="Pesquisar NCM, descrição, CST ou cClassTrib…" />
      </div>
      <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, overflow: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "110px 1.6fr 70px 90px 90px 90px 100px 100px", gap: 10, whiteSpace: "nowrap", ...th }}>
          <div>NCM</div><div>Descrição</div><div>CST</div><div>cClassTrib</div><div>Alíq. IBS</div><div>Alíq. CBS</div><div>Red. IBS</div><div>Red. CBS</div>
        </div>
        {filtered.map((r, i) => (
          <div key={`${r.ncm}-${i}`} className="hv-row" style={{ display: "grid", gridTemplateColumns: "110px 1.6fr 70px 90px 90px 90px 100px 100px", gap: 10, alignItems: "center", padding: "11px 18px", borderBottom: "1px solid #f0f0ed" }}>
            <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "#4b4e58" }}>{r.ncm}</div>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>{r.descr}</div>
            <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 700, color: ACCENT }}>{r.cst}</div>
            <CclassInfo key={`${r.cclass}-${i}`} code={r.cclass} descr={cclassDescr[r.cclass] || ""}>
              <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 700, color: "#7c3aed", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.cclass}</div>
            </CclassInfo>
            <div style={{ fontSize: 12, color: "#33363f" }}>{r.aliq_ibs}</div>
            <div style={{ fontSize: 12, color: "#33363f" }}>{r.aliq_cbs}</div>
            <div style={{ fontSize: 12, color: "#0e7a6f", fontWeight: 600 }}>{r.red_ibs}</div>
            <div style={{ fontSize: 12, color: "#0e7a6f", fontWeight: 600 }}>{r.red_cbs}</div>
          </div>
        ))}
        {rows.length === 0 ? (
          <div style={{ padding: 18, fontSize: 12.5, color: "#a0a3ad", fontStyle: "italic" }}>Nenhum produto cadastrado — use “+ Adicionar dado”.</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 18, fontSize: 12.5, color: "#a0a3ad", fontStyle: "italic" }}>Nenhum produto encontrado para “{q}”.</div>
        ) : null}
      </div>
    </div>
  );
}
