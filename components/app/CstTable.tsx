"use client";

import { useMemo, useState } from "react";
import { ACCENT } from "@/lib/design";
import { TableSearch } from "@/components/app/TableSearch";
import { CstLinksInfo } from "@/components/app/CstLinksInfo";

const th: React.CSSProperties = {
  padding: "10px 18px", background: "#fafaf8", borderBottom: "1px solid #ececea",
  fontSize: 10.5, fontWeight: 700, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".05em",
};

export function CstTable({ rows, linksByCst }: { rows: { code: string; descr: string }[]; linksByCst: Record<string, { code: string; descr: string }[]> }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) => r.code.toLowerCase().includes(term) || r.descr.toLowerCase().includes(term));
  }, [rows, q]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <TableSearch value={q} onChange={setQ} placeholder="Pesquisar CST ou descrição…" />
      </div>
      <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, ...th }}>
          <div>CST</div><div>Descrição</div>
        </div>
        {filtered.map((r, i) => {
          const links = linksByCst[r.code] ?? [];
          return (
            <CstLinksInfo key={`${r.code}-${i}`} cst={r.code} links={links}>
              <div className="hv-row" style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, alignItems: "center", padding: "10px 18px", borderBottom: "1px solid #f0f0ed" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 700, color: ACCENT }}>{r.code}</div>
                  {links.length ? (
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", background: "#f4f1ff", borderRadius: 99, padding: "1px 7px" }}>{links.length}</div>
                  ) : null}
                </div>
                <div style={{ fontSize: 12.5, color: "#33363f" }}>{r.descr}</div>
              </div>
            </CstLinksInfo>
          );
        })}
        {rows.length === 0 ? (
          <div style={{ padding: 18, fontSize: 12.5, color: "#a0a3ad", fontStyle: "italic" }}>Nenhum CST cadastrado — use “+ Adicionar dado”.</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 18, fontSize: 12.5, color: "#a0a3ad", fontStyle: "italic" }}>Nenhum CST encontrado para “{q}”.</div>
        ) : null}
      </div>
    </div>
  );
}
