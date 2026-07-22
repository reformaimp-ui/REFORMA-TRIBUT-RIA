/**
 * Traduz os campos de redução (red_ibs/red_cbs) de um produto em uma frase
 * simples, para quem não entende de tributação — foco do portal de pesquisa
 * pública. Usa os percentuais que o escritório já cadastrou, não inventa
 * regra a partir do código do CST sozinho.
 */
export function friendlyTaxSummary(p: { red_ibs: string; red_cbs: string }): string {
  const pct = (s: string): number | null => {
    const n = parseFloat(String(s || "").replace(",", ".").replace("%", "").trim());
    return Number.isFinite(n) ? n : null;
  };
  const rIbs = pct(p.red_ibs);
  const rCbs = pct(p.red_cbs);
  const isFull = (n: number | null) => n !== null && n >= 99.5;
  const isZero = (n: number | null) => n === null || n <= 0.5;

  if (isFull(rIbs) && isFull(rCbs)) return "Isento — alíquota reduzida a zero";
  if (isZero(rIbs) && isZero(rCbs)) return "Tributação integral — sem redução de alíquota";
  if (p.red_ibs && p.red_ibs === p.red_cbs) return `Redução de ${p.red_ibs} na alíquota do IBS e do CBS`;

  const parts: string[] = [];
  if (p.red_ibs && !isZero(rIbs)) parts.push(`${p.red_ibs} no IBS`);
  if (p.red_cbs && !isZero(rCbs)) parts.push(`${p.red_cbs} no CBS`);
  return parts.length ? `Redução de alíquota: ${parts.join(" e ")}` : "Sem redução de alíquota cadastrada";
}
