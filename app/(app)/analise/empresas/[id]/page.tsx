import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getContext } from "@/lib/data";
import { canDo, canViewTab } from "@/lib/permissions";
import { ACCENT } from "@/lib/design";
import { PartiesTable } from "@/components/app/PartiesTable";
import { ProductsTable } from "@/components/app/ProductsTable";
import { EmpresaDetailTabs } from "@/components/app/EmpresaDetailTabs";
import { EmpresaExportButton } from "@/components/app/EmpresaExportButton";
import { ConfirmForm } from "@/components/app/ConfirmForm";
import { deleteEmpresaAndRedirect } from "@/app/(app)/analise/actions";
import { aggregateParties, aggregateProducts, CONSUMIDOR_FINAL_DOC, type PartyAgg, type ProductAgg } from "@/lib/nfe/aggregate";
import { formatCnpjCpf } from "@/lib/nfe/parseNfe";

export const dynamic = "force-dynamic";

const ROW_CAP = 5000;

const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function kpi(label: string, value: React.ReactNode, color?: string) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 8, color: color ?? "#1c1e26" }}>{value}</div>
    </div>
  );
}

export default async function EmpresaDetailPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { member } = await getContext();
  if (!canViewTab(member, "analise")) redirect("/dashboard");
  const canDelete = canDo(member, "analise", "delete");
  const sp = await searchParams;
  const tab =
    sp.tab === "clientes" ? "clientes" :
    sp.tab === "produtos-comprados" ? "produtos-comprados" :
    sp.tab === "produtos-vendidos" ? "produtos-vendidos" : "fornecedores";
  const supabase = await createClient();

  const { data: empresa } = await supabase.from("nfe_empresas").select("id,nome,cnpj").eq("id", id).maybeSingle();
  if (!empresa) notFound();

  const { data: notes } = await supabase
    .from("nfe_notes")
    .select("tipo,emit_documento,emit_nome,emit_uf,dest_documento,dest_nome,dest_uf,valor_total,tem_ibs_cbs")
    .eq("empresa_id", id)
    .limit(ROW_CAP);

  const compras = (notes ?? []).filter((r) => r.tipo === "compra");
  const vendas = (notes ?? []).filter((r) => r.tipo === "venda");

  const fornecedores: PartyAgg[] = aggregateParties(
    compras.map((r) => ({ doc: r.emit_documento, nome: r.emit_nome, uf: r.emit_uf ?? "", total: Number(r.valor_total), temIbsCbs: !!r.tem_ibs_cbs })),
  );
  const clientes: PartyAgg[] = aggregateParties(
    vendas.map((r) => ({
      doc: r.dest_documento ?? CONSUMIDOR_FINAL_DOC,
      nome: r.dest_nome ?? "Consumidor final",
      uf: r.dest_uf ?? "",
      total: Number(r.valor_total),
      temIbsCbs: !!r.tem_ibs_cbs,
    })),
  );

  const totalCompras = compras.reduce((s, r) => s + Number(r.valor_total), 0);
  const totalVendas = vendas.reduce((s, r) => s + Number(r.valor_total), 0);

  let produtosComprados: ProductAgg[] = [];
  let produtosVendidos: ProductAgg[] = [];

  // Sempre carregar produtos comprados e vendidos (para exportação XLSX)
  const { data: comprasItems } = await supabase
    .from("nfe_note_items")
    .select("tipo,nome,cfop,nat_op,valor,created_at")
    .eq("empresa_id", id)
    .eq("tipo", "compra")
    .order("created_at", { ascending: true })
    .limit(ROW_CAP);
  const comprasRows = (comprasItems ?? []).map((r) => ({ nome: r.nome, cfop: r.cfop ?? "", natOp: r.nat_op ?? "", valor: Number(r.valor) }));
  produtosComprados = aggregateProducts(comprasRows);

  const { data: vendasItems } = await supabase
    .from("nfe_note_items")
    .select("tipo,nome,cfop,nat_op,valor,created_at")
    .eq("empresa_id", id)
    .eq("tipo", "venda")
    .order("created_at", { ascending: true })
    .limit(ROW_CAP);
  const vendasRows = (vendasItems ?? []).map((r) => ({ nome: r.nome, cfop: r.cfop ?? "", natOp: r.nat_op ?? "", valor: Number(r.valor) }));
  produtosVendidos = aggregateProducts(vendasRows);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 12, padding: "14px 22px", background: "#fff", borderBottom: "1px solid #e7e7e3" }}>
        <Link href="/analise?tab=empresas" className="hv-light" style={{ width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center", color: "#4b4e58" }}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{empresa.nome}</div>
          {empresa.cnpj ? (
            <div style={{ fontSize: 11, color: "#8a8d98", fontFamily: "var(--font-jetbrains)" }}>{formatCnpjCpf(empresa.cnpj)}</div>
          ) : null}
        </div>
        <EmpresaExportButton
          empresaNome={empresa.nome}
          empresaCnpj={empresa.cnpj}
          fornecedores={fornecedores}
          clientes={clientes}
          totalCompras={totalCompras}
          totalVendas={totalVendas}
          produtosComprados={produtosComprados}
          produtosVendidos={produtosVendidos}
        />
        {canDelete ? (
          <ConfirmForm
            action={deleteEmpresaAndRedirect}
            message={`Excluir a empresa "${empresa.nome}"? Isso apaga todas as ${compras.length + vendas.length} notas importadas dela. Não pode ser desfeito.`}
          >
            <input type="hidden" name="id" value={empresa.id} />
            <button
              type="submit"
              className="hv-danger"
              style={{
                display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, color: "#b3402e",
                background: "#fff", border: "1.5px solid #f0c8bf", borderRadius: 8, padding: "7px 12px", cursor: "pointer",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 15 15">
                <path d="M2 3.5h11M6 3.5V2h3v1.5M3.5 3.5l.7 9.5h6.6l.7-9.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Excluir empresa
            </button>
          </ConfirmForm>
        ) : null}
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "24px 28px 60px", display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {kpi("Notas importadas", (compras.length + vendas.length).toLocaleString("pt-BR"))}
          {kpi("Total comprado", BRL(totalCompras), ACCENT)}
          {kpi("Total vendido", BRL(totalVendas), "#0e7a6f")}
          {kpi("Fornecedores / Clientes", `${fornecedores.length} / ${clientes.length}`)}
        </div>

        <EmpresaDetailTabs empresaId={empresa.id} tab={tab} />

        {tab === "fornecedores" ? (
          <section>
            <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>Emitentes das notas de compra desta empresa.</div>
            <PartiesTable rows={fornecedores} tipo="compra" empresaId={empresa.id} canDelete={canDelete} emptyLabel="Nenhuma nota de compra importada para esta empresa ainda." />
          </section>
        ) : tab === "clientes" ? (
          <section>
            <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>Destinatários das notas de venda desta empresa.</div>
            <PartiesTable rows={clientes} tipo="venda" empresaId={empresa.id} canDelete={canDelete} emptyLabel="Nenhuma nota de venda importada para esta empresa ainda." />
          </section>
        ) : tab === "produtos-comprados" ? (
          <section>
            <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>Itens das notas de compra desta empresa, agrupados por produto + CFOP.</div>
            <ProductsTable rows={produtosComprados} emptyLabel="Nenhum item de compra importado para esta empresa ainda." />
          </section>
        ) : (
          <section>
            <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>Itens das notas de venda desta empresa, agrupados por produto + CFOP.</div>
            <ProductsTable rows={produtosVendidos} emptyLabel="Nenhum item de venda importado para esta empresa ainda." />
          </section>
        )}
      </div>
    </div>
  );
}
