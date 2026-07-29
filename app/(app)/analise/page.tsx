import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getContext } from "@/lib/data";
import { canDo, canViewTab } from "@/lib/permissions";
import { AnaliseTabs } from "@/components/app/AnaliseTabs";
import { NfeImportPanel } from "@/components/app/NfeImportPanel";
import { PartiesTable } from "@/components/app/PartiesTable";
import { EmpresasPanel, type EmpresaRow } from "@/components/app/EmpresasPanel";
import { aggregateParties, CONSUMIDOR_FINAL_DOC, type PartyAgg } from "@/lib/nfe/aggregate";

export const dynamic = "force-dynamic";

// Cap alto o bastante para o volume de um escritório sem paginação — a
// agregação em si é barata, o que pesa é o número de linhas trafegadas.
const ROW_CAP = 5000;

export default async function AnalisePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { member } = await getContext();
  if (!canViewTab(member, "analise")) redirect("/dashboard");
  const canImport = canDo(member, "analise", "create");
  const sp = await searchParams;
  const tab =
    sp.tab === "importar" ? "importar" :
    sp.tab === "fornecedores" ? "fornecedores" :
    sp.tab === "clientes" ? "clientes" : "empresas";
  const supabase = await createClient();

  let empresas: EmpresaRow[] = [];
  let empresasOptions: { id: string; nome: string; cnpj: string | null }[] = [];
  if (tab === "empresas" || tab === "importar") {
    const { data } = await supabase.from("nfe_empresas").select("id,nome,cnpj").order("created_at");
    empresasOptions = data ?? [];
  }
  if (tab === "empresas") {
    const { data: counts } = await supabase.from("nfe_notes").select("empresa_id").not("empresa_id", "is", null).limit(ROW_CAP);
    const countByEmpresa: Record<string, number> = {};
    for (const r of counts ?? []) {
      const eid = r.empresa_id as string;
      countByEmpresa[eid] = (countByEmpresa[eid] ?? 0) + 1;
    }
    empresas = empresasOptions.map((e) => ({ ...e, notas: countByEmpresa[e.id] ?? 0 }));
  }

  let fornecedores: PartyAgg[] = [];
  if (tab === "fornecedores") {
    const { data } = await supabase
      .from("nfe_notes")
      .select("emit_documento,emit_nome,emit_uf,valor_total,tem_ibs_cbs")
      .eq("tipo", "compra")
      .limit(ROW_CAP);
    fornecedores = aggregateParties(
      (data ?? []).map((r) => ({ doc: r.emit_documento, nome: r.emit_nome, uf: r.emit_uf ?? "", total: Number(r.valor_total), temIbsCbs: !!r.tem_ibs_cbs })),
    );
  }

  let clientes: PartyAgg[] = [];
  if (tab === "clientes") {
    const { data } = await supabase
      .from("nfe_notes")
      .select("dest_documento,dest_nome,dest_uf,valor_total,tem_ibs_cbs")
      .eq("tipo", "venda")
      .limit(ROW_CAP);
    clientes = aggregateParties(
      (data ?? []).map((r) => ({
        doc: r.dest_documento ?? CONSUMIDOR_FINAL_DOC,
        nome: r.dest_nome ?? "Consumidor final",
        uf: r.dest_uf ?? "",
        total: Number(r.valor_total),
        temIbsCbs: !!r.tem_ibs_cbs,
      })),
    );
  }

  return (
    <div className="stagger" style={{ padding: "20px 22px", height: "100%", overflow: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
      <AnaliseTabs tab={tab} />

      {tab === "empresas" ? (
        <section>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Empresas</div>
          <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>
            Cadastre cada empresa cujas notas você vai importar — clique numa empresa para ver seus fornecedores e clientes.
          </div>
          <EmpresasPanel canCreate={canImport} empresas={empresas} />
        </section>
      ) : tab === "importar" ? (
        <section>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Importação de NF-e / NFC-e</div>
          <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>
            Extrai fornecedores e clientes automaticamente a partir dos XMLs — a chave de acesso evita duplicidade ao reimportar.
          </div>
          <NfeImportPanel canImport={canImport} empresas={empresasOptions} />
        </section>
      ) : tab === "fornecedores" ? (
        <section>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Fornecedores</div>
          <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>
            Emitentes das notas de compra importadas (todas as empresas), ordenados por valor total comprado.
          </div>
          <PartiesTable rows={fornecedores} emptyLabel="Nenhuma nota de compra importada ainda — use a aba “Importar XML”." />
        </section>
      ) : (
        <section>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Clientes</div>
          <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>
            Destinatários das notas de venda importadas (todas as empresas), ordenados por valor total vendido.
          </div>
          <PartiesTable rows={clientes} emptyLabel="Nenhuma nota de venda importada ainda — use a aba “Importar XML”." />
        </section>
      )}
    </div>
  );
}
