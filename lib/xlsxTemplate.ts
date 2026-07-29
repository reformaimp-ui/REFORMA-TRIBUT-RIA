import ExcelJS from "exceljs";

/**
 * Template padrão das planilhas geradas pelo sistema — mesma identidade visual
 * do PDF (lib/groupPdf.ts): logo do Imperform, azul da marca no cabeçalho da
 * tabela, linhas zebradas. Roda só no client (usa <canvas>/<img> pra rasterizar
 * a logo), então todo caller precisa ser um Client Component.
 */

const ACCENT_ARGB = "FF4653D6";
const DARK_ARGB = "FF33363F";
const GRAY_ARGB = "FF8A8D98";
const ZEBRA_ARGB = "FFF7F7F5";
const BORDER_ARGB = "FFE7E7E3";

const LOGO_ASPECT = 1746 / 687;
const BORDER_SIDE: Partial<ExcelJS.Border> = { style: "thin", color: { argb: BORDER_ARGB } };

async function loadLogoBase64(): Promise<string | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Falha ao carregar a logo."));
      image.src = "/logo-pdf.svg";
    });
    const height = 160;
    const width = Math.round(height * LOGO_ASPECT);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export type TableColumn = {
  header: string;
  key: string;
  width: number;
  numFmt?: string;
  align?: "left" | "right" | "center";
};

export type BrandedSheetSpec = {
  sheetName: string;
  summary: { label: string; value: string | number; numFmt?: string }[];
  columns: TableColumn[];
  rows: Record<string, string | number>[];
};

function writeBrandedSheet(wb: ExcelJS.Workbook, spec: BrandedSheetSpec, logoImageId: number | null) {
  const sheet = wb.addWorksheet(spec.sheetName, { views: [{ showGridLines: false }] });
  sheet.columns = spec.columns.map((c) => ({ key: c.key, width: c.width }));

  let row = 1;
  if (logoImageId !== null) {
    const logoWidth = 120;
    sheet.addImage(logoImageId, { tl: { col: 0, row: 0 }, ext: { width: logoWidth, height: logoWidth / LOGO_ASPECT } });
    row += 2;
  }

  for (const s of spec.summary) {
    const r = sheet.getRow(row);
    r.getCell(1).value = s.label;
    r.getCell(1).font = { bold: true, size: 9, color: { argb: GRAY_ARGB } };
    const valueCell = r.getCell(2);
    valueCell.value = s.value;
    valueCell.font = { bold: true, size: 11, color: { argb: DARK_ARGB } };
    if (s.numFmt) valueCell.numFmt = s.numFmt;
    row += 1;
  }
  row += 1;

  const headerRowNum = row;
  const headerRow = sheet.getRow(row);
  spec.columns.forEach((c, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = c.header;
    cell.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT_ARGB } };
    cell.alignment = { vertical: "middle", horizontal: c.align ?? "left" };
    cell.border = { top: BORDER_SIDE, bottom: BORDER_SIDE, left: BORDER_SIDE, right: BORDER_SIDE };
  });
  headerRow.height = 20;
  row += 1;

  for (const dataRow of spec.rows) {
    const r = sheet.getRow(row);
    const zebra = (row - headerRowNum) % 2 === 0;
    spec.columns.forEach((c, i) => {
      const cell = r.getCell(i + 1);
      cell.value = dataRow[c.key] ?? "";
      cell.font = { size: 10, color: { argb: DARK_ARGB } };
      cell.alignment = { vertical: "middle", horizontal: c.align ?? "left" };
      if (c.numFmt) cell.numFmt = c.numFmt;
      cell.border = { bottom: BORDER_SIDE };
      if (zebra) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA_ARGB } };
    });
    row += 1;
  }

  // Botões de filtro/ordenação nativos do Excel na linha de cabeçalho — sem usar
  // uma Tabela (ListObject) do Excel, que forçaria um tema de cor pronto por
  // cima do azul da marca em vez da cor exata que definimos acima.
  sheet.autoFilter = {
    from: { row: headerRowNum, column: 1 },
    to: { row: Math.max(headerRowNum, row - 1), column: spec.columns.length },
  };

  sheet.views = [{ state: "frozen", ySplit: headerRowNum, showGridLines: false }];
}

/** Monta o workbook com a identidade visual padrão e devolve o buffer pronto pra baixar. */
export async function buildBrandedWorkbook(sheets: BrandedSheetSpec[]): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Imperform";
  wb.created = new Date();

  const logoBase64 = await loadLogoBase64();
  const logoImageId = logoBase64 ? wb.addImage({ base64: logoBase64, extension: "png" }) : null;

  for (const spec of sheets) writeBrandedSheet(wb, spec, logoImageId);

  return wb.xlsx.writeBuffer();
}
