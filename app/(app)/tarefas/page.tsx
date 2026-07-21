import Link from "next/link";
import { getContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { loadTaskList } from "@/lib/tasks";
import { ACCENT } from "@/lib/design";
import { ClientFilterSelect } from "./client-filter";
import { TaskCard } from "./task-card";

export const dynamic = "force-dynamic";

export default async function TarefasPage({
  searchParams,
}: {
  searchParams: Promise<{ pessoa?: string; cliente?: string }>;
}) {
  const { members } = await getContext();
  const sp = await searchParams;
  const pessoa = sp.pessoa || "all";
  const cliente = sp.cliente || "all";

  const supabase = await createClient();
  const [tasks, { data: clients }] = await Promise.all([
    loadTaskList(supabase),
    supabase.from("clients").select("id,name").order("name"),
  ]);

  const membersMap = Object.fromEntries(members.map((m) => [m.id, m]));
  const visible = tasks.filter(
    (t) =>
      (pessoa === "all" || t.peopleIds.includes(pessoa)) &&
      (cliente === "all" || t.links.some((l) => l.clientId === cliente)),
  );

  const filters = [{ id: "all", label: "Todos" }, ...members.map((m) => ({ id: m.id, label: m.name.split(" ")[0] }))];

  return (
    <div style={{ padding: "20px 22px", height: "100%", display: "flex", flexDirection: "column", gap: 14, overflow: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {filters.map((f) => {
          const active = pessoa === f.id;
          const qp = new URLSearchParams();
          if (f.id !== "all") qp.set("pessoa", f.id);
          if (cliente !== "all") qp.set("cliente", cliente);
          const href = qp.toString() ? `/tarefas?${qp}` : "/tarefas";
          return (
            <Link
              key={f.id}
              href={href}
              className="hv-card"
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: 99,
                border: `1px solid ${active ? ACCENT : "#e2e2de"}`,
                color: active ? "#fff" : "#4b4e58",
                background: active ? ACCENT : "#fff",
              }}
            >
              {f.label}
            </Link>
          );
        })}
        <ClientFilterSelect
          clients={(clients ?? []) as { id: string; name: string }[]}
          pessoa={pessoa}
          cliente={cliente}
        />
        <Link
          href="/tarefas/nova"
          className="hv-btn"
          style={{
            marginLeft: "auto",
            fontSize: 12,
            fontWeight: 600,
            color: "#fff",
            background: ACCENT,
            borderRadius: 8,
            padding: "7px 14px",
          }}
        >
          + Nova tarefa
        </Link>
      </div>

      <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {visible.map((t) => (
          <TaskCard key={t.id} task={t} members={membersMap} clienteFilter={cliente} />
        ))}
        {visible.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#a0a3ad", fontStyle: "italic", padding: "10px 2px" }}>
            Nenhuma tarefa encontrada com os filtros atuais.
          </div>
        ) : null}
      </div>
    </div>
  );
}
