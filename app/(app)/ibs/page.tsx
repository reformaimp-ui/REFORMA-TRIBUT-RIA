import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getContext } from "@/lib/data";
import { ACCENT } from "@/lib/design";
import { canDo, canViewTab } from "@/lib/permissions";
import { CstTable } from "@/components/app/CstTable";
import { CclassTable } from "@/components/app/CclassTable";
import { ProdutoTable, type ProdRow } from "@/components/app/ProdutoTable";
import { ServicoTable, type ServicoRow } from "@/components/app/ServicoTable";
import { NcmExplorer } from "@/components/app/NcmExplorer";
import { TaxAiChat } from "@/components/ai/TaxAiChat";

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
  const { member } = await getContext();
  if (!canViewTab(member, "ibs")) redirect("/dashboard");
  const canCreate = canDo(member, "ibs", "create");
  const canDelete = canDo(member, "ibs", "delete");
  const sp = await searchParams;
  const tab =
    sp.tab === "produtos" ? "produtos" :
    sp.tab === "servicos" ? "servicos" :
    sp.tab === "arvore-ncm" ? "arvore-ncm" :
    sp.tab === "assistente" ? "assistente" : "dados";
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

  // Serviços: mesma lógica de busca + paginação server-side dos produtos, chaveada por NBS.
  let serv: ServicoRow[] = [];
  let servTotal = 0;
  if (tab === "servicos") {
    let query = supabase
      .from("servico_rows")
      .select("item,nbs,nbs_descr,indop,local_ibs,cclass,cclass_nome", { count: "exact" })
      .order("position")
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (q) {
      const like = `%${q}%`;
      query = query.or(`item.ilike.${like},nbs.ilike.${like},nbs_descr.ilike.${like},indop.ilike.${like},cclass.ilike.${like}`);
    }
    const { data, count } = await query;
    serv = (data ?? []) as ServicoRow[];
    servTotal = count ?? 0;
  }

  // CST e % de redução do serviço seguem o mesmo cClassTrib cadastrado em
  // Tributação dos produtos — não são digitados de novo, são derivados por join.
  let cstRedByCclass: Record<string, { cst: string; red_ibs: string; red_cbs: string }> = {};
  if (serv.length) {
    const cclassCodes = Array.from(new Set(serv.map((r) => r.cclass).filter(Boolean)));
    if (cclassCodes.length) {
      const { data: pr } = await supabase
        .from("produto_rows")
        .select("cclass,cst,red_ibs,red_cbs")
        .in("cclass", cclassCodes);
      for (const r of (pr ?? []) as { cclass: string; cst: string; red_ibs: string; red_cbs: string }[]) {
        if (!cstRedByCclass[r.cclass]) cstRedByCclass[r.cclass] = { cst: r.cst, red_ibs: r.red_ibs, red_cbs: r.red_cbs };
      }
    }
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
        <Link href="/ibs?tab=dados" className={tab === "dados" ? undefined : "hv-light"} style={tabStyle(tab === "dados")}>Dados do IBS e CBS</Link>
        <Link href="/ibs?tab=produtos" className={tab === "produtos" ? undefined : "hv-light"} style={tabStyle(tab === "produtos")}>Tributação dos produtos</Link>
        <Link href="/ibs?tab=servicos" className={tab === "servicos" ? undefined : "hv-light"} style={tabStyle(tab === "servicos")}>Tributação dos serviços</Link>
        <Link href="/ibs?tab=arvore-ncm" className={tab === "arvore-ncm" ? undefined : "hv-light"} style={tabStyle(tab === "arvore-ncm")}>Árvore de NCM</Link>
        <Link href="/ibs?tab=assistente" className={tab === "assistente" ? undefined : "hv-light"} style={tabStyle(tab === "assistente")}>Assistente IA</Link>
        {canCreate && tab !== "assistente" ? (
          <Link
            href={`/ibs/novo?tipo=${tab === "produtos" ? "produto" : tab === "servicos" ? "servico" : tab === "arvore-ncm" ? "ncm" : "cst"}`}
            className="hv-btn"
            style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "#fff", background: ACCENT, borderRadius: 8, padding: "7px 14px" }}
          >
            + Adicionar dado
          </Link>
        ) : null}
      </div>

      {tab === "dados" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>CSTs do IBS e CBS</div>
            <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>Código de Situação Tributária — Informe Técnico 2025.002 (RFB)</div>
            <CstTable rows={cst ?? []} linksByCst={linksByCst} canDelete={canDelete} />
          </section>
          <section>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>cClassTrib do IBS e CBS</div>
            <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>Código de Classificação Tributária — os 3 primeiros dígitos coincidem com o CST</div>
            <CclassTable rows={cclass ?? []} canDelete={canDelete} />
          </section>
        </div>
      ) : tab === "produtos" ? (
        <section>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Tributação dos produtos</div>
          <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>Alíquotas de referência do período de transição — clique no NCM para ver a árvore de classificação</div>
          <ProdutoTable rows={prod} cclassDescr={cclassDescr} total={prodTotal} page={page} pageSize={PAGE_SIZE} q={q} canDelete={canDelete} />
        </section>
      ) : tab === "servicos" ? (
        <section>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Tributação dos serviços</div>
          <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>Classificação por NBS (Nomenclatura Brasileira de Serviços) — CST e % de redução seguem o mesmo cClassTrib cadastrado em Tributação dos produtos</div>
          <ServicoTable rows={serv} cstRedByCclass={cstRedByCclass} total={servTotal} page={page} pageSize={PAGE_SIZE} q={q} canDelete={canDelete} />
        </section>
      ) : tab === "arvore-ncm" ? (
        <section>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Árvore de NCM</div>
          <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>Pesquise um código ou descrição para ver a hierarquia completa (capítulo → posição → subposição → item)</div>
          <NcmExplorer />
        </section>
      ) : (
        <section style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Assistente IA</div>
          <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>Descreva um produto ou serviço para descobrir o NCM/NBS provável e a tributação de IBS e CBS</div>
          <TaxAiChat />
        </section>
      )}
    </div>
  );
}
