"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getContext } from "@/lib/data";

export type IbsState = { error?: string };

async function nextPos(table: string, officeId: string) {
  const supabase = await createClient();
  const { count } = await supabase.from(table).select("id", { count: "exact", head: true });
  void officeId;
  return count ?? 0;
}

function parseCells(rowsJson: string): string[][] {
  let cells: unknown;
  try {
    cells = JSON.parse(rowsJson);
  } catch {
    return [];
  }
  if (!Array.isArray(cells)) return [];
  return cells
    .map((r) => (Array.isArray(r) ? r : []).map((c) => String(c ?? "").trim()))
    .filter((c) => c[0]);
}

function codeRows(rowsJson: string) {
  return parseCells(rowsJson).map((c) => ({ code: c[0], descr: c[1] || "" }));
}

function prodRows(rowsJson: string) {
  return parseCells(rowsJson).map((c) => ({
    ncm: c[0], descr: c[1] || "", cst: c[2] || "", cclass: c[3] || "",
    aliq_ibs: c[4] || "", aliq_cbs: c[5] || "", red_ibs: c[6] || "", red_cbs: c[7] || "",
  }));
}

export async function addCst(_p: IbsState, fd: FormData): Promise<IbsState> {
  const code = String(fd.get("code") || "").trim();
  if (!code) return { error: "Informe o código." };
  const { office } = await getContext();
  const supabase = await createClient();
  await supabase.from("cst_rows").insert({ office_id: office.id, code, descr: String(fd.get("descr") || "").trim(), position: await nextPos("cst_rows", office.id) });
  revalidatePath("/ibs");
  redirect("/ibs");
}

export async function addCclass(_p: IbsState, fd: FormData): Promise<IbsState> {
  const code = String(fd.get("code") || "").trim();
  if (!code) return { error: "Informe o código." };
  const { office } = await getContext();
  const supabase = await createClient();
  await supabase.from("cclass_rows").insert({ office_id: office.id, code, descr: String(fd.get("descr") || "").trim(), position: await nextPos("cclass_rows", office.id) });
  revalidatePath("/ibs");
  redirect("/ibs?tab=dados");
}

export async function addProduto(_p: IbsState, fd: FormData): Promise<IbsState> {
  const ncm = String(fd.get("ncm") || "").trim();
  if (!ncm) return { error: "Informe o NCM." };
  const { office } = await getContext();
  const supabase = await createClient();
  await supabase.from("produto_rows").insert({
    office_id: office.id, ncm, descr: String(fd.get("descr") || "").trim(),
    cst: String(fd.get("cst") || ""), cclass: String(fd.get("cclass") || ""),
    aliq_ibs: String(fd.get("aliq_ibs") || ""), aliq_cbs: String(fd.get("aliq_cbs") || ""),
    red_ibs: String(fd.get("red_ibs") || ""), red_cbs: String(fd.get("red_cbs") || ""),
    position: await nextPos("produto_rows", office.id),
  });
  revalidatePath("/ibs");
  redirect("/ibs?tab=produtos");
}

export async function addBatch(_p: IbsState, fd: FormData): Promise<IbsState> {
  const type = String(fd.get("type") || "cst");
  const rowsJson = String(fd.get("rowsJson") || "");
  const { office } = await getContext();
  const supabase = await createClient();
  if (type === "produto") {
    const rows = prodRows(rowsJson);
    if (!rows.length) return { error: "Nenhum registro reconhecido." };
    await supabase.from("produto_rows").insert(rows.map((r, i) => ({ office_id: office.id, ...r, position: i })));
    revalidatePath("/ibs");
    redirect("/ibs?tab=produtos");
  }
  const rows = codeRows(rowsJson);
  if (!rows.length) return { error: "Nenhum registro reconhecido." };
  const table = type === "cclass" ? "cclass_rows" : "cst_rows";
  await supabase.from(table).insert(rows.map((r, i) => ({ office_id: office.id, ...r, position: i })));
  revalidatePath("/ibs");
  redirect("/ibs?tab=dados");
}
