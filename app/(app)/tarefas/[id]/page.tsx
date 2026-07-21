import { notFound } from "next/navigation";
import { getContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { TaskDetail, type TaskDetailData } from "./task-detail";

export const dynamic = "force-dynamic";

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} · ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default async function TarefaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { id } = await params;
  const { cliente } = await searchParams;
  const { members } = await getContext();
  const byId = Object.fromEntries(members.map((m) => [m.id, m]));
  const supabase = await createClient();

  const { data: task } = await supabase
    .from("tasks")
    .select("id,title,description,category,start_date,due_date,rec,rec_label,flow_id")
    .eq("id", id)
    .maybeSingle();
  if (!task) notFound();

  const [{ data: subs }, { data: people }, { data: tcs }, { data: comments }, { data: clients }, { data: flows }] =
    await Promise.all([
      supabase.from("subtasks").select("id,title").eq("task_id", id).order("position"),
      supabase.from("task_people").select("member_id").eq("task_id", id),
      supabase.from("task_clients").select("id,client_id,clients(id,name,ini,color)").eq("task_id", id),
      supabase.from("comments").select("id,text,created_at,author_member_id").eq("task_id", id).order("created_at"),
      supabase.from("clients").select("id,name").order("name"),
      supabase.from("flows").select("id,name").order("created_at"),
    ]);

  const subtasks = ((subs ?? []) as { id: string; title: string }[]).map((s) => ({ id: s.id, title: s.title }));
  const tcList = (tcs ?? []) as Record<string, unknown>[];
  const tcIds = tcList.map((t) => t.id as string);

  const doneByTc: Record<string, string[]> = {};
  if (tcIds.length) {
    const { data: comps } = await supabase
      .from("subtask_completions")
      .select("task_client_id,subtask_id")
      .in("task_client_id", tcIds);
    (comps ?? []).forEach((c: { task_client_id: string; subtask_id: string }) => {
      (doneByTc[c.task_client_id] = doneByTc[c.task_client_id] || []).push(c.subtask_id);
    });
  }

  const total = subtasks.length;
  const links = tcList.map((tc) => {
    const c = tc.clients as { id: string; name: string; ini: string; color: string };
    const done = doneByTc[tc.id as string] || [];
    return {
      tcId: tc.id as string,
      clientId: tc.client_id as string,
      name: c.name,
      ini: c.ini,
      color: c.color,
      done,
      pct: total ? Math.round((done.length / total) * 100) : 0,
    };
  });

  const data: TaskDetailData = {
    id: task.id as string,
    title: task.title as string,
    description: (task.description as string) || "",
    category: task.category as string,
    startDate: task.start_date as string | null,
    dueDate: task.due_date as string | null,
    rec: task.rec as boolean,
    recLabel: (task.rec_label as string) || "mensal",
    flowId: task.flow_id as string | null,
    flowName: task.flow_id ? ((flows ?? []).find((f: { id: string }) => f.id === task.flow_id)?.name ?? null) : null,
    subtasks,
    peopleIds: ((people ?? []) as { member_id: string }[]).map((p) => p.member_id),
    links,
    comments: ((comments ?? []) as Record<string, unknown>[]).map((c) => {
      const a = byId[c.author_member_id as string];
      return {
        id: c.id as string,
        text: c.text as string,
        time: fmtTime(c.created_at as string),
        name: a?.name ?? "Equipe",
        ini: a?.ini ?? "?",
        color: a?.color ?? "#8a8d98",
      };
    }),
  };

  return (
    <TaskDetail
      task={data}
      members={members.map((m) => ({ id: m.id, name: m.name }))}
      clients={(clients ?? []) as { id: string; name: string }[]}
      flows={(flows ?? []) as { id: string; name: string }[]}
      initialActive={cliente ?? null}
    />
  );
}
