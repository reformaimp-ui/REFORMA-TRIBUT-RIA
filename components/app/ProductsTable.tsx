import type { ProductAgg } from "@/lib/nfe/aggregate";

const th: React.CSSProperties = {
  padding: "10px 18px", background: "#fafaf8", borderBottom: "1px solid #ececea",
  fontSize: 10.5, fontWeight: 700, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".05em",
};

const GRID = "2fr 90px 2fr 90px 150px";

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ProductsTable({ rows, emptyLabel }: { rows: ProductAgg[]; emptyLabel: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, overflow: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: GRID, gap: 10, whiteSpace: "nowrap", ...th }}>
        <div>Produto</div><div>CFOP</div><div>Tipo de operação</div><div>Itens</div><div>Valor total</div>
      </div>
      {rows.map((r) => (
        <div
          key={`${r.nome}|${r.cfop}`}
          className="hv-row"
          style={{ display: "grid", gridTemplateColumns: GRID, gap: 10, alignItems: "center", padding: "11px 18px", borderBottom: "1px solid #f0f0ed" }}
        >
          <div style={{ fontSize: 12.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.nome}</div>
          <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "#4b4e58", fontWeight: 600 }}>{r.cfop || "—"}</div>
          <div style={{ fontSize: 12, color: "#4b4e58", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.natOp}>{r.natOp || "—"}</div>
          <div style={{ fontSize: 12, color: "#4b4e58" }}>{r.count.toLocaleString("pt-BR")}</div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0e7a6f", fontFamily: "var(--font-jetbrains)" }}>{BRL(r.total)}</div>
        </div>
      ))}
      {rows.length === 0 ? (
        <div style={{ padding: 18, fontSize: 12.5, color: "#a0a3ad", fontStyle: "italic" }}>{emptyLabel}</div>
      ) : null}
    </div>
  );
}
