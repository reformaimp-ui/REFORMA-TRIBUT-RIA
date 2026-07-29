import type { ExportNode, GroupExportData, LinkedItem } from "@/app/(app)/ibs/grupos-actions";
import { buildBrandedWorkbook, type TableColumn } from "@/lib/xlsxTemplate";

/** Exibição — não altera o dado salvo. Formata só quando há os 8 dígitos padrão. */
function formatNcm(raw: string): string {
  const d = raw.replace(/\D/g, "");
  return d.length === 8 ? `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}` : raw;
}

function itemCode(kind: "produto" | "servico", it: LinkedItem): string {
  const code = kind === "produto" ? formatNcm(it.code) : it.code;
  return kind === "servico" ? `NBS ${code}` : code;
}

const COLUMNS: TableColumn[] = [
  { header: "Grupo", key: "grupo", width: 30 },
  { header: "Código", key: "codigo", width: 16 },
  { header: "Descrição", key: "descr", width: 42 },
  { header: "CST", key: "cst", width: 8, align: "center" },
  { header: "cClassTrib", key: "cclass", width: 14, align: "center" },
  { header: "Alíq. IBS", key: "aliqIbs", width: 11, align: "center" },
  { header: "Alíq. CBS", key: "aliqCbs", width: 11, align: "center" },
  { header: "Red. IBS", key: "redIbs", width: 11, align: "center" },
  { header: "Red. CBS", key: "redCbs", width: 11, align: "center" },
  { header: "Categorias", key: "categorias", width: 24 },
  { header: "Observação", key: "obs", width: 40 },
];

function flatten(node: ExportNode, kind: "produto" | "servico", path: string[]): Record<string, string | number>[] {
  const here = [...path, node.name];
  const rows = node.items.map((it) => ({
    grupo: here.join(" › "),
    codigo: itemCode(kind, it),
    descr: it.descr,
    cst: it.cst,
    cclass: it.cclass,
    aliqIbs: it.aliqIbs,
    aliqCbs: it.aliqCbs,
    redIbs: it.redIbs,
    redCbs: it.redCbs,
    categorias: it.categories.map((c) => c.name).join(", "),
    obs: it.notes ?? "",
  }));
  return [...rows, ...node.children.flatMap((c) => flatten(c, kind, here))];
}

function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "grupo"
  );
}

/** Gera e baixa a planilha do ramo completo (grupo selecionado + todos os subgrupos), com o mesmo template padrão dos outros exports. */
export async function exportGroupXlsx(data: GroupExportData) {
  const rows = flatten(data.root, data.kind, []);
  const buf = await buildBrandedWorkbook([
    {
      sheetName: data.kind === "produto" ? "Produtos" : "Serviços",
      summary: [
        { label: "Escritório", value: data.officeName },
        { label: "Grupo", value: data.root.name },
        { label: "Tributações", value: rows.length },
      ],
      columns: COLUMNS,
      rows,
    },
  ]);
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `grupo-${slugify(data.root.name)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
