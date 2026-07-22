"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getContext } from "@/lib/data";
import { canDo } from "@/lib/permissions";

export type PrazosState = { error?: string };
const DENIED: PrazosState = { error: "Você não tem permissão para isso." };

export async function addMonth(fd: FormData): Promise<PrazosState> {
  const month = String(fd.get("month") || "");
  if (!/^\d{4}-\d{2}$/.test(month)) return { error: "Mês inválido." };
  const { office, member } = await getContext();
  if (!canDo(member, "prazos", "create")) return DENIED;
  const supabase = await createClient();
  const { error } = await supabase.from("prazo_months").upsert({ office_id: office.id, month }, { onConflict: "office_id,month" });
  if (error) {
    console.error("prazos.addMonth", error);
    return { error: error.message };
  }
  revalidatePath("/prazos");
  return {};
}

export async function addChange(fd: FormData): Promise<PrazosState> {
  const month = String(fd.get("month") || "");
  const title = String(fd.get("title") || "").trim();
  const dateIso = String(fd.get("date") || ""); // yyyy-mm-dd
  if (!month || !title || !/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return { error: "Preencha o título e a data." };
  const severity = String(fd.get("severity") || "informativo");
  const description = String(fd.get("description") || "").trim();
  const badge = String(fd.get("badge") || "");
  const [y, m, d] = dateIso.split("-");
  const { office, member } = await getContext();
  if (!canDo(member, "prazos", "create")) return DENIED;
  const supabase = await createClient();

  const { error: monthErr } = await supabase.from("prazo_months").upsert({ office_id: office.id, month }, { onConflict: "office_id,month" });
  if (monthErr) {
    console.error("prazos.addChange (month)", monthErr);
    return { error: monthErr.message };
  }

  const { error } = await supabase.from("changes").insert({
    office_id: office.id, month, severity, title, description,
    date: `${d}/${m}/${y}`, badge,
  });
  if (error) {
    console.error("prazos.addChange", error);
    return { error: error.message };
  }
  revalidatePath("/prazos");
  return {};
}

export async function saveChangeContent(fd: FormData): Promise<PrazosState> {
  const id = String(fd.get("id") || "");
  if (!id) return { error: "ID inválido." };
  const { member } = await getContext();
  if (!canDo(member, "prazos", "edit")) return DENIED;
  const content = String(fd.get("content") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("changes").update({ content }).eq("id", id);
  if (error) {
    console.error("prazos.saveChangeContent", error);
    return { error: error.message };
  }
  revalidatePath("/prazos");
  return {};
}

export async function deleteChange(fd: FormData): Promise<PrazosState> {
  const id = String(fd.get("id") || "");
  if (!id) return { error: "ID inválido." };
  const { member } = await getContext();
  if (!canDo(member, "prazos", "delete")) return DENIED;
  const supabase = await createClient();
  const { error } = await supabase.from("changes").delete().eq("id", id);
  if (error) {
    console.error("prazos.deleteChange", error);
    return { error: error.message };
  }
  revalidatePath("/prazos");
  return {};
}

export async function deleteMonth(fd: FormData): Promise<PrazosState> {
  const month = String(fd.get("month") || "");
  if (!month) return { error: "Mês inválido." };
  const { member } = await getContext();
  if (!canDo(member, "prazos", "delete")) return DENIED;
  const supabase = await createClient();
  const { error: e1 } = await supabase.from("changes").delete().eq("month", month);
  if (e1) {
    console.error("prazos.deleteMonth (changes)", e1);
    return { error: e1.message };
  }
  const { error: e2 } = await supabase.from("prazo_months").delete().eq("month", month);
  if (e2) {
    console.error("prazos.deleteMonth (prazo_months)", e2);
    return { error: e2.message };
  }
  revalidatePath("/prazos");
  return {};
}
