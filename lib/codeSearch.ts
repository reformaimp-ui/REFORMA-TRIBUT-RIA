/**
 * Monta os padrões OR do PostgREST para buscar NCM/NBS aceitando o código com
 * ou sem pontuação (ex: "1201.90.00" e "12019000" encontram o mesmo resultado).
 * `digitsCol` é a coluna auxiliar só com dígitos (ncm_digits/nbs_digits),
 * mantida em sincronia com o código em cada insert/import.
 */
export function codeSearchPatterns(term: string, codeCol: string, digitsCol: string, otherCols: string[] = []): string {
  const raw = term.trim().replace(/[,()]/g, "");
  const digits = raw.replace(/\D/g, "");
  const like = `%${raw}%`;
  const patterns = [`${codeCol}.ilike.${like}`, ...otherCols.map((c) => `${c}.ilike.${like}`)];
  if (digits && digits !== raw) patterns.push(`${digitsCol}.ilike.${digits}%`);
  return patterns.join(",");
}
