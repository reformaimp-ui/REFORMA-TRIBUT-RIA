import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import type { ExportNode, GroupExportData, LinkedItem } from "@/app/(app)/ibs/grupos-actions";

const MARGIN = 40;
const ACCENT_RGB: [number, number, number] = [70, 83, 214];
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

function itemDetails(it: LinkedItem): string {
  const parts = [`CST ${it.cst || "—"}`, `cClassTrib ${it.cclass || "—"}`];
  if (it.aliqIbs || it.aliqCbs) parts.push(`Alíq. IBS ${it.aliqIbs || "—"}`, `Alíq. CBS ${it.aliqCbs || "—"}`);
  parts.push(`Red. IBS ${it.redIbs || "—"}`, `Red. CBS ${it.redCbs || "—"}`);
  return parts.join(" · ");
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

/** Gera e baixa o PDF do ramo completo (grupo selecionado + todos os subgrupos) no navegador. */
export async function exportGroupPdf(data: GroupExportData) {
  const [logoDataUrl, qrDataUrl] = await Promise.all([loadLogoDataUrl(), loadQrDataUrl()]);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
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

  const codeHeader = data.kind === "produto" ? "NCM" : "NBS";

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
      ensureSpace(40);
      autoTable(doc, {
        startY: y,
        head: [[codeHeader, "Detalhes", "Observação"]],
        body: node.items.map((it) => {
          const code = data.kind === "produto" ? formatNcm(it.code) : it.code;
          return [`${code} — ${it.descr}`, itemDetails(it), it.notes || ""];
        }),
        margin: { left: MARGIN, right: MARGIN },
        styles: { fontSize: 9, cellPadding: 5, valign: "top" },
        headStyles: { fillColor: ACCENT_RGB },
        theme: "striped",
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
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
