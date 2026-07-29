export type PartyAgg = { doc: string; nome: string; uf: string; count: number; total: number; temIbsCbs: boolean };

/**
 * Agrega notas por documento (CNPJ/CPF do emitente ou destinatário), somando
 * vNF e contando notas. Sem tabela própria — fornecedores/clientes são
 * sempre recalculados a partir de nfe_notes. Ordena por valor total desc.
 * temIbsCbs marca o fornecedor/cliente se QUALQUER uma das notas dele trouxer
 * o bloco <IBSCBS> em algum item.
 */
export function aggregateParties(rows: { doc: string; nome: string; uf: string; total: number; temIbsCbs: boolean }[]): PartyAgg[] {
  const map = new Map<string, PartyAgg>();
  for (const r of rows) {
    const cur = map.get(r.doc);
    if (cur) {
      cur.count += 1;
      cur.total += r.total;
      cur.temIbsCbs = cur.temIbsCbs || r.temIbsCbs;
    } else {
      map.set(r.doc, { doc: r.doc, nome: r.nome, uf: r.uf, count: 1, total: r.total, temIbsCbs: r.temIbsCbs });
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export const CONSUMIDOR_FINAL_DOC = "CONSUMIDOR_FINAL";
