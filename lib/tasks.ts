import type { SupabaseClient } from "@supabase/supabase-js";

/* Shapes returned to the UI (Database types are permissive `any`). */
export type TaskLink = { tcId: string; clientId: string; name: string; ini: string; color: string; pct: number };
export type TaskListItem = {
  id: string;
  title: string;
  category: string;
  rec: boolean;
  recLabel: string | null;
  startDate: string | null;
  dueDate: string | null;
  peopleIds: string[];
  subtaskCount: number;
  links: TaskLink[];
  avgPct: number | null;
};

type AnySupabase = SupabaseClient<Record<string, unknown>>;

/** Loads all tasks with people, per-client links and computed progress. */
export async function loadTaskList(supabase: AnySupabase): Promise<TaskListItem[]> {
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id,title,category,rec,rec_label,start_date,due_date")
    .order("created_at");
  const list = (tasks ?? []) as Record<string, unknown>[];
  if (!list.length) return [];

  const taskIds = list.map((t) => t.id as string);
  const [{ data: subs }, { data: people }, { data: tcs }, { data: clients }] = await Promise.all([
    supabase.from("subtasks").select("task_id").in("task_id", taskIds),
    supabase.from("task_people").select("task_id,member_id").in("task_id", taskIds),
    supabase.from("task_clients").select("id,task_id,client_id").in("task_id", taskIds),
    supabase.from("clients").select("id,name,ini,color"),
  ]);

  const subCount: Record<string, number> = {};
  (subs ?? []).forEach((s: { task_id: string }) => (subCount[s.task_id] = (subCount[s.task_id] || 0) + 1));

  const peopleByTask: Record<string, string[]> = {};
  (people ?? []).forEach((p: { task_id: string; member_id: string }) => {
    (peopleByTask[p.task_id] = peopleByTask[p.task_id] || []).push(p.member_id);
  });

  const tcList = (tcs ?? []) as { id: string; task_id: string; client_id: string }[];
  const tcIds = tcList.map((t) => t.id);
  const compCount: Record<string, number> = {};
  if (tcIds.length) {
    const { data: comps } = await supabase
      .from("subtask_completions")
      .select("task_client_id")
      .in("task_client_id", tcIds);
    (comps ?? []).forEach(
      (c: { task_client_id: string }) => (compCount[c.task_client_id] = (compCount[c.task_client_id] || 0) + 1),
    );
  }

  const clientById = Object.fromEntries(
    ((clients ?? []) as Record<string, unknown>[]).map((c) => [c.id as string, c]),
  );

  const linksByTask: Record<string, TaskLink[]> = {};
  tcList.forEach((tc) => {
    const c = clientById[tc.client_id];
    if (!c) return;
    const total = subCount[tc.task_id] || 0;
    const pct = total ? Math.round(((compCount[tc.id] || 0) / total) * 100) : 0;
    (linksByTask[tc.task_id] = linksByTask[tc.task_id] || []).push({
      tcId: tc.id,
      clientId: tc.client_id,
      name: c.name as string,
      ini: c.ini as string,
      color: c.color as string,
      pct,
    });
  });

  return list.map((t) => {
    const id = t.id as string;
    const links = linksByTask[id] || [];
    const avgPct = links.length ? Math.round(links.reduce((a, l) => a + l.pct, 0) / links.length) : null;
    return {
      id,
      title: t.title as string,
      category: t.category as string,
      rec: t.rec as boolean,
      recLabel: t.rec_label as string | null,
      startDate: t.start_date as string | null,
      dueDate: t.due_date as string | null,
      peopleIds: peopleByTask[id] || [],
      subtaskCount: subCount[id] || 0,
      links,
      avgPct,
    };
  });
}
