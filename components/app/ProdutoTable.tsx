"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ACCENT } from "@/lib/design";
import { CclassInfo } from "@/components/app/CclassInfo";
import { TableSearch } from "@/components/app/TableSearch";

const th: React.CSSProperties = {
  padding: "10px 18px", background: "#fafaf8", borderBottom: "1px solid #ececea",
  fontSize: 10.5, fontWeight: 700, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".05em",
};

export type ProdRow = { ncm: string; descr: string; cst: string; cclass: string; aliq_ibs: string; aliq_cbs: string; red_ibs: string; red_cbs: string };

const GRID = "110px 1.6fr 70px 90px 90px 90px 100px 100px";

export function ProdutoTable({
  rows, cclassDescr, total, page, pageSize, q,
}: {
  rows: ProdRow[]; cclassDescr: Record<string, string>;
  total: number; page: number; pageSize: number; q: string;
}) {
  const router = useRouter();
  const [term, setTerm] = useState(q);
  useEffect(() => setTerm(q), [q]);

  // Busca com debounce → navega alterando os query params (server-side).
  useEffect(() => {
    if (term === q) return;
    const t = setTimeout(() => {
      const params = new URLSearchParams({ tab: "produtos" });
      if (term.trim()) params.set("q", term.trim());
      router.replace(`/ibs?${params.toString()}`);
    }, 350);
    return () => clearTimeout(t);
  }, [term, q, router]);

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const go = (p: number) => {
    const params = new URLSearchParams({ tab: "produtos", page: String(p) });
    if (q) params.set("q", q);
    router.replace(`/ibs?${params.toString()}`);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 12 }}>
        <div style={{ fontSize: 11.5, color: "#8a8d98" }}>
          {total.toLocaleString("pt-BR")} produto(s){q ? ` para “${q}”` : ""}
        </div>
        <TableSearch value={term} onChange={setTerm} placeholder="Pesquisar NCM, descrição, CST ou cClassTrib…" />
      </div>
      <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, overflow: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: GRID, gap: 10, whiteSpace: "nowrap", ...th }}>
          <div>NCM</div><div>Descrição</div><div>CST</div><div>cClassTrib</div><div>Alíq. IBS</div><div>Alíq. CBS</div><div>Red. IBS</div><div>Red. CBS</div>
        </div>
        {rows.map((r, i) => (
          <div key={`${r.ncm}-${i}`} className="hv-row" style={{ display: "grid", gridTemplateColumns: GRID, gap: 10, alignItems: "center", padding: "11px 18px", borderBottom: "1px solid #f0f0ed" }}>
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
        {total === 0 ? (
          <div style={{ padding: 18, fontSize: 12.5, color: "#a0a3ad", fontStyle: "italic" }}>
            {q ? `Nenhum produto encontrado para “${q}”.` : "Nenhum produto cadastrado — use “+ Adicionar dado”."}
          </div>
        ) : null}
      </div>

      {pages > 1 ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
          <div style={{ fontSize: 11.5, color: "#8a8d98" }}>
            {from.toLocaleString("pt-BR")}–{to.toLocaleString("pt-BR")} de {total.toLocaleString("pt-BR")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <PageBtn label="Anterior" disabled={page <= 1} onClick={() => go(page - 1)} />
            <div style={{ fontSize: 12, color: "#4b4e58", padding: "0 6px" }}>Página {page} de {pages}</div>
            <PageBtn label="Próxima" disabled={page >= pages} onClick={() => go(page + 1)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PageBtn({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={disabled ? undefined : "hv-light"}
      style={{
        fontSize: 12, fontWeight: 600, color: disabled ? "#c0c2cb" : "#4b4e58",
        background: "#fff", border: "1px solid #e2e2de", borderRadius: 8, padding: "7px 12px",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {label}
    </button>
  );
}
