import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { BackBar } from "@/components/app/BackBar";
import { canDo } from "@/lib/permissions";
import { CreateForm } from "./create-form";

export const dynamic = "force-dynamic";

export default async function NovaTarefaPage() {
  const { member, members } = await getContext();
  if (!canDo(member, "tarefas", "create")) redirect("/tarefas");
  const supabase = await createClient();
  const [{ data: clients }, { data: flows }] = await Promise.all([
    supabase.from("clients").select("id,name").order("name"),
    supabase.from("flows").select("id,name").order("created_at"),
  ]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <BackBar href="/tarefas" title="Nova tarefa" />
      <div style={{ flex: 1, overflow: "auto", padding: "24px 28px 60px" }}>
        <CreateForm
          members={members.map((m) => ({ id: m.id, name: m.name }))}
          clients={(clients ?? []) as { id: string; name: string }[]}
          flows={(flows ?? []) as { id: string; name: string }[]}
        />
      </div>
    </div>
  );
}
