import { ACCENT } from "@/lib/design";
import { formatCnpjCpf } from "@/lib/nfe/parseNfe";
import { CONSUMIDOR_FINAL_DOC, type PartyAgg } from "@/lib/nfe/aggregate";
import { ConfirmForm } from "@/components/app/ConfirmForm";
import { deleteParty } from "@/app/(app)/analise/actions";

const th: React.CSSProperties = {
  padding: "10px 18px", background: "#fafaf8", borderBottom: "1px solid #ececea",
  fontSize: 10.5, fontWeight: 700, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".05em",
};

const GRID = "2fr 170px 60px 110px 150px 100px";
const GRID_DEL = `${GRID} 34px`;

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function PartiesTable({
  rows, emptyLabel, tipo, empresaId, canDelete,
}: {
  rows: PartyAgg[];
  emptyLabel: string;
  /** compra = fornecedor, venda = cliente — decide qual documento filtrar ao excluir. */
  tipo: "compra" | "venda";
  /** Quando presente, a exclusão apaga só as notas dessa empresa; vazio = apaga em todas. */
  empresaId?: string;
  canDelete?: boolean;
}) {
  const grid = canDelete ? GRID_DEL : GRID;
  return (
    <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, overflow: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: grid, gap: 10, whiteSpace: "nowrap", ...th }}>
        <div>Nome</div><div>CNPJ/CPF</div><div>UF</div><div>Notas</div><div>Valor total</div><div>IBS/CBS</div>{canDelete ? <div /> : null}
      </div>
      {rows.map((r) => (
        <div
          key={r.doc}
          className="hv-row"
          style={{ display: "grid", gridTemplateColumns: grid, gap: 10, alignItems: "center", padding: "11px 18px", borderBottom: "1px solid #f0f0ed" }}
        >
          <div style={{ fontSize: 12.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.nome || "—"}</div>
          <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, color: r.doc === CONSUMIDOR_FINAL_DOC ? "#a0a3ad" : ACCENT, fontWeight: 600 }}>
            {r.doc === CONSUMIDOR_FINAL_DOC ? "—" : formatCnpjCpf(r.doc)}
          </div>
          <div style={{ fontSize: 12, color: "#4b4e58" }}>{r.uf || "—"}</div>
          <div style={{ fontSize: 12, color: "#4b4e58" }}>{r.count.toLocaleString("pt-BR")}</div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0e7a6f", fontFamily: "var(--font-jetbrains)" }}>{BRL(r.total)}</div>
          <div>
            {r.temIbsCbs ? (
              <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: "#eef1ff", color: ACCENT }}>Sim</span>
            ) : (
              <span style={{ fontSize: 11, color: "#c2c3c9" }}>—</span>
            )}
          </div>
          {canDelete ? (
            <ConfirmForm
              action={deleteParty}
              message={`Excluir ${tipo === "compra" ? "o fornecedor" : "o cliente"} "${r.nome || "sem nome"}"? Isso apaga ${empresaId ? "as notas dessa empresa" : "as notas em todas as empresas"} vinculadas a ele (${r.count} nota${r.count > 1 ? "s" : ""}) — não pode ser desfeito.`}
            >
              <input type="hidden" name="tipo" value={tipo} />
              <input type="hidden" name="doc" value={r.doc} />
              {empresaId ? <input type="hidden" name="empresaId" value={empresaId} /> : null}
              <button type="submit" title="Excluir" className="hv-danger" style={{ color: "#c2c3c9", cursor: "pointer", padding: 4, background: "none", border: "none" }}>
                <svg width="14" height="14" viewBox="0 0 15 15">
                  <path d="M2 3.5h11M6 3.5V2h3v1.5M3.5 3.5l.7 9.5h6.6l.7-9.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </ConfirmForm>
          ) : null}
        </div>
      ))}
      {rows.length === 0 ? (
        <div style={{ padding: 18, fontSize: 12.5, color: "#a0a3ad", fontStyle: "italic" }}>{emptyLabel}</div>
      ) : null}
    </div>
  );
}
