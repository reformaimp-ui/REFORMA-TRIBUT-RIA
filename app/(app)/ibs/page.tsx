import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getContext } from "@/lib/data";
import { canDo, canViewTab } from "@/lib/permissions";
import { CstTable } from "@/components/app/CstTable";
import { CclassTable } from "@/components/app/CclassTable";
import { ProdutoTable, type ProdRow } from "@/components/app/ProdutoTable";
import { ServicoTable, type ServicoRow } from "@/components/app/ServicoTable";
import { NcmExplorer } from "@/components/app/NcmExplorer";
import { GroupsPanel } from "@/components/app/GroupsPanel";
import { TaxAiChat } from "@/components/ai/TaxAiChat";
import { IbsEditGuardProvider } from "@/components/app/IbsEditGuard";
import { IbsTabs } from "@/components/app/IbsTabs";
import { listGroups, listCategories } from "./grupos-actions";
import { codeSearchPatterns } from "@/lib/codeSearch";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

export default async function IbsPage({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string; page?: string }> }) {
  const { member } = await getContext();
  if (!canViewTab(member, "ibs")) redirect("/dashboard");
  const canCreate = canDo(member, "ibs", "create");
  const canDelete = canDo(member, "ibs", "delete");
  const canEdit = canDo(member, "ibs", "edit");
  const sp = await searchParams;
  const tab =
    sp.tab === "produtos" ? "produtos" :
    sp.tab === "servicos" ? "servicos" :
    sp.tab === "arvore-ncm" ? "arvore-ncm" :
    sp.tab === "grupos-produtos" ? "grupos-produtos" :
    sp.tab === "grupos-servicos" ? "grupos-servicos" :
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
      .select("id,ncm,descr,cst,cclass,aliq_ibs,aliq_cbs,red_ibs,red_cbs", { count: "exact" })
      .order("position")
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (q) {
      query = query.or(codeSearchPatterns(q, "ncm", "ncm_digits", ["descr", "cst", "cclass"]));
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
      .select("id,item,nbs,nbs_descr,indop,local_ibs,cclass,cclass_nome", { count: "exact" })
      .order("position")
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (q) {
      query = query.or(codeSearchPatterns(q, "nbs", "nbs_digits", ["item", "nbs_descr", "indop", "cclass"]));
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

  let produtoGroups: Awaited<ReturnType<typeof listGroups>> = [];
  let produtoCategories: Awaited<ReturnType<typeof listCategories>> = [];
  if (tab === "grupos-produtos") [produtoGroups, produtoCategories] = await Promise.all([listGroups("produto"), listCategories("produto")]);
  let servicoGroups: Awaited<ReturnType<typeof listGroups>> = [];
  let servicoCategories: Awaited<ReturnType<typeof listCategories>> = [];
  if (tab === "grupos-servicos") [servicoGroups, servicoCategories] = await Promise.all([listGroups("servico"), listCategories("servico")]);

  const [{ data: cst }, { data: cclass }, { data: links }] = await Promise.all([
    supabase.from("cst_rows").select("id,code,descr").order("position"),
    supabase.from("cclass_rows").select("id,code,descr").order("position"),
    supabase.from("cst_cclass_links").select("cst,cclass").order("position"),
  ]);
  const cclassDescr = Object.fromEntries((cclass ?? []).map((r: { code: string; descr: string }) => [r.code, r.descr]));
  const linksByCst: Record<string, { code: string; descr: string }[]> = {};
  for (const l of (links ?? []) as { cst: string; cclass: string }[]) {
    (linksByCst[l.cst] ??= []).push({ code: l.cclass, descr: cclassDescr[l.cclass] || "" });
  }

  const addHref =
    canCreate && tab !== "assistente" && tab !== "grupos-produtos" && tab !== "grupos-servicos"
      ? `/ibs/novo?tipo=${tab === "produtos" ? "produto" : tab === "servicos" ? "servico" : tab === "arvore-ncm" ? "ncm" : "cst"}`
      : null;

  return (
    <IbsEditGuardProvider>
      <div className="stagger" style={{ padding: "20px 22px", height: "100%", overflow: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
        <IbsTabs tab={tab} addHref={addHref} />

        {tab === "dados" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <section>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>CSTs do IBS e CBS</div>
              <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>Código de Situação Tributária — Informe Técnico 2025.002 (RFB) — dê duplo clique numa linha para editar</div>
              <CstTable rows={cst ?? []} linksByCst={linksByCst} canDelete={canDelete} canEdit={canEdit} />
            </section>
            <section>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>cClassTrib do IBS e CBS</div>
              <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>Código de Classificação Tributária — os 3 primeiros dígitos coincidem com o CST — dê duplo clique numa linha para editar</div>
              <CclassTable rows={cclass ?? []} canDelete={canDelete} canEdit={canEdit} />
            </section>
          </div>
        ) : tab === "produtos" ? (
          <section>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Tributação dos produtos</div>
            <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>Alíquotas de referência do período de transição — clique no NCM para ver a árvore de classificação, duplo clique na linha para editar</div>
            <ProdutoTable rows={prod} cclassDescr={cclassDescr} total={prodTotal} page={page} pageSize={PAGE_SIZE} q={q} canDelete={canDelete} canEdit={canEdit} />
          </section>
        ) : tab === "servicos" ? (
          <section>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Tributação dos serviços</div>
            <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>Classificação por NBS (Nomenclatura Brasileira de Serviços) — CST e % de redução seguem o mesmo cClassTrib cadastrado em Tributação dos produtos — duplo clique na linha para editar</div>
            <ServicoTable rows={serv} cstRedByCclass={cstRedByCclass} total={servTotal} page={page} pageSize={PAGE_SIZE} q={q} canDelete={canDelete} canEdit={canEdit} />
          </section>
        ) : tab === "arvore-ncm" ? (
          <section>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Árvore de NCM</div>
            <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>Pesquise um código ou descrição para ver a hierarquia completa (capítulo → posição → subposição → item)</div>
            <NcmExplorer />
          </section>
        ) : tab === "grupos-produtos" ? (
          <section>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Grupos de produtos</div>
            <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>Organize as tributações de NCM em grupos e subgrupos livres, com observações — uma tributação pode estar em vários grupos</div>
            <GroupsPanel
              kind="produto" initialGroups={produtoGroups} initialCategories={produtoCategories}
              canCreate={canCreate} canDelete={canDelete} cclassDescr={cclassDescr} linksByCst={linksByCst}
            />
          </section>
        ) : tab === "grupos-servicos" ? (
          <section>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Grupos de serviços</div>
            <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>Organize as tributações de NBS em grupos e subgrupos livres, com observações — uma tributação pode estar em vários grupos</div>
            <GroupsPanel
              kind="servico" initialGroups={servicoGroups} initialCategories={servicoCategories}
              canCreate={canCreate} canDelete={canDelete} cclassDescr={cclassDescr} linksByCst={linksByCst}
            />
          </section>
        ) : (
          <section style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Assistente IA</div>
            <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>Descreva um produto ou serviço para descobrir o NCM/NBS provável e a tributação de IBS e CBS</div>
            <TaxAiChat />
          </section>
        )}
      </div>
    </IbsEditGuardProvider>
  );
}
