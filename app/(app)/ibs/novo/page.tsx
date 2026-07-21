import { createClient } from "@/lib/supabase/server";
import { BackBar } from "@/components/app/BackBar";
import { IbsForm } from "./ibs-form";

export const dynamic = "force-dynamic";

export default async function NovoIbsPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: cst }, { data: cclass }] = await Promise.all([
    supabase.from("cst_rows").select("code,descr").order("position"),
    supabase.from("cclass_rows").select("code,descr").order("position"),
  ]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <BackBar href="/ibs" title="Adicionar dado do IBS/CBS" />
      <div style={{ flex: 1, overflow: "auto", padding: "26px 28px 60px" }}>
        <IbsForm
          initial={sp.tipo ?? "cst"}
          cstRows={(cst ?? []) as { code: string; descr: string }[]}
          cclassRows={(cclass ?? []) as { code: string; descr: string }[]}
        />
      </div>
    </div>
  );
}
