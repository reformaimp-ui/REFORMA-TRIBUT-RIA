"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ACCENT } from "@/lib/design";
import { CclassInfo } from "@/components/app/CclassInfo";
import { TableSearch } from "@/components/app/TableSearch";
import { ConfirmForm } from "@/components/app/ConfirmForm";
import { removeServico } from "@/app/(app)/ibs/actions";

const th: React.CSSProperties = {
  padding: "10px 18px", background: "#fafaf8", borderBottom: "1px solid #ececea",
  fontSize: 10.5, fontWeight: 700, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".05em",
};

export type ServicoRow = {
  item: string; nbs: string; nbs_descr: string; indop: string; local_ibs: string; cclass: string; cclass_nome: string;
};

const GRID = "1fr 90px 1.4fr 70px 1fr 80px 1.2fr 70px 70px 70px";
const GRID_DEL = `${GRID} 34px`;

export function ServicoTable({
  rows, cstRedByCclass, total, page, pageSize, q, canDelete,
}: {
  rows: ServicoRow[]; cstRedByCclass: Record<string, { cst: string; red_ibs: string; red_cbs: string }>;
  total: number; page: number; pageSize: number; q: string; canDelete?: boolean;
}) {
  const grid = canDelete ? GRID_DEL : GRID;
  const router = useRouter();
  const [term, setTerm] = useState(q);
  useEffect(() => setTerm(q), [q]);

  useEffect(() => {
    if (term === q) return;
    const t = setTimeout(() => {
      const params = new URLSearchParams({ tab: "servicos" });
      if (term.trim()) params.set("q", term.trim());
      router.replace(`/ibs?${params.toString()}`);
    }, 350);
    return () => clearTimeout(t);
  }, [term, q, router]);

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const go = (p: number) => {
    const params = new URLSearchParams({ tab: "servicos", page: String(p) });
    if (q) params.set("q", q);
    router.replace(`/ibs?${params.toString()}`);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 12 }}>
        <div style={{ fontSize: 11.5, color: "#8a8d98" }}>
          {total.toLocaleString("pt-BR")} serviço(s){q ? ` para “${q}”` : ""}
        </div>
        <TableSearch value={term} onChange={setTerm} placeholder="Pesquisar NBS, descrição, INDOP ou cClassTrib…" />
      </div>
      <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, overflow: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: grid, gap: 10, whiteSpace: "nowrap", ...th }}>
          <div>Descrição item</div><div>NBS</div><div>Descrição NBS</div><div>INDOP</div><div>Local incidência IBS</div><div>cClassTrib</div><div>Nome cClassTrib</div><div>CST</div><div>Red. IBS</div><div>Red. CBS</div>{canDelete ? <div /> : null}
        </div>
        {rows.map((r, i) => {
          const ref = cstRedByCclass[r.cclass];
          return (
            <div key={`${r.nbs}-${r.cclass}-${i}`} className="hv-row" style={{ display: "grid", gridTemplateColumns: grid, gap: 10, alignItems: "center", padding: "11px 18px", borderBottom: "1px solid #f0f0ed" }}>
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>{r.item}</div>
              <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, color: ACCENT, fontWeight: 600 }}>{r.nbs}</div>
              <div style={{ fontSize: 12, color: "#33363f", overflow: "hidden", textOverflow: "ellipsis" }}>{r.nbs_descr}</div>
              <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 700, color: "#4b4e58" }}>{r.indop}</div>
              <div style={{ fontSize: 12, color: "#33363f" }}>{r.local_ibs}</div>
              <CclassInfo key={`${r.cclass}-${i}`} code={r.cclass} descr={r.cclass_nome}>
                <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 700, color: "#7c3aed" }}>{r.cclass}</div>
              </CclassInfo>
              <div style={{ fontSize: 12, color: "#33363f", overflow: "hidden", textOverflow: "ellipsis" }}>{r.cclass_nome}</div>
              <div title="Herdado da Tributação dos produtos, pelo mesmo cClassTrib" style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 700, color: ref ? ACCENT : "#c0c2cb" }}>{ref?.cst || "—"}</div>
              <div title="Herdado da Tributação dos produtos, pelo mesmo cClassTrib" style={{ fontSize: 12, color: ref ? "#0e7a6f" : "#c0c2cb", fontWeight: 600 }}>{ref?.red_ibs || "—"}</div>
              <div title="Herdado da Tributação dos produtos, pelo mesmo cClassTrib" style={{ fontSize: 12, color: ref ? "#0e7a6f" : "#c0c2cb", fontWeight: 600 }}>{ref?.red_cbs || "—"}</div>
              {canDelete ? (
                <ConfirmForm action={removeServico} message={`Remover a tributação do serviço NBS ${r.nbs} (cClassTrib ${r.cclass})?`}>
                  <input type="hidden" name="nbs" value={r.nbs} />
                  <input type="hidden" name="cclass" value={r.cclass} />
                  <button type="submit" title="Remover" className="hv-danger" style={{ color: "#c2c3c9", cursor: "pointer", padding: 4, background: "none", border: "none" }}>
                    <svg width="14" height="14" viewBox="0 0 15 15">
                      <path d="M2 3.5h11M6 3.5V2h3v1.5M3.5 3.5l.7 9.5h6.6l.7-9.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </ConfirmForm>
              ) : null}
            </div>
          );
        })}
        {total === 0 ? (
          <div style={{ padding: 18, fontSize: 12.5, color: "#a0a3ad", fontStyle: "italic" }}>
            {q ? `Nenhum serviço encontrado para “${q}”.` : "Nenhum serviço cadastrado — use “+ Adicionar dado”."}
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
