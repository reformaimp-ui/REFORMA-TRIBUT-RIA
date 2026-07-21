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

export async function addCstLink(_p: IbsState, fd: FormData): Promise<IbsState> {
  const cst = String(fd.get("cst") || "").trim();
  const cclass = String(fd.get("cclass") || "").trim();
  if (!cst || !cclass) return { error: "Informe o CST e o cClassTrib." };
  const { office } = await getContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("cst_cclass_links")
    .upsert(
      { office_id: office.id, cst, cclass, position: await nextPos("cst_cclass_links", office.id) },
      { onConflict: "office_id,cst,cclass", ignoreDuplicates: true },
    );
  if (error) return { error: error.message };
  revalidatePath("/ibs");
  redirect("/ibs?tab=dados");
}

export type ImportResult = { inserted: number; error?: string };

// Remove duplicatas dentro do mesmo lote (o upsert não pode afetar a mesma linha 2x),
// mantendo a última ocorrência da chave.
function dedupeBy<T>(rows: T[], key: (r: T) => string): T[] {
  const map = new Map<string, T>();
  for (const r of rows) map.set(key(r), r);
  return [...map.values()];
}

/**
 * Importa um lote (chunk) de linhas já parseadas no client. Chamada em loop pelo
 * ImportPanel — cada chamada carrega ~500 linhas, muito abaixo do limite de 1MB do
 * Server Action. Usa upsert (idempotente) para permitir reimportar sem duplicar.
 * `startPos` preserva a ordenação contínua entre lotes.
 */
export async function importChunk(type: string, cells: string[][], startPos: number): Promise<ImportResult> {
  if (!Array.isArray(cells) || !cells.length) return { inserted: 0 };
  const { office } = await getContext();
  const supabase = await createClient();
  const oid = office.id;

  if (type === "produto") {
    const rows = dedupeBy(
      cells
        .map((c, i) => ({
          office_id: oid, ncm: String(c[0] ?? "").trim(), descr: String(c[1] ?? "").trim(),
          cst: String(c[2] ?? "").trim(), cclass: String(c[3] ?? "").trim(),
          aliq_ibs: String(c[4] ?? "").trim(), aliq_cbs: String(c[5] ?? "").trim(),
          red_ibs: String(c[6] ?? "").trim(), red_cbs: String(c[7] ?? "").trim(),
          position: startPos + i,
        }))
        .filter((r) => r.ncm),
      (r) => r.ncm,
    );
    if (!rows.length) return { inserted: 0 };
    const { error } = await supabase.from("produto_rows").upsert(rows, { onConflict: "office_id,ncm" });
    return error ? { inserted: 0, error: error.message } : { inserted: rows.length };
  }

  if (type === "vinculo") {
    const rows = dedupeBy(
      cells
        .map((c, i) => ({ office_id: oid, cst: String(c[0] ?? "").trim(), cclass: String(c[1] ?? "").trim(), position: startPos + i }))
        .filter((r) => r.cst && r.cclass),
      (r) => `${r.cst}|${r.cclass}`,
    );
    if (!rows.length) return { inserted: 0 };
    const { error } = await supabase
      .from("cst_cclass_links")
      .upsert(rows, { onConflict: "office_id,cst,cclass", ignoreDuplicates: true });
    return error ? { inserted: 0, error: error.message } : { inserted: rows.length };
  }

  // cst | cclass
  const table = type === "cclass" ? "cclass_rows" : "cst_rows";
  const rows = dedupeBy(
    cells
      .map((c, i) => ({ office_id: oid, code: String(c[0] ?? "").trim(), descr: String(c[1] ?? "").trim(), position: startPos + i }))
      .filter((r) => r.code),
    (r) => r.code,
  );
  if (!rows.length) return { inserted: 0 };
  const { error } = await supabase.from(table).upsert(rows, { onConflict: "office_id,code" });
  return error ? { inserted: 0, error: error.message } : { inserted: rows.length };
}

export async function finishImport(tab: "dados" | "produtos") {
  revalidatePath("/ibs");
  redirect(`/ibs?tab=${tab}`);
}
