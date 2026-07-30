"use server";

import { createClient } from "@/lib/supabase/server";
import { getContext } from "@/lib/data";
import { buildBrandedWorkbook, type BrandedSheetSpec, type TableColumn } from "@/lib/xlsxTemplate";
import { getNcmChainsForCodes, type NcmNode } from "@/app/(app)/ibs/actions";

export type FilterState = {
  cst: string[];
  cclass: string[];
  aliqIbs: string[];
  aliqCbs: string[];
  redIbs: string[];
  redCbs: string[];
  types: string[];
};

export async function fetchCstOptions() {
  const { office } = await getContext();
  const supabase = await createClient();
  const { data } = await supabase
    .from("cst_rows")
    .select("code,descr")
    .eq("office_id", office.id)
    .order("position");
  return data ?? [];
}

export async function fetchCclassOptions() {
  const { office } = await getContext();
  const supabase = await createClient();
  const { data } = await supabase
    .from("cclass_rows")
    .select("code,descr")
    .eq("office_id", office.id)
    .order("position");
  return data ?? [];
}

export async function fetchAliquotaOptions() {
  const { office } = await getContext();
  const supabase = await createClient();

  // Buscar valores únicos de alíquotas de produtos
  const { data: prodData } = await supabase
    .from("produto_rows")
    .select("aliq_ibs,aliq_cbs,red_ibs,red_cbs")
    .eq("office_id", office.id)
    .not("aliq_ibs", "is", null);

  // Buscar valores únicos de reduções de serviços
  const { data: servData } = await supabase
    .from("servico_rows")
    .select("cclass")
    .eq("office_id", office.id);

  const aliqIbsSet = new Set<string>();
  const aliqCbsSet = new Set<string>();
  const redIbsSet = new Set<string>();
  const redCbsSet = new Set<string>();

  // Processar produtos
  if (prodData) {
    for (const p of prodData) {
      if (p.aliq_ibs) aliqIbsSet.add(String(p.aliq_ibs));
      if (p.aliq_cbs) aliqCbsSet.add(String(p.aliq_cbs));
      if (p.red_ibs) redIbsSet.add(String(p.red_ibs));
      if (p.red_cbs) redCbsSet.add(String(p.red_cbs));
    }
  }

  return {
    aliqIbs: Array.from(aliqIbsSet).sort((a, b) => parseFloat(a) - parseFloat(b)),
    aliqCbs: Array.from(aliqCbsSet).sort((a, b) => parseFloat(a) - parseFloat(b)),
    redIbs: Array.from(redIbsSet).sort((a, b) => parseFloat(a) - parseFloat(b)),
    redCbs: Array.from(redCbsSet).sort((a, b) => parseFloat(a) - parseFloat(b)),
  };
}

export async function fetchFilteredData(filters: FilterState) {
  const { office } = await getContext();
  const supabase = await createClient();

  const result: { produtos: any[]; servicos: any[] } = { produtos: [], servicos: [] };

  // Fetch produtos
  if (filters.types.includes("produtos")) {
    let query = supabase
      .from("produto_rows")
      .select("id,ncm,descr,cst,cclass,aliq_ibs,aliq_cbs,red_ibs,red_cbs")
      .eq("office_id", office.id);

    if (filters.cst.length > 0) query = query.in("cst", filters.cst);
    if (filters.cclass.length > 0) query = query.in("cclass", filters.cclass);

    const { data: prodData } = await query;
    result.produtos = (prodData ?? []).filter((p) => {
      // Filtrar por alíquotas
      if (filters.aliqIbs.length > 0 && !filters.aliqIbs.includes(p.aliq_ibs || "")) return false;
      if (filters.aliqCbs.length > 0 && !filters.aliqCbs.includes(p.aliq_cbs || "")) return false;
      if (filters.redIbs.length > 0 && !filters.redIbs.includes(p.red_ibs || "")) return false;
      if (filters.redCbs.length > 0 && !filters.redCbs.includes(p.red_cbs || "")) return false;
      return true;
    });
  }

  // Fetch serviços
  if (filters.types.includes("servicos")) {
    let query = supabase
      .from("servico_rows")
      .select("id,nbs,nbs_descr,item,indop,local_ibs,cclass,cclass_nome")
      .eq("office_id", office.id);

    if (filters.cclass.length > 0) query = query.in("cclass", filters.cclass);

    const { data: servData } = await query;
    result.servicos = servData ?? [];
  }

  return result;
}

const PRODUTO_COLUMNS: TableColumn[] = [
  { header: "NCM", key: "ncm", width: 12, align: "center" },
  { header: "Descrição", key: "descr", width: 40 },
  { header: "Capítulo", key: "capitulo", width: 34 },
  { header: "Posição", key: "posicao", width: 34 },
  { header: "Subposição", key: "subposicao", width: 34 },
  { header: "CST", key: "cst", width: 10, align: "center" },
  { header: "cClassTrib", key: "cclass", width: 14, align: "center" },
  { header: "Alíq. IBS (%)", key: "aliq_ibs", width: 12, align: "right" },
  { header: "Alíq. CBS (%)", key: "aliq_cbs", width: 12, align: "right" },
  { header: "Red. IBS (%)", key: "red_ibs", width: 12, align: "right" },
  { header: "Red. CBS (%)", key: "red_cbs", width: 12, align: "right" },
];

// Estrutura oficial do NCM: capítulo (2 dígitos) → posição (4) → subposição (6)
// → item (8, é o próprio NCM). getNcmChainsForCodes só retorna os prefixos que
// de fato existem em ncm_rows, então localizamos cada nível pelo tamanho do
// código em vez de assumir uma posição fixa no array.
function nodeAtLevel(chain: NcmNode[], digitsLen: number): NcmNode | undefined {
  return chain.find((n) => n.digits.length === digitsLen);
}

function levelLabel(node: NcmNode | undefined): string {
  return node ? `${node.code} — ${node.descr}` : "—";
}

const SERVICO_COLUMNS: TableColumn[] = [
  { header: "NBS", key: "nbs", width: 12, align: "center" },
  { header: "Item", key: "item", width: 16, align: "center" },
  { header: "Descrição", key: "nbs_descr", width: 40 },
  { header: "INDOP", key: "indop", width: 12, align: "center" },
  { header: "Local IBS", key: "local_ibs", width: 14, align: "center" },
  { header: "cClassTrib", key: "cclass", width: 14, align: "center" },
];

export async function buildExportSheets(data: { produtos: any[]; servicos: any[] }): Promise<BrandedSheetSpec[]> {
  const sheets: BrandedSheetSpec[] = [];

  if (data.produtos.length > 0) {
    const chainsByNcm = await getNcmChainsForCodes(data.produtos.map((p) => p.ncm));
    sheets.push({
      sheetName: "Produtos (NCM)",
      summary: [
        { label: "Total de registros", value: data.produtos.length },
        { label: "Período", value: new Date().toLocaleDateString("pt-BR") },
      ],
      columns: PRODUTO_COLUMNS,
      rows: data.produtos.map((p) => {
        const chain = chainsByNcm[p.ncm] ?? [];
        return {
          ncm: p.ncm,
          descr: p.descr || "",
          capitulo: levelLabel(nodeAtLevel(chain, 2)),
          posicao: levelLabel(nodeAtLevel(chain, 4)),
          subposicao: levelLabel(nodeAtLevel(chain, 6)),
          cst: p.cst || "",
          cclass: p.cclass || "",
          aliq_ibs: p.aliq_ibs || "—",
          aliq_cbs: p.aliq_cbs || "—",
          red_ibs: p.red_ibs || "—",
          red_cbs: p.red_cbs || "—",
        };
      }),
    });
  }

  if (data.servicos.length > 0) {
    sheets.push({
      sheetName: "Serviços (NBS)",
      summary: [
        { label: "Total de registros", value: data.servicos.length },
        { label: "Período", value: new Date().toLocaleDateString("pt-BR") },
      ],
      columns: SERVICO_COLUMNS,
      rows: data.servicos.map((s) => ({
        nbs: s.nbs,
        item: s.item || "",
        nbs_descr: s.nbs_descr || "",
        indop: s.indop || "—",
        local_ibs: s.local_ibs || "—",
        cclass: s.cclass || "",
      })),
    });
  }

  return sheets;
}

export async function downloadExportXlsx(filters: FilterState) {
  const { member } = await getContext();
  if (member.role !== "admin") throw new Error("Acesso negado");

  const data = await fetchFilteredData(filters);
  const sheets = await buildExportSheets(data);

  if (sheets.length === 0) {
    throw new Error("Nenhum dado encontrado para exportação");
  }

  const buf = await buildBrandedWorkbook(sheets);
  return buf;
}
