import jsPDF from "jspdf";
import QRCode from "qrcode";
import type { ExportNode, GroupExportData, LinkedItem } from "@/app/(app)/ibs/grupos-actions";
import type { NcmNode } from "@/app/(app)/ibs/actions";

const MARGIN = 40;
const ACCENT_RGB: [number, number, number] = [70, 83, 214];
const PURPLE_RGB: [number, number, number] = [124, 58, 237];
const TEAL_RGB: [number, number, number] = [14, 122, 111];
const DARK_RGB: [number, number, number] = [51, 54, 63];
const GRAY_RGB: [number, number, number] = [138, 141, 152];
const DIACRITICS = new RegExp("[̀-ͯ]", "g");
const SITE_URL = "https://www.imperform.online";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

/** Exibição — não altera o dado salvo. Formata só quando há os 8 dígitos padrão. */
function formatNcm(raw: string): string {
  const d = raw.replace(/\D/g, "");
  return d.length === 8 ? `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}` : raw;
}

function itemLabel(kind: "produto" | "servico", it: { code: string; descr: string }): string {
  const code = kind === "produto" ? formatNcm(it.code) : it.code;
  return `${kind === "servico" ? "NBS " : ""}${code} — ${it.descr}`;
}

function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(DIACRITICS, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "grupo"
  );
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mistura uma cor com branco — reproduz o efeito de "cor + alpha baixo sobre fundo claro" usado nos chips da tela. */
function tint(rgb: [number, number, number], amount: number): [number, number, number] {
  return rgb.map((c) => Math.round(c * amount + 255 * (1 - amount))) as [number, number, number];
}

/** Proporção do viewBox de /public/logo-pdf.svg (1746x687) — evita distorcer a marca, que não é quadrada. */
const LOGO_ASPECT = 1746 / 687;

/** Carrega /public/logo-pdf.svg (logo específica do PDF, não a do app) e converte para PNG — jsPDF não desenha SVG diretamente. */
async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Falha ao carregar a logo."));
      image.src = "/logo-pdf.svg";
    });
    const height = 400;
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

async function loadQrDataUrl(): Promise<string | null> {
  try {
    return await QRCode.toDataURL(SITE_URL, { margin: 1, width: 256, color: { dark: "#33363f", light: "#ffffff" } });
  } catch {
    return null;
  }
}

// ─────────────────────────── Layout em fluxo (chips que quebram linha) ───────────────────────────

type FlowItem = { width: number; height: number; draw: (doc: jsPDF, x: number, y: number) => void };

function layoutFlow(items: FlowItem[], maxWidth: number, gapX: number, gapY: number) {
  const rows: FlowItem[][] = [];
  let row: FlowItem[] = [];
  let rowWidth = 0;
  for (const it of items) {
    if (row.length && rowWidth + gapX + it.width > maxWidth) {
      rows.push(row);
      row = [];
      rowWidth = 0;
    }
    if (row.length) rowWidth += gapX;
    row.push(it);
    rowWidth += it.width;
  }
  if (row.length) rows.push(row);
  const rowHeight = items.length ? Math.max(...items.map((i) => i.height)) : 0;
  const height = rows.length ? rows.length * rowHeight + (rows.length - 1) * gapY : 0;
  return {
    height,
    render(doc: jsPDF, x0: number, y0: number) {
      let y = y0;
      for (const r of rows) {
        let x = x0;
        for (const it of r) {
          it.draw(doc, x, y);
          x += it.width + gapX;
        }
        y += rowHeight + gapY;
      }
    },
  };
}

const CHIP_H = 12.5;

function chipItem(doc: jsPDF, label: string, value: string, valueColor: [number, number, number] = DARK_RGB): FlowItem | null {
  if (!value) return null;
  const PAD_X = 5.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  const labelW = doc.getTextWidth(label + " ");
  doc.setFont("courier", "bold");
  doc.setFontSize(7.2);
  const valueW = doc.getTextWidth(value);
  const width = PAD_X * 2 + labelW + valueW;
  return {
    width,
    height: CHIP_H,
    draw(d, x, y) {
      d.setFillColor(245, 245, 243);
      d.roundedRect(x, y, width, CHIP_H, 2.5, 2.5, "F");
      d.setFont("helvetica", "bold");
      d.setFontSize(6);
      d.setTextColor(...GRAY_RGB);
      d.text(label, x + PAD_X, y + CHIP_H / 2 + 2.1);
      d.setFont("courier", "bold");
      d.setFontSize(7.2);
      d.setTextColor(...valueColor);
      d.text(value, x + PAD_X + labelW, y + CHIP_H / 2 + 2.2);
      d.setTextColor(0, 0, 0);
    },
  };
}

function categoryChipItem(doc: jsPDF, name: string, colorHex: string): FlowItem {
  const rgb = hexToRgb(colorHex);
  const bg = tint(rgb, 0.16);
  const PAD_X = 6;
  const DOT = 4;
  const H = 12.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  const textW = doc.getTextWidth(name);
  const width = PAD_X * 2 + DOT + 4 + textW;
  return {
    width,
    height: H,
    draw(d, x, y) {
      d.setFillColor(...bg);
      d.roundedRect(x, y, width, H, H / 2, H / 2, "F");
      d.setFillColor(...rgb);
      d.circle(x + PAD_X + DOT / 2, y + H / 2, DOT / 2, "F");
      d.setFont("helvetica", "bold");
      d.setFontSize(6.5);
      d.setTextColor(...rgb);
      d.text(name, x + PAD_X + DOT + 4, y + H / 2 + 2.3);
      d.setTextColor(0, 0, 0);
    },
  };
}

// ─────────────────────────── Card de tributação (espelha o card da tela) ───────────────────────────

const CARD_PAD = 8;
const SECTION_GAP = 5;

type CardLayout = {
  height: number;
  render: (doc: jsPDF, x: number, y: number, width: number) => void;
};

function buildItemCard(doc: jsPDF, kind: "produto" | "servico", item: LinkedItem, chain: NcmNode[] | undefined, innerWidth: number): CardLayout {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  const headerLines: string[] = doc.splitTextToSize(itemLabel(kind, item), innerWidth);

  const chips = [
    chipItem(doc, "CST", item.cst, ACCENT_RGB),
    chipItem(doc, "cClassTrib", item.cclass, PURPLE_RGB),
    chipItem(doc, "Alíq. IBS", item.aliqIbs),
    chipItem(doc, "Alíq. CBS", item.aliqCbs),
    chipItem(doc, "Red. IBS", item.redIbs, TEAL_RGB),
    chipItem(doc, "Red. CBS", item.redCbs, TEAL_RGB),
  ].filter((c): c is FlowItem => c !== null);
  const chipsFlow = chips.length ? layoutFlow(chips, innerWidth, 4.5, 4.5) : null;

  const catItems = item.categories.map((c) => categoryChipItem(doc, c.name, c.color));
  const catFlow = catItems.length ? layoutFlow(catItems, innerWidth, 4.5, 4.5) : null;

  let chainLines: string[] = [];
  if (chain?.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.3);
    const text = chain.map((n) => `${n.code} ${n.descr}`).join("  ›  ");
    chainLines = doc.splitTextToSize(text, innerWidth);
  }

  let notesLines: string[] = [];
  const hasNotes = !!item.notes?.trim();
  if (hasNotes) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.8);
    notesLines = doc.splitTextToSize(item.notes!.trim(), innerWidth - 12);
  }

  const headerH = headerLines.length * 11;
  const chipsH = chipsFlow ? SECTION_GAP + chipsFlow.height : 0;
  const catH = catFlow ? SECTION_GAP + catFlow.height : 0;
  const chainH = chainLines.length ? SECTION_GAP + chainLines.length * 9 : 0;
  const notesH = hasNotes ? SECTION_GAP + notesLines.length * 9 + 9 : 0;
  const height = CARD_PAD + headerH + chipsH + catH + chainH + notesH + CARD_PAD;

  return {
    height,
    render(d, x, y, width) {
      d.setFillColor(250, 250, 248);
      d.setDrawColor(231, 231, 227);
      d.setLineWidth(0.6);
      d.roundedRect(x, y, width, height, 4, 4, "FD");

      let cy = y + CARD_PAD;
      const cx = x + CARD_PAD;

      d.setFont("helvetica", "bold");
      d.setFontSize(9.5);
      d.setTextColor(...DARK_RGB);
      d.text(headerLines, cx, cy + 6.5);
      d.setTextColor(0, 0, 0);
      cy += headerH;

      if (chipsFlow) {
        cy += SECTION_GAP;
        chipsFlow.render(d, cx, cy);
        cy += chipsFlow.height;
      }

      if (catFlow) {
        cy += SECTION_GAP;
        catFlow.render(d, cx, cy);
        cy += catFlow.height;
      }

      if (chainLines.length) {
        cy += SECTION_GAP;
        d.setFont("helvetica", "normal");
        d.setFontSize(7.3);
        d.setTextColor(...GRAY_RGB);
        d.text(chainLines, cx, cy + 5.8);
        d.setTextColor(0, 0, 0);
        cy += chainLines.length * 9;
      }

      if (hasNotes) {
        cy += SECTION_GAP;
        const boxH = notesLines.length * 9 + 9;
        d.setFillColor(255, 255, 255);
        d.setDrawColor(226, 226, 222);
        d.setLineWidth(0.5);
        d.roundedRect(cx, cy, width - CARD_PAD * 2, boxH, 3, 3, "FD");
        d.setFont("helvetica", "italic");
        d.setFontSize(7.8);
        d.setTextColor(...DARK_RGB);
        d.text(notesLines, cx + 6, cy + 10);
        d.setTextColor(0, 0, 0);
      }
    },
  };
}

/** Gera e baixa o PDF do ramo completo (grupo selecionado + todos os subgrupos) no navegador. */
export async function exportGroupPdf(data: GroupExportData) {
  const [logoDataUrl, qrDataUrl] = await Promise.all([loadLogoDataUrl(), loadQrDataUrl()]);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const innerWidth = pageWidth - MARGIN * 2 - CARD_PAD * 2;
  let y = MARGIN;

  function ensureSpace(height: number) {
    if (y + height > pageHeight - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  }

  // Logo do Imperform, grande e sozinha (já carrega a marca), no canto superior esquerdo.
  const LOGO_HEIGHT = 60;
  const LOGO_WIDTH = LOGO_HEIGHT * LOGO_ASPECT;
  let leftY = MARGIN;
  if (logoDataUrl) doc.addImage(logoDataUrl, "PNG", MARGIN, leftY, LOGO_WIDTH, LOGO_HEIGHT);
  leftY += LOGO_HEIGHT + 14;

  // QR do site, no canto superior direito.
  const qrBlockWidth = 64;
  const qrX = pageWidth - MARGIN - qrBlockWidth;
  let qy = MARGIN;
  if (qrDataUrl) {
    const qrSize = 48;
    doc.addImage(qrDataUrl, "PNG", qrX + (qrBlockWidth - qrSize) / 2, qy, qrSize, qrSize);
    qy += qrSize + 5;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(140, 140, 140);
  doc.text("imperform.online", qrX + qrBlockWidth / 2, qy, { align: "center" });
  doc.setTextColor(0, 0, 0);

  y = Math.max(leftY, qy) + 12;
  doc.setDrawColor(226, 226, 222);
  doc.line(MARGIN, y, pageWidth - MARGIN, y);
  y += 20;

  // Cabeçalho do escritório, logo abaixo — mesmo padrão de antes.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const officeLines = doc.splitTextToSize(data.officeName, pageWidth - MARGIN * 2);
  doc.text(officeLines, MARGIN, y);
  y += officeLines.length * 16 + 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Gerado em ${formatDate(data.generatedAt)}`, MARGIN, y);
  doc.setTextColor(0, 0, 0);

  y += 24;

  function writeNode(node: ExportNode, depth: number, breadcrumb: string[]) {
    const path = [...breadcrumb, node.name];

    ensureSpace(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(depth === 0 ? 13 : 11);
    if (depth === 0) doc.setTextColor(0, 0, 0);
    else doc.setTextColor(...ACCENT_RGB);
    doc.text(path.join(" › "), MARGIN, y);
    doc.setTextColor(0, 0, 0);
    y += depth === 0 ? 18 : 15;

    if (node.notes && node.notes.trim()) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9.5);
      const lines = doc.splitTextToSize(node.notes.trim(), pageWidth - MARGIN * 2);
      ensureSpace(lines.length * 12 + 6);
      doc.text(lines, MARGIN, y);
      y += lines.length * 12 + 8;
    }

    if (node.items.length) {
      for (const item of node.items) {
        const chain = data.kind === "produto" ? data.chainsByCode[item.code] : undefined;
        const card = buildItemCard(doc, data.kind, item, chain, innerWidth);
        ensureSpace(card.height);
        card.render(doc, MARGIN, y, pageWidth - MARGIN * 2);
        y += card.height + 6;
      }
      y += 4;
    } else if (!node.children.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(160, 160, 160);
      doc.text("Nenhuma tributação vinculada.", MARGIN, y);
      doc.setTextColor(0, 0, 0);
      y += 16;
    }

    for (const child of node.children) writeNode(child, depth + 1, path);
  }

  writeNode(data.root, 0, []);
  doc.save(`grupo-${slugify(data.root.name)}.pdf`);
}
