"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ACCENT } from "@/lib/design";
import { formatCnpjCpf } from "@/lib/nfe/parseNfe";
import { ConfirmForm } from "@/components/app/ConfirmForm";
import { addEmpresa, deleteEmpresa, type EmpresaState } from "@/app/(app)/analise/actions";

export type EmpresaRow = { id: string; nome: string; cnpj: string | null; notas: number };

const INP: React.CSSProperties = { width: "100%", fontSize: 13, padding: "9px 11px", borderRadius: 8, border: "1px solid #e2e2de", outline: "none" };
const LBL: React.CSSProperties = { fontSize: 10.5, fontWeight: 600, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 };
const th: React.CSSProperties = {
  padding: "10px 18px", background: "#fafaf8", borderBottom: "1px solid #ececea",
  fontSize: 10.5, fontWeight: 700, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".05em",
};
const GRID = "2fr 200px 150px 24px";
const GRID_DEL = `${GRID} 34px`;

export function EmpresasPanel({ canCreate, canDelete, empresas }: { canCreate: boolean; canDelete: boolean; empresas: EmpresaRow[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<EmpresaState, FormData>(addEmpresa, {});
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);
  const grid = canDelete ? GRID_DEL : GRID;

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
      router.refresh();
    }
    wasPending.current = pending;
  }, [pending, state, router]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {canCreate ? (
        <form
          ref={formRef}
          action={formAction}
          style={{ display: "flex", alignItems: "flex-end", gap: 10, background: "#fff", border: "1px solid #e7e7e3", borderRadius: 14, padding: 16, flexWrap: "wrap" }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={LBL}>Nome da empresa</div>
            <input className="fc" name="nome" placeholder="Razão social" style={INP} />
          </div>
          <div style={{ width: 220 }}>
            <div style={LBL}>CNPJ (opcional)</div>
            <input className="fc" name="cnpj" placeholder="00.000.000/0000-00" style={INP} />
          </div>
          {state.error ? <div style={{ fontSize: 12, color: "#b3402e", flex: "0 0 100%" }}>{state.error}</div> : null}
          <button
            type="submit"
            disabled={pending}
            className="hv-btn"
            style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: ACCENT, padding: "9px 16px", borderRadius: 8, border: "none", cursor: "pointer", opacity: pending ? 0.7 : 1 }}
          >
            {pending ? "Adicionando…" : "+ Adicionar empresa"}
          </button>
        </form>
      ) : null}

      <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, overflow: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: grid, gap: 10, whiteSpace: "nowrap", ...th }}>
          <div>Empresa</div><div>CNPJ</div><div>Notas importadas</div><div />{canDelete ? <div /> : null}
        </div>
        {empresas.map((e) => (
          <div
            key={e.id}
            onClick={() => router.push(`/analise/empresas/${e.id}`)}
            className="hv-row"
            style={{ display: "grid", gridTemplateColumns: grid, gap: 10, alignItems: "center", padding: "11px 18px", borderBottom: "1px solid #f0f0ed", cursor: "pointer" }}
          >
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{e.nome}</div>
            <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, color: ACCENT, fontWeight: 600 }}>{e.cnpj ? formatCnpjCpf(e.cnpj) : "—"}</div>
            <div style={{ fontSize: 12, color: "#4b4e58" }}>{e.notas.toLocaleString("pt-BR")}</div>
            <div style={{ color: "#c2c3c9", textAlign: "right" }}>
              <svg width="14" height="14" viewBox="0 0 15 15"><path d="M5.5 3l5 4.5-5 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            {canDelete ? (
              <div onClick={(ev) => ev.stopPropagation()}>
                <ConfirmForm
                  action={deleteEmpresa}
                  message={`Excluir a empresa "${e.nome}"? Isso apaga as ${e.notas} nota(s) importada(s) dela. Não pode ser desfeito.`}
                >
                  <input type="hidden" name="id" value={e.id} />
                  <button type="submit" title="Excluir empresa" className="hv-danger" style={{ color: "#c2c3c9", cursor: "pointer", padding: 4, background: "none", border: "none" }}>
                    <svg width="14" height="14" viewBox="0 0 15 15">
                      <path d="M2 3.5h11M6 3.5V2h3v1.5M3.5 3.5l.7 9.5h6.6l.7-9.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </ConfirmForm>
              </div>
            ) : null}
          </div>
        ))}
        {empresas.length === 0 ? (
          <div style={{ padding: 18, fontSize: 12.5, color: "#a0a3ad", fontStyle: "italic" }}>Nenhuma empresa cadastrada ainda — use o formulário acima.</div>
        ) : null}
      </div>
    </div>
  );
}
