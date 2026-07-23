"use client";

import { useMemo, useState } from "react";
import { CclassInfo } from "@/components/app/CclassInfo";
import { TableSearch } from "@/components/app/TableSearch";
import { ConfirmForm } from "@/components/app/ConfirmForm";
import { removeCclass } from "@/app/(app)/ibs/actions";

const th: React.CSSProperties = {
  padding: "10px 18px", background: "#fafaf8", borderBottom: "1px solid #ececea",
  fontSize: 10.5, fontWeight: 700, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".05em",
};

export function CclassTable({ rows, canDelete }: { rows: { code: string; descr: string }[]; canDelete?: boolean }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) => r.code.toLowerCase().includes(term) || r.descr.toLowerCase().includes(term));
  }, [rows, q]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <TableSearch value={q} onChange={setQ} placeholder="Pesquisar cClassTrib ou descrição…" />
      </div>
      <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, ...th }}>
          <div>cClassTrib</div><div>Descrição</div>
        </div>
        {filtered.map((r, i) => (
          <div key={`${r.code}-${i}`} style={{ display: "flex", alignItems: "stretch", borderBottom: "1px solid #f0f0ed" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <CclassInfo code={r.code} descr={r.descr}>
                <div className="hv-row" style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, alignItems: "center", padding: "10px 18px" }}>
                  <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 700, color: "#7c3aed" }}>{r.code}</div>
                  <div style={{ fontSize: 12.5, color: "#33363f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.descr}</div>
                </div>
              </CclassInfo>
            </div>
            {canDelete ? (
              <div style={{ display: "flex", alignItems: "center", padding: "0 16px" }}>
                <ConfirmForm action={removeCclass} message={`Remover o cClassTrib ${r.code}?`}>
                  <input type="hidden" name="code" value={r.code} />
                  <button type="submit" title="Remover" className="hv-danger" style={{ color: "#c2c3c9", cursor: "pointer", padding: 4, background: "none", border: "none" }}>
                    <svg width="14" height="14" viewBox="0 0 15 15">
                      <path d="M2 3.5h11M6 3.5V2h3v1.5M3.5 3.5l.7 9.5h6.6l.7-9.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </ConfirmForm>
              </div>
            ) : null}
          </div>
        ))}
        {rows.length === 0 ? (
          <div style={{ padding: 18, fontSize: 12.5, color: "#a0a3ad", fontStyle: "italic" }}>Nenhum cClassTrib cadastrado — use “+ Adicionar dado”.</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 18, fontSize: 12.5, color: "#a0a3ad", fontStyle: "italic" }}>Nenhum cClassTrib encontrado para “{q}”.</div>
        ) : null}
      </div>
    </div>
  );
}
