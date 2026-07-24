"use client";

import { useEffect, useState } from "react";
import { ACCENT } from "@/lib/design";
import { TableSearch } from "@/components/app/TableSearch";
import { NcmTreeView } from "@/components/app/NcmTreeView";
import { Spinner } from "@/components/app/Spinner";
import { searchNcm, type NcmNode } from "@/app/(app)/ibs/actions";

export function NcmExplorer() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<NcmNode[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      searchNcm(term).then((r) => {
        setResults(r);
        setSearching(false);
      });
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20, alignItems: "start" }}>
      <div>
        <TableSearch value={q} onChange={setQ} placeholder="Código ou descrição do NCM…" />
        <div style={{ marginTop: 10, background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, maxHeight: 480, overflow: "auto" }}>
          {searching ? (
            <div style={{ padding: 14, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#8a8d98" }}>
              <Spinner size={12} />
              Buscando…
            </div>
          ) : null}
          {!searching && q.trim() && !results.length ? (
            <div style={{ padding: 14, fontSize: 12, color: "#a0a3ad", fontStyle: "italic" }}>Nenhum NCM encontrado.</div>
          ) : null}
          {!searching && !q.trim() ? (
            <div style={{ padding: 14, fontSize: 12, color: "#a0a3ad", fontStyle: "italic" }}>Digite um código ou parte da descrição para buscar.</div>
          ) : null}
          {results.map((r) => (
            <div
              key={r.digits}
              onClick={() => setSelected(r.code)}
              className="hv-row"
              style={{
                padding: "9px 14px",
                cursor: "pointer",
                borderBottom: "1px solid #f0f0ed",
                background: selected === r.code ? "#f7f8ff" : undefined,
              }}
            >
              <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 700, color: ACCENT }}>{r.code}</div>
              <div style={{ fontSize: 12, color: "#4b4e58" }}>{r.descr}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, padding: 18, minHeight: 200 }}>
        {selected ? (
          <NcmTreeView code={selected} />
        ) : (
          <div style={{ fontSize: 12.5, color: "#a0a3ad", fontStyle: "italic" }}>Pesquise e selecione um NCM para ver sua árvore de classificação.</div>
        )}
      </div>
    </div>
  );
}
