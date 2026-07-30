import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";
import { FilterPanel } from "@/components/app/FilterPanel";
import { PreviewPanel } from "@/components/app/PreviewPanel";

export const dynamic = "force-dynamic";

export default async function ExportarRelatóriosPage({ searchParams }: { searchParams: Promise<{ cst?: string; cclass?: string; aliqIbs?: string; aliqCbs?: string; redIbs?: string; redCbs?: string; types?: string }> }) {
  const { member } = await getContext();
  if (member.role !== "admin") redirect("/dashboard");

  const sp = await searchParams;
  const filters = {
    cst: sp.cst ? sp.cst.split(",").filter(Boolean) : [],
    cclass: sp.cclass ? sp.cclass.split(",").filter(Boolean) : [],
    aliqIbs: sp.aliqIbs ? sp.aliqIbs.split(",").filter(Boolean) : [],
    aliqCbs: sp.aliqCbs ? sp.aliqCbs.split(",").filter(Boolean) : [],
    redIbs: sp.redIbs ? sp.redIbs.split(",").filter(Boolean) : [],
    redCbs: sp.redCbs ? sp.redCbs.split(",").filter(Boolean) : [],
    types: sp.types ? sp.types.split(",").filter(Boolean) : ["produtos", "servicos"],
  };

  return (
    <div className="stagger" style={{ padding: "20px 22px", height: "100%", overflow: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Exportar Relatórios de Tributação</div>
        <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>
          Selecione filtros para exportar dados de IBS/CBS em formato XLSX
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start" }}>
        <FilterPanel initialFilters={filters} />
        <PreviewPanel filters={filters} />
      </div>
    </div>
  );
}
