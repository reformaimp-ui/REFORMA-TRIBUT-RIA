import { CONSUMIDOR_FINAL_DOC, type ProductAgg } from "@/lib/nfe/aggregate";
import { formatCnpjCpf } from "@/lib/nfe/parseNfe";
import { cfopDescricao } from "@/lib/nfe/cfop";

const th: React.CSSProperties = {
  padding: "10px 18px", background: "#fafaf8", borderBottom: "1px solid #ececea",
  fontSize: 10.5, fontWeight: 700, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".05em",
};

const GRID = "1.6fr 1.5fr 1.4fr 240px 1.1fr 70px 130px";
// A chave de acesso (44 dígitos) e a descrição do CFOP empurram a tabela além
// da largura do painel — o container rola na horizontal em vez de espremer as
// demais colunas.
const MIN_WIDTH = 1420;

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Quebra a chave em blocos de 4 pra ficar legível sem virar uma parede de dígitos. */
function chaveLabel(chave: string): string {
  return chave.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** Código do CFOP com a descrição oficial embaixo (completa no tooltip). */
function CfopCell({ cfop }: { cfop: string }) {
  const desc = cfopDescricao(cfop);
  return (
    <div style={{ overflow: "hidden" }}>
      <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "#4b4e58", fontWeight: 600 }}>{cfop || "—"}</div>
      {desc ? (
        <div style={{ fontSize: 10.5, color: "#8a8d98", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={desc}>
          {desc}
        </div>
      ) : null}
    </div>
  );
}

export function ProductsTable({
  rows, emptyLabel, partyLabel = "Fornecedor",
}: {
  rows: ProductAgg[];
  emptyLabel: string;
  partyLabel?: string;
}) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, overflow: "auto" }}>
      <div style={{ minWidth: MIN_WIDTH }}>
        <div style={{ display: "grid", gridTemplateColumns: GRID, gap: 10, whiteSpace: "nowrap", ...th }}>
          <div>Produto</div><div>CFOP</div><div>{partyLabel}</div><div>Chave de acesso</div>
          <div>Tipo de operação</div><div>Itens</div><div>Valor total</div>
        </div>
        {rows.map((r) => (
          <div
            key={`${r.nome}|${r.cfop}|${r.partyDoc}`}
            className="hv-row"
            style={{ display: "grid", gridTemplateColumns: GRID, gap: 10, alignItems: "center", padding: "11px 18px", borderBottom: "1px solid #f0f0ed" }}
          >
            <div style={{ fontSize: 12.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.nome}>{r.nome}</div>
            <CfopCell cfop={r.cfop} />
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 12, color: "#1c1e26", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.partyNome}>
                {r.partyNome || "—"}
              </div>
              <div style={{ fontSize: 10.5, color: "#8a8d98", fontFamily: "var(--font-jetbrains)", whiteSpace: "nowrap" }}>
                {r.partyDoc && r.partyDoc !== CONSUMIDOR_FINAL_DOC ? formatCnpjCpf(r.partyDoc) : "—"}
              </div>
            </div>
            <div style={{ overflow: "hidden" }}>
              <div
                style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10.5, color: "#4b4e58", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                title={r.chave || undefined}
              >
                {r.chave ? chaveLabel(r.chave) : "—"}
              </div>
              {r.notas > 1 ? (
                <div style={{ fontSize: 10.5, color: "#8a8d98", whiteSpace: "nowrap" }}>última de {r.notas.toLocaleString("pt-BR")} notas</div>
              ) : null}
            </div>
            <div style={{ fontSize: 12, color: "#4b4e58", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.natOp}>{r.natOp || "—"}</div>
            <div style={{ fontSize: 12, color: "#4b4e58" }}>{r.count.toLocaleString("pt-BR")}</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0e7a6f", fontFamily: "var(--font-jetbrains)" }}>{BRL(r.total)}</div>
          </div>
        ))}
        {rows.length === 0 ? (
          <div style={{ padding: 18, fontSize: 12.5, color: "#a0a3ad", fontStyle: "italic" }}>{emptyLabel}</div>
        ) : null}
      </div>
    </div>
  );
}
