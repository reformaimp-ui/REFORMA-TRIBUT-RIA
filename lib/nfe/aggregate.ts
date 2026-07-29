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

export type ProductAgg = { nome: string; cfop: string; natOp: string; count: number; total: number };

/**
 * Agrega itens de nota por nome do produto + CFOP — o mesmo produto com CFOPs
 * diferentes vira linhas separadas de propósito (natureza da operação distinta).
 * Espera as linhas já ordenadas por data crescente: o natOp exibido é o do
 * último item visto pra cada chave, ou seja, o mais recente.
 */
export function aggregateProducts(rows: { nome: string; cfop: string; natOp: string; valor: number }[]): ProductAgg[] {
  const map = new Map<string, ProductAgg>();
  for (const r of rows) {
    const key = `${r.nome}|${r.cfop}`;
    const cur = map.get(key);
    if (cur) {
      cur.count += 1;
      cur.total += r.valor;
      cur.natOp = r.natOp;
    } else {
      map.set(key, { nome: r.nome, cfop: r.cfop, natOp: r.natOp, count: 1, total: r.valor });
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}
