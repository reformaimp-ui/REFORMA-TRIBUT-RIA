"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getContext } from "@/lib/data";
import { canDo } from "@/lib/permissions";

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
  const { office, member } = await getContext();
  if (!canDo(member, "ibs", "create")) return { error: "Você não tem permissão para isso." };
  const supabase = await createClient();
  await supabase.from("cst_rows").insert({ office_id: office.id, code, descr: String(fd.get("descr") || "").trim(), position: await nextPos("cst_rows", office.id) });
  revalidatePath("/ibs");
  redirect("/ibs");
}

export async function addCclass(_p: IbsState, fd: FormData): Promise<IbsState> {
  const code = String(fd.get("code") || "").trim();
  if (!code) return { error: "Informe o código." };
  const { office, member } = await getContext();
  if (!canDo(member, "ibs", "create")) return { error: "Você não tem permissão para isso." };
  const supabase = await createClient();
  await supabase.from("cclass_rows").insert({ office_id: office.id, code, descr: String(fd.get("descr") || "").trim(), position: await nextPos("cclass_rows", office.id) });
  revalidatePath("/ibs");
  redirect("/ibs?tab=dados");
}

export async function addProduto(_p: IbsState, fd: FormData): Promise<IbsState> {
  const ncm = String(fd.get("ncm") || "").trim();
  if (!ncm) return { error: "Informe o NCM." };
  const { office, member } = await getContext();
  if (!canDo(member, "ibs", "create")) return { error: "Você não tem permissão para isso." };
  const supabase = await createClient();
  const { error } = await supabase.from("produto_rows").upsert(
    {
      office_id: office.id, ncm, ncm_digits: onlyDigits(ncm), descr: String(fd.get("descr") || "").trim(),
      cst: String(fd.get("cst") || ""), cclass: String(fd.get("cclass") || ""),
      aliq_ibs: String(fd.get("aliq_ibs") || ""), aliq_cbs: String(fd.get("aliq_cbs") || ""),
      red_ibs: String(fd.get("red_ibs") || ""), red_cbs: String(fd.get("red_cbs") || ""),
      position: await nextPos("produto_rows", office.id),
    },
    { onConflict: "office_id,ncm,cst,cclass" },
  );
  if (error) return { error: error.message };
  revalidatePath("/ibs");
  redirect("/ibs?tab=produtos");
}

export async function addServico(_p: IbsState, fd: FormData): Promise<IbsState> {
  const nbs = String(fd.get("nbs") || "").trim();
  if (!nbs) return { error: "Informe o NBS." };
  const { office, member } = await getContext();
  if (!canDo(member, "ibs", "create")) return { error: "Você não tem permissão para isso." };
  const supabase = await createClient();
  const { error } = await supabase.from("servico_rows").upsert(
    {
      office_id: office.id, item_code: String(fd.get("item_code") || "").trim(), item: String(fd.get("item") || "").trim(),
      nbs, nbs_digits: onlyDigits(nbs), nbs_descr: String(fd.get("nbs_descr") || "").trim(),
      indop: String(fd.get("indop") || "").trim(), local_ibs: String(fd.get("local_ibs") || "").trim(),
      cclass: String(fd.get("cclass") || "").trim(), cclass_nome: String(fd.get("cclass_nome") || "").trim(),
      position: await nextPos("servico_rows", office.id),
    },
    { onConflict: "office_id,nbs,cclass" },
  );
  if (error) return { error: error.message };
  revalidatePath("/ibs");
  redirect("/ibs?tab=servicos");
}

export async function addCstLink(_p: IbsState, fd: FormData): Promise<IbsState> {
  const cst = String(fd.get("cst") || "").trim();
  const cclass = String(fd.get("cclass") || "").trim();
  if (!cst || !cclass) return { error: "Informe o CST e o cClassTrib." };
  const { office, member } = await getContext();
  if (!canDo(member, "ibs", "create")) return { error: "Você não tem permissão para isso." };
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
  const { office, member } = await getContext();
  if (!canDo(member, "ibs", "create")) return { inserted: 0, error: "Você não tem permissão para isso." };
  const supabase = await createClient();
  const oid = office.id;

  if (type === "produto") {
    // Chave real: um NCM pode ter várias tributações (CST/cClassTrib diferentes).
    const rows = dedupeBy(
      cells
        .map((c, i) => {
          const ncm = String(c[0] ?? "").trim();
          return {
            office_id: oid, ncm, ncm_digits: onlyDigits(ncm), descr: String(c[1] ?? "").trim(),
            cst: String(c[2] ?? "").trim(), cclass: String(c[3] ?? "").trim(),
            aliq_ibs: String(c[4] ?? "").trim(), aliq_cbs: String(c[5] ?? "").trim(),
            red_ibs: String(c[6] ?? "").trim(), red_cbs: String(c[7] ?? "").trim(),
            position: startPos + i,
          };
        })
        .filter((r) => r.ncm),
      (r) => `${r.ncm}|${r.cst}|${r.cclass}`,
    );
    if (!rows.length) return { inserted: 0 };
    const { error } = await supabase.from("produto_rows").upsert(rows, { onConflict: "office_id,ncm,cst,cclass" });
    return error ? { inserted: 0, error: error.message } : { inserted: rows.length };
  }

  if (type === "servico") {
    // Chave real: um NBS pode ter várias tributações (cClassTrib diferentes).
    const rows = dedupeBy(
      cells
        .map((c, i) => {
          const nbs = String(c[2] ?? "").trim();
          return {
            office_id: oid, item_code: String(c[0] ?? "").trim(), item: String(c[1] ?? "").trim(),
            nbs, nbs_digits: onlyDigits(nbs),
            nbs_descr: String(c[3] ?? "").trim(), indop: String(c[4] ?? "").trim(),
            local_ibs: String(c[5] ?? "").trim(), cclass: String(c[6] ?? "").trim(),
            cclass_nome: String(c[7] ?? "").trim(),
            position: startPos + i,
          };
        })
        .filter((r) => r.nbs),
      (r) => `${r.nbs}|${r.cclass}`,
    );
    if (!rows.length) return { inserted: 0 };
    const { error } = await supabase.from("servico_rows").upsert(rows, { onConflict: "office_id,nbs,cclass" });
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

  if (type === "ncm") {
    const rows = dedupeBy(
      cells
        .map((c, i) => {
          const code = String(c[0] ?? "").trim();
          return { office_id: oid, code, code_digits: onlyDigits(code), descr: String(c[1] ?? "").trim(), position: startPos + i };
        })
        .filter((r) => r.code_digits),
      (r) => r.code_digits,
    );
    if (!rows.length) return { inserted: 0 };
    const { error } = await supabase.from("ncm_rows").upsert(rows, { onConflict: "office_id,code_digits" });
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

export async function finishImport() {
  revalidatePath("/ibs");
}

export async function updateCst(id: string, code: string, descr: string): Promise<IbsState> {
  if (!id) return { error: "Linha inválida." };
  if (!code.trim()) return { error: "Informe o código." };
  const { member } = await getContext();
  if (!canDo(member, "ibs", "edit")) return { error: "Você não tem permissão para isso." };
  const supabase = await createClient();
  const { error } = await supabase.from("cst_rows").update({ code: code.trim(), descr: descr.trim() }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/ibs");
  return {};
}

export async function updateCclass(id: string, code: string, descr: string): Promise<IbsState> {
  if (!id) return { error: "Linha inválida." };
  if (!code.trim()) return { error: "Informe o código." };
  const { member } = await getContext();
  if (!canDo(member, "ibs", "edit")) return { error: "Você não tem permissão para isso." };
  const supabase = await createClient();
  const { error } = await supabase.from("cclass_rows").update({ code: code.trim(), descr: descr.trim() }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/ibs");
  return {};
}

export async function updateProduto(
  id: string,
  fields: { ncm: string; descr: string; cst: string; cclass: string; aliq_ibs: string; aliq_cbs: string; red_ibs: string; red_cbs: string },
): Promise<IbsState> {
  if (!id) return { error: "Linha inválida." };
  const ncm = fields.ncm.trim();
  if (!ncm) return { error: "Informe o NCM." };
  const { member } = await getContext();
  if (!canDo(member, "ibs", "edit")) return { error: "Você não tem permissão para isso." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("produto_rows")
    .update({
      ncm, ncm_digits: onlyDigits(ncm), descr: fields.descr.trim(),
      cst: fields.cst.trim(), cclass: fields.cclass.trim(),
      aliq_ibs: fields.aliq_ibs.trim(), aliq_cbs: fields.aliq_cbs.trim(),
      red_ibs: fields.red_ibs.trim(), red_cbs: fields.red_cbs.trim(),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/ibs");
  return {};
}

export async function updateServico(
  id: string,
  fields: { item_code: string; item: string; nbs: string; nbs_descr: string; indop: string; local_ibs: string; cclass: string; cclass_nome: string },
): Promise<IbsState> {
  if (!id) return { error: "Linha inválida." };
  const nbs = fields.nbs.trim();
  if (!nbs) return { error: "Informe o NBS." };
  const { member } = await getContext();
  if (!canDo(member, "ibs", "edit")) return { error: "Você não tem permissão para isso." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("servico_rows")
    .update({
      item_code: fields.item_code.trim(), item: fields.item.trim(),
      nbs, nbs_digits: onlyDigits(nbs), nbs_descr: fields.nbs_descr.trim(),
      indop: fields.indop.trim(), local_ibs: fields.local_ibs.trim(),
      cclass: fields.cclass.trim(), cclass_nome: fields.cclass_nome.trim(),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/ibs");
  return {};
}

export async function removeCst(fd: FormData) {
  const code = String(fd.get("code") || "");
  if (!code) return;
  const { member } = await getContext();
  if (!canDo(member, "ibs", "delete")) return;
  const supabase = await createClient();
  await supabase.from("cst_rows").delete().eq("code", code);
  revalidatePath("/ibs");
}

export async function removeCclass(fd: FormData) {
  const code = String(fd.get("code") || "");
  if (!code) return;
  const { member } = await getContext();
  if (!canDo(member, "ibs", "delete")) return;
  const supabase = await createClient();
  await supabase.from("cclass_rows").delete().eq("code", code);
  revalidatePath("/ibs");
}

export async function removeProduto(fd: FormData) {
  const ncm = String(fd.get("ncm") || "");
  if (!ncm) return;
  const cst = String(fd.get("cst") || "");
  const cclass = String(fd.get("cclass") || "");
  const { member } = await getContext();
  if (!canDo(member, "ibs", "delete")) return;
  const supabase = await createClient();
  await supabase.from("produto_rows").delete().eq("ncm", ncm).eq("cst", cst).eq("cclass", cclass);
  revalidatePath("/ibs");
}

export async function removeServico(fd: FormData) {
  const nbs = String(fd.get("nbs") || "");
  if (!nbs) return;
  const cclass = String(fd.get("cclass") || "");
  const { member } = await getContext();
  if (!canDo(member, "ibs", "delete")) return;
  const supabase = await createClient();
  await supabase.from("servico_rows").delete().eq("nbs", nbs).eq("cclass", cclass);
  revalidatePath("/ibs");
}

// ─────────────────────────── Árvore de NCM ───────────────────────────

function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}

export type NcmNode = { code: string; descr: string; digits: string };

/** Prefixos por requisição em getNcmChainsForCodes — abaixo do max_rows=1000. */
const NCM_PREFIX_CHUNK = 300;

// Estas leituras não chamam getContext() de propósito: getContext() faz 2 queries
// extras (members + offices) só para descobrir office_id, mas o RLS já filtra por
// tenant sozinho em qualquer select — cada chamada evitada corta uma volta ao banco.

function toNode(r: { code: string; descr: string; code_digits: string }): NcmNode {
  return { code: r.code, descr: r.descr, digits: r.code_digits };
}

/** Direto sobre um Map<código_completo, linha> já carregado — sem ida ao banco. */
function chainFromMap(digits: string, byDigits: Map<string, NcmNode>): NcmNode[] {
  const chain: NcmNode[] = [];
  for (let i = 1; i <= digits.length; i++) {
    const node = byDigits.get(digits.slice(0, i));
    if (node) chain.push(node);
  }
  return chain;
}

function directChildren(digits: string, all: NcmNode[]): NcmNode[] {
  const descendants = all.filter((r) => r.digits.length > digits.length && r.digits.startsWith(digits));
  if (!descendants.length) return [];
  const minLen = Math.min(...descendants.map((r) => r.digits.length));
  return descendants.filter((r) => r.digits.length === minLen);
}

/**
 * Cadeia de ancestrais (capítulo → posição → subposição → item) + subníveis
 * diretos de um único NCM, em 2 queries paralelas (1 round-trip lógico) em vez
 * de 2 chamadas de action separadas — é o que abre no clique/modal.
 */
export async function getNcmTree(rawCode: string): Promise<{ chain: NcmNode[]; children: NcmNode[] }> {
  const digits = onlyDigits(rawCode);
  if (!digits) return { chain: [], children: [] };
  const prefixes = Array.from({ length: digits.length }, (_, i) => digits.slice(0, i + 1));
  const supabase = await createClient();
  const [{ data: chainData }, { data: descData }] = await Promise.all([
    supabase.from("ncm_rows").select("code,descr,code_digits").in("code_digits", prefixes),
    supabase.from("ncm_rows").select("code,descr,code_digits").like("code_digits", `${digits}%`).order("code_digits").limit(2000),
  ]);
  const chain = (chainData ?? []).map(toNode).sort((a, b) => a.digits.length - b.digits.length);
  const children = directChildren(digits, (descData ?? []).map(toNode));
  return { chain, children };
}

/**
 * Cadeia de ancestrais para VÁRIOS NCMs de uma vez (usado para mostrar as
 * árvores já expandidas nos resultados da busca de produtos, sem precisar
 * abrir um modal por linha) — 1 query cobrindo todos os prefixos de todos os
 * códigos, em vez de N chamadas.
 */
export async function getNcmChainsForCodes(rawCodes: string[]): Promise<Record<string, NcmNode[]>> {
  const digitsList = Array.from(new Set(rawCodes.map(onlyDigits).filter(Boolean)));
  if (!digitsList.length) return {};
  const prefixSet = new Set<string>();
  for (const d of digitsList) for (let i = 1; i <= d.length; i++) prefixSet.add(d.slice(0, i));
  const prefixes = Array.from(prefixSet);
  const supabase = await createClient();

  // Um único .in() com todos os prefixos quebra em exportações grandes: o filtro
  // vai na URL (estoura o limite de tamanho do gateway) e a resposta é cortada
  // pelo max_rows=1000 do PostgREST. Em ambos os casos a cadeia voltava vazia e
  // as colunas Capítulo/Posição/Subposição saíam "—". Fatiamos em lotes menores
  // que o max_rows e propagamos erro em vez de devolver árvore vazia em silêncio.
  const rows: { code: string; descr: string; code_digits: string }[] = [];
  for (let i = 0; i < prefixes.length; i += NCM_PREFIX_CHUNK) {
    const chunk = prefixes.slice(i, i + NCM_PREFIX_CHUNK);
    const { data, error } = await supabase.from("ncm_rows").select("code,descr,code_digits").in("code_digits", chunk);
    if (error) throw new Error(`Falha ao carregar a árvore de NCM: ${error.message}`);
    rows.push(...(data ?? []));
  }

  const byDigits = new Map(rows.map(toNode).map((n) => [n.digits, n]));
  const result: Record<string, NcmNode[]> = {};
  for (const rawCode of rawCodes) {
    const d = onlyDigits(rawCode);
    result[rawCode] = d ? chainFromMap(d, byDigits) : [];
  }
  return result;
}

/** Busca por código (prefixo) ou descrição (substring), até 30 resultados. */
export async function searchNcm(term: string): Promise<NcmNode[]> {
  const q = term.trim().replace(/[,()]/g, "");
  if (!q) return [];
  const digits = onlyDigits(q);
  const supabase = await createClient();
  const { data } = await supabase
    .from("ncm_rows")
    .select("code,descr,code_digits")
    .or(`code_digits.like.${digits || q}%,descr.ilike.%${q}%`)
    .order("code_digits")
    .limit(30);
  return (data ?? []).map(toNode);
}
