"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getContext } from "@/lib/data";

export type CreateTaskState = { error?: string };

const FIELDS = new Set(["title", "description", "category", "start_date", "due_date", "rec_label", "flow_id"]);

export async function createTask(_prev: CreateTaskState, formData: FormData): Promise<CreateTaskState> {
  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Informe o título da tarefa." };

  const description = String(formData.get("description") || "");
  const category = String(formData.get("category") || "Fiscal");
  const start = String(formData.get("start") || "") || null;
  const due = String(formData.get("due") || "") || null;
  const rec = formData.get("rec") === "true";
  const recLabel = String(formData.get("recLabel") || "mensal");
  const flowId = String(formData.get("flowId") || "") || null;
  const people: string[] = JSON.parse(String(formData.get("people") || "[]"));
  const clients: string[] = JSON.parse(String(formData.get("clients") || "[]"));
  const subtasks: string[] = JSON.parse(String(formData.get("subtasks") || "[]"));

  const { office, member } = await getContext();
  const supabase = await createClient();

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      office_id: office.id,
      title,
      description,
      category,
      start_date: start,
      due_date: due,
      rec,
      rec_label: recLabel,
      flow_id: flowId,
    })
    .select("id")
    .single();
  if (error || !task) return { error: "Não foi possível criar a tarefa." };
  const taskId = task.id as string;

  const peopleIds = people.length ? people : [member.id];
  await Promise.all([
    subtasks.length
      ? supabase.from("subtasks").insert(
          subtasks.map((t, i) => ({ office_id: office.id, task_id: taskId, title: t, position: i })),
        )
      : Promise.resolve(),
    peopleIds.length
      ? supabase.from("task_people").insert(
          peopleIds.map((m) => ({ office_id: office.id, task_id: taskId, member_id: m })),
        )
      : Promise.resolve(),
    clients.length
      ? supabase.from("task_clients").insert(
          clients.map((c) => ({ office_id: office.id, task_id: taskId, client_id: c })),
        )
      : Promise.resolve(),
  ]);

  revalidatePath("/tarefas");
  redirect(`/tarefas/${taskId}`);
}

export async function deleteTask(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", id);
  revalidatePath("/tarefas");
  redirect("/tarefas");
}

export async function updateTaskField(formData: FormData) {
  const id = String(formData.get("id") || "");
  const field = String(formData.get("field") || "");
  if (!id || !FIELDS.has(field)) return;
  let value: string | null = String(formData.get("value") ?? "");
  if ((field === "start_date" || field === "due_date" || field === "flow_id") && value === "") value = null;
  const supabase = await createClient();
  await supabase.from("tasks").update({ [field]: value }).eq("id", id);
  revalidatePath(`/tarefas/${id}`);
  revalidatePath("/tarefas");
}

export async function toggleRec(formData: FormData) {
  const id = String(formData.get("id") || "");
  const rec = formData.get("rec") === "true";
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("tasks").update({ rec: !rec }).eq("id", id);
  revalidatePath(`/tarefas/${id}`);
}

export async function addSubtask(formData: FormData) {
  const taskId = String(formData.get("taskId") || "");
  const title = String(formData.get("title") || "").trim();
  if (!taskId || !title) return;
  const { office } = await getContext();
  const supabase = await createClient();
  const { count } = await supabase
    .from("subtasks")
    .select("id", { count: "exact", head: true })
    .eq("task_id", taskId);
  await supabase.from("subtasks").insert({ office_id: office.id, task_id: taskId, title, position: count ?? 0 });
  revalidatePath(`/tarefas/${taskId}`);
}

export async function removeSubtask(formData: FormData) {
  const id = String(formData.get("id") || "");
  const taskId = String(formData.get("taskId") || "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("subtasks").delete().eq("id", id);
  revalidatePath(`/tarefas/${taskId}`);
}

export async function toggleCompletion(formData: FormData) {
  const tcId = String(formData.get("taskClientId") || "");
  const subtaskId = String(formData.get("subtaskId") || "");
  const taskId = String(formData.get("taskId") || "");
  if (!tcId || !subtaskId) return;
  const { office } = await getContext();
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("subtask_completions")
    .select("subtask_id")
    .eq("task_client_id", tcId)
    .eq("subtask_id", subtaskId)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("subtask_completions")
      .delete()
      .eq("task_client_id", tcId)
      .eq("subtask_id", subtaskId);
  } else {
    await supabase
      .from("subtask_completions")
      .insert({ office_id: office.id, task_client_id: tcId, subtask_id: subtaskId });
  }
  revalidatePath(`/tarefas/${taskId}`);
}

export async function addComment(formData: FormData) {
  const taskId = String(formData.get("taskId") || "");
  const text = String(formData.get("text") || "").trim();
  if (!taskId || !text) return;
  const { office, member } = await getContext();
  const supabase = await createClient();
  await supabase
    .from("comments")
    .insert({ office_id: office.id, task_id: taskId, author_member_id: member.id, text });
  revalidatePath(`/tarefas/${taskId}`);
}

export async function togglePerson(formData: FormData) {
  const taskId = String(formData.get("taskId") || "");
  const memberId = String(formData.get("memberId") || "");
  if (!taskId || !memberId) return;
  const { office } = await getContext();
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("task_people")
    .select("member_id")
    .eq("task_id", taskId)
    .eq("member_id", memberId)
    .maybeSingle();
  if (existing) {
    await supabase.from("task_people").delete().eq("task_id", taskId).eq("member_id", memberId);
  } else {
    await supabase.from("task_people").insert({ office_id: office.id, task_id: taskId, member_id: memberId });
  }
  revalidatePath(`/tarefas/${taskId}`);
}

export async function linkClient(formData: FormData) {
  const taskId = String(formData.get("taskId") || "");
  const clientId = String(formData.get("clientId") || "");
  if (!taskId || !clientId) return;
  const { office } = await getContext();
  const supabase = await createClient();
  await supabase.from("task_clients").insert({ office_id: office.id, task_id: taskId, client_id: clientId });
  revalidatePath(`/tarefas/${taskId}`);
}

export async function unlinkClient(formData: FormData) {
  const tcId = String(formData.get("taskClientId") || "");
  const taskId = String(formData.get("taskId") || "");
  if (!tcId) return;
  const supabase = await createClient();
  await supabase.from("task_clients").delete().eq("id", tcId);
  revalidatePath(`/tarefas/${taskId}`);
}
