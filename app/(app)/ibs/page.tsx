import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ACCENT } from "@/lib/design";
import { CstTable } from "@/components/app/CstTable";
import { CclassTable } from "@/components/app/CclassTable";
import { ProdutoTable, type ProdRow } from "@/components/app/ProdutoTable";

export const dynamic = "force-dynamic";

function tabStyle(active: boolean): React.CSSProperties {
  return {
    fontSize: 12.5, fontWeight: 600, padding: "8px 16px", borderRadius: 8,
    color: active ? "#fff" : "#4b4e58", background: active ? ACCENT : "#fff",
    border: `1px solid ${active ? ACCENT : "#e2e2de"}`,
  };
}

const PAGE_SIZE = 100;

export default async function IbsPage({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string; page?: string }> }) {
  const sp = await searchParams;
  const tab = sp.tab === "produtos" ? "produtos" : "dados";
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);
  const supabase = await createClient();

  // Produtos: busca + paginação server-side (suporta 10k+ sem estourar o cap de 1000
  // linhas do PostgREST nem o DOM). Só consulta produtos quando a aba está ativa.
  let prod: ProdRow[] = [];
  let prodTotal = 0;
  if (tab === "produtos") {
    let query = supabase
      .from("produto_rows")
      .select("ncm,descr,cst,cclass,aliq_ibs,aliq_cbs,red_ibs,red_cbs", { count: "exact" })
      .order("position")
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (q) {
      const like = `%${q}%`;
      query = query.or(`ncm.ilike.${like},descr.ilike.${like},cst.ilike.${like},cclass.ilike.${like}`);
    }
    const { data, count } = await query;
    prod = (data ?? []) as ProdRow[];
    prodTotal = count ?? 0;
  }

  const [{ data: cst }, { data: cclass }, { data: links }] = await Promise.all([
    supabase.from("cst_rows").select("code,descr").order("position"),
    supabase.from("cclass_rows").select("code,descr").order("position"),
    supabase.from("cst_cclass_links").select("cst,cclass").order("position"),
  ]);
  const cclassDescr = Object.fromEntries((cclass ?? []).map((r: { code: string; descr: string }) => [r.code, r.descr]));
  const linksByCst: Record<string, { code: string; descr: string }[]> = {};
  for (const l of (links ?? []) as { cst: string; cclass: string }[]) {
    (linksByCst[l.cst] ??= []).push({ code: l.cclass, descr: cclassDescr[l.cclass] || "" });
  }

  return (
    <div className="stagger" style={{ padding: "20px 22px", height: "100%", overflow: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Link href="/ibs?tab=dados" style={tabStyle(tab === "dados")}>Dados do IBS e CBS</Link>
        <Link href="/ibs?tab=produtos" style={tabStyle(tab === "produtos")}>Tributação dos produtos</Link>
        <Link href={`/ibs/novo?tipo=${tab === "produtos" ? "produto" : "cst"}`} className="hv-btn" style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "#fff", background: ACCENT, borderRadius: 8, padding: "7px 14px" }}>
          + Adicionar dado
        </Link>
      </div>

      {tab === "dados" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>CSTs do IBS e CBS</div>
            <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>Código de Situação Tributária — Informe Técnico 2025.002 (RFB)</div>
            <CstTable rows={cst ?? []} linksByCst={linksByCst} />
          </section>
          <section>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>cClassTrib do IBS e CBS</div>
            <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>Código de Classificação Tributária — os 3 primeiros dígitos coincidem com o CST</div>
            <CclassTable rows={cclass ?? []} />
          </section>
        </div>
      ) : (
        <section>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Tributação dos produtos</div>
          <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>Alíquotas de referência do período de transição</div>
          <ProdutoTable rows={prod} cclassDescr={cclassDescr} total={prodTotal} page={page} pageSize={PAGE_SIZE} q={q} />
        </section>
      )}
    </div>
  );
}
