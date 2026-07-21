"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getContext } from "@/lib/data";

export async function addMonth(fd: FormData) {
  const month = String(fd.get("month") || "");
  if (!/^\d{4}-\d{2}$/.test(month)) return;
  const { office } = await getContext();
  const supabase = await createClient();
  await supabase.from("prazo_months").upsert({ office_id: office.id, month }, { onConflict: "office_id,month" });
  revalidatePath("/prazos");
}

export async function addChange(fd: FormData) {
  const month = String(fd.get("month") || "");
  const title = String(fd.get("title") || "").trim();
  const dateIso = String(fd.get("date") || ""); // yyyy-mm-dd
  if (!month || !title || !/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return;
  const severity = String(fd.get("severity") || "informativo");
  const description = String(fd.get("description") || "").trim();
  const badge = String(fd.get("badge") || "");
  const [y, m, d] = dateIso.split("-");
  const { office } = await getContext();
  const supabase = await createClient();
  await supabase.from("prazo_months").upsert({ office_id: office.id, month }, { onConflict: "office_id,month" });
  await supabase.from("changes").insert({
    office_id: office.id, month, severity, title, description,
    date: `${d}/${m}/${y}`, badge,
  });
  revalidatePath("/prazos");
}

export async function saveChangeContent(fd: FormData) {
  const id = String(fd.get("id") || "");
  if (!id) return;
  const content = String(fd.get("content") ?? "");
  const supabase = await createClient();
  await supabase.from("changes").update({ content }).eq("id", id);
  revalidatePath("/prazos");
}

export async function deleteChange(fd: FormData) {
  const id = String(fd.get("id") || "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("changes").delete().eq("id", id);
  revalidatePath("/prazos");
}

export async function deleteMonth(fd: FormData) {
  const month = String(fd.get("month") || "");
  if (!month) return;
  const supabase = await createClient();
  await supabase.from("changes").delete().eq("month", month);
  await supabase.from("prazo_months").delete().eq("month", month);
  revalidatePath("/prazos");
}
