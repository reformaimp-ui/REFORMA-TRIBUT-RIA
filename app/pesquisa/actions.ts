"use server";

import { createClient } from "@/lib/supabase/server";

export type ProdutoResult = {
  ncm: string;
  descr: string;
  cst: string;
  cstDescr: string;
  cclass: string;
  cclassDescr: string;
  aliq_ibs: string;
  aliq_cbs: string;
  red_ibs: string;
  red_cbs: string;
};

type RawRow = {
  ncm: string; ncm_digits?: string; descr: string; cst: string; cclass: string;
  aliq_ibs: string; aliq_cbs: string; red_ibs: string; red_cbs: string;
};

// Sem getContext() de propósito: quem chama aqui é um cliente de pesquisa
// (não tem linha em `members`) — o RLS (search_client_office_id) já restringe
// tudo ao escritório certo sozinho.
async function enrich(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: RawRow[],
): Promise<(ProdutoResult & { ncm_digits?: string })[]> {
  if (!rows.length) return [];
  const csts = Array.from(new Set(rows.map((r) => r.cst).filter(Boolean)));
  const cclasses = Array.from(new Set(rows.map((r) => r.cclass).filter(Boolean)));
  const [{ data: cstRows }, { data: cclassRows }] = await Promise.all([
    csts.length ? supabase.from("cst_rows").select("code,descr").in("code", csts) : Promise.resolve({ data: [] as { code: string; descr: string }[] }),
    cclasses.length ? supabase.from("cclass_rows").select("code,descr").in("code", cclasses) : Promise.resolve({ data: [] as { code: string; descr: string }[] }),
  ]);
  const cstMap = Object.fromEntries((cstRows ?? []).map((r) => [r.code, r.descr]));
  const cclassMap = Object.fromEntries((cclassRows ?? []).map((r) => [r.code, r.descr]));
  return rows.map((r) => ({ ...r, cstDescr: cstMap[r.cst] || "", cclassDescr: cclassMap[r.cclass] || "" }));
}

/** Busca por NCM (prefixo/substring, com ou sem pontuação) ou por descrição. */
export async function searchProdutoPublic(term: string): Promise<ProdutoResult[]> {
  const raw = term.trim().replace(/[,()]/g, "");
  if (!raw) return [];
  const digits = raw.replace(/\D/g, "");
  const supabase = await createClient();
  const patterns = [`ncm.ilike.%${raw}%`, `descr.ilike.%${raw}%`];
  if (digits && digits !== raw) patterns.push(`ncm_digits.ilike.${digits}%`);
  const { data } = await supabase
    .from("produto_rows")
    .select("ncm,descr,cst,cclass,aliq_ibs,aliq_cbs,red_ibs,red_cbs")
    .or(patterns.join(","))
    .limit(25);
  return enrich(supabase, (data ?? []) as RawRow[]);
}

export type ServicoResult = {
  item: string;
  nbs: string;
  nbs_descr: string;
  indop: string;
  local_ibs: string;
  cclass: string;
  cclass_nome: string;
  cst: string;
  cstDescr: string;
  red_ibs: string;
  red_cbs: string;
};

type RawServicoRow = {
  item: string; nbs: string; nbs_digits?: string; nbs_descr: string; indop: string; local_ibs: string; cclass: string; cclass_nome: string;
};

// CST e % de redução do serviço vêm do produto cadastrado com o mesmo
// cClassTrib — mesma lógica de derivação usada na tela interna (ibs/page.tsx).
async function enrichServico(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: RawServicoRow[],
): Promise<ServicoResult[]> {
  if (!rows.length) return [];
  const cclasses = Array.from(new Set(rows.map((r) => r.cclass).filter(Boolean)));
  const { data: prodRows } = cclasses.length
    ? await supabase.from("produto_rows").select("cclass,cst,red_ibs,red_cbs").in("cclass", cclasses)
    : { data: [] as { cclass: string; cst: string; red_ibs: string; red_cbs: string }[] };
  const byCclass: Record<string, { cst: string; red_ibs: string; red_cbs: string }> = {};
  for (const r of prodRows ?? []) if (!byCclass[r.cclass]) byCclass[r.cclass] = { cst: r.cst, red_ibs: r.red_ibs, red_cbs: r.red_cbs };
  const csts = Array.from(new Set(Object.values(byCclass).map((r) => r.cst).filter(Boolean)));
  const { data: cstRows } = csts.length
    ? await supabase.from("cst_rows").select("code,descr").in("code", csts)
    : { data: [] as { code: string; descr: string }[] };
  const cstMap = Object.fromEntries((cstRows ?? []).map((r) => [r.code, r.descr]));
  return rows.map((r) => {
    const ref = byCclass[r.cclass];
    return {
      item: r.item, nbs: r.nbs, nbs_descr: r.nbs_descr, indop: r.indop, local_ibs: r.local_ibs,
      cclass: r.cclass, cclass_nome: r.cclass_nome,
      cst: ref?.cst || "", cstDescr: ref?.cst ? cstMap[ref.cst] || "" : "",
      red_ibs: ref?.red_ibs || "", red_cbs: ref?.red_cbs || "",
    };
  });
}

/** Busca por NBS (prefixo/substring, com ou sem pontuação), Descrição NBS ou Descrição item. */
export async function searchServicoPublic(term: string): Promise<ServicoResult[]> {
  const raw = term.trim().replace(/[,()]/g, "");
  if (!raw) return [];
  const digits = raw.replace(/\D/g, "");
  const supabase = await createClient();
  const patterns = [`item.ilike.%${raw}%`, `nbs.ilike.%${raw}%`, `nbs_descr.ilike.%${raw}%`];
  if (digits && digits !== raw) patterns.push(`nbs_digits.ilike.${digits}%`);
  const { data } = await supabase
    .from("servico_rows")
    .select("item,nbs,nbs_descr,indop,local_ibs,cclass,cclass_nome")
    .or(patterns.join(","))
    .limit(25);
  return enrichServico(supabase, (data ?? []) as RawServicoRow[]);
}

/** Busca em lote: só aceita NCM (sem descrição), match exato por dígitos. */
export async function searchProdutosByNcmBatch(rawNcms: string[]): Promise<{ ncm: string; results: ProdutoResult[] }[]> {
  const digitsList = Array.from(new Set(rawNcms.map((n) => n.replace(/\D/g, "")).filter(Boolean)));
  if (!digitsList.length) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("produto_rows")
    .select("ncm,ncm_digits,descr,cst,cclass,aliq_ibs,aliq_cbs,red_ibs,red_cbs")
    .in("ncm_digits", digitsList);
  const rows = await enrich(supabase, (data ?? []) as RawRow[]);
  const byDigits = new Map<string, ProdutoResult[]>();
  for (const r of rows) {
    const key = r.ncm_digits ?? "";
    const arr = byDigits.get(key) ?? [];
    arr.push(r);
    byDigits.set(key, arr);
  }
  return rawNcms.map((raw) => ({ ncm: raw, results: byDigits.get(raw.replace(/\D/g, "")) ?? [] }));
}
