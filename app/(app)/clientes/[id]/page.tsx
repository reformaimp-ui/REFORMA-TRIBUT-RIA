import Link from "next/link";
import { notFound } from "next/navigation";
import { getContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { av, catMeta, progColor, statusLabel, STATUS_COLOR } from "@/lib/design";

export const dynamic = "force-dynamic";

function kpi(label: string, value: React.ReactNode, color?: string) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".05em" }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8, color: color ?? "#1c1e26" }}>{value}</div>
    </div>
  );
}

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { members } = await getContext();
  const byId = Object.fromEntries(members.map((m) => [m.id, m]));
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id,name,setor,regime,resp_member_id,pct,status,ini,color")
    .eq("id", id)
    .maybeSingle();
  if (!client) notFound();

  const { data: tcs } = await supabase
    .from("task_clients")
    .select("id, task_id, tasks(id,title,category)")
    .eq("client_id", id);
  const links = tcs ?? [];
  const taskIds = links.map((t: Record<string, unknown>) => t.task_id as string);
  const tcIds = links.map((t: Record<string, unknown>) => t.id as string);

  const subCount: Record<string, number> = {};
  const compCount: Record<string, number> = {};
  if (taskIds.length) {
    const { data: subs } = await supabase.from("subtasks").select("task_id").in("task_id", taskIds);
    (subs ?? []).forEach((s: { task_id: string }) => (subCount[s.task_id] = (subCount[s.task_id] || 0) + 1));
    const { data: comps } = await supabase
      .from("subtask_completions")
      .select("task_client_id")
      .in("task_client_id", tcIds);
    (comps ?? []).forEach(
      (c: { task_client_id: string }) => (compCount[c.task_client_id] = (compCount[c.task_client_id] || 0) + 1),
    );
  }

  const tasks = links.map((l: Record<string, unknown>) => {
    const t = l.tasks as { id: string; title: string; category: string };
    const total = subCount[l.task_id as string] || 0;
    const done = compCount[l.id as string] || 0;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { taskId: t.id, title: t.title, category: t.category, pct };
  });

  const resp = byId[client.resp_member_id as string];
  const st = STATUS_COLOR[client.status as string] ?? STATUS_COLOR["Em dia"];
  const openCount = tasks.filter((t) => t.pct < 100).length;
  const doneCount = tasks.filter((t) => t.pct >= 100).length;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          flex: "none",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 22px",
          background: "#fff",
          borderBottom: "1px solid #e7e7e3",
        }}
      >
        <Link href="/clientes" className="hv-light" style={{ width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center", color: "#4b4e58" }}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{client.name as string}</div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "24px 28px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
          <div style={av(client.color as string, 46)}>{client.ini as string}</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-.01em" }}>{client.name as string}</div>
            <div style={{ fontSize: 12, color: "#8a8d98", marginTop: 2 }}>
              {(client.setor as string) || "—"} · {client.regime as string}
            </div>
          </div>
          <div
            style={{
              marginLeft: "auto",
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 11px",
              borderRadius: 99,
              background: st[0],
              color: st[1],
            }}
          >
            {client.status as string}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
          {kpi("Adequação à reforma", `${client.pct}%`)}
          {kpi("Tarefas vinculadas", tasks.length)}
          {kpi("Em aberto", openCount, "#c98a2e")}
          {kpi("Concluídas", doneCount, "#0e7a6f")}
        </div>
        {resp ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={av(resp.color, 22)}>{resp.ini}</div>
            <div style={{ fontSize: 12.5, color: "#4b4e58" }}>
              Responsável: <b>{resp.name}</b>
            </div>
          </div>
        ) : null}
        <div style={{ height: 1, background: "#f0f0ed", margin: "14px 0" }} />
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Tarefas deste cliente</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tasks.map((t) => {
            const cm = catMeta[t.category] || catMeta.Fiscal;
            return (
              <Link
                key={t.taskId}
                href={`/tarefas/${t.taskId}?cliente=${id}`}
                className="hv-card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "#fff",
                  border: "1px solid #e7e7e3",
                  borderRadius: 11,
                  padding: "12px 16px",
                  color: "inherit",
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: cm.bg, color: cm.fg }}>
                  {t.category}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.title}
                </div>
                <div style={{ flex: "0 0 100px", height: 6, background: "#f0f0ed", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${t.pct}%`, height: "100%", borderRadius: 99, background: progColor(t.pct) }} />
                </div>
                <div style={{ fontSize: 11, color: "#6b6e78", fontFamily: "var(--font-jetbrains)", width: 34, textAlign: "right" }}>
                  {t.pct}%
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, color: "#fff", background: progColor(t.pct) }}>
                  {statusLabel(t.pct)}
                </div>
              </Link>
            );
          })}
          {tasks.length === 0 ? (
            <div style={{ fontSize: 12, color: "#a0a3ad", fontStyle: "italic" }}>
              Nenhuma tarefa vinculada a este cliente ainda.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
