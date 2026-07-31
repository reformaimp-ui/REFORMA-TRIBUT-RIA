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

export type ProductAgg = {
  nome: string;
  cfop: string;
  natOp: string;
  /** CNPJ/CPF da contraparte: emitente na compra, destinatário na venda. */
  partyDoc: string;
  partyNome: string;
  /** Chave de acesso da nota mais recente que trouxe este produto. */
  chave: string;
  /** Quantas notas distintas trouxeram este produto (chave === a última delas). */
  notas: number;
  count: number;
  total: number;
};

export type ProductRow = {
  nome: string;
  cfop: string;
  natOp: string;
  partyDoc: string;
  partyNome: string;
  chave: string;
  valor: number;
};

/**
 * Agrega itens de nota por nome do produto + CFOP + contraparte — o mesmo
 * produto com CFOPs diferentes vira linhas separadas de propósito (natureza da
 * operação distinta), e o mesmo produto vindo de fornecedores diferentes também,
 * pra manter o vínculo produto ↔ fornecedor/cliente visível.
 * Espera as linhas já ordenadas por data crescente: o natOp e a chave exibidos
 * são os do último item visto pra cada grupo, ou seja, os mais recentes.
 */
export function aggregateProducts(rows: ProductRow[]): ProductAgg[] {
  const map = new Map<string, ProductAgg>();
  const chavesPorGrupo = new Map<string, Set<string>>();
  for (const r of rows) {
    const key = `${r.nome}|${r.cfop}|${r.partyDoc}`;
    const chaves = chavesPorGrupo.get(key) ?? new Set<string>();
    if (r.chave) chaves.add(r.chave);
    chavesPorGrupo.set(key, chaves);

    const cur = map.get(key);
    if (cur) {
      cur.count += 1;
      cur.total += r.valor;
      cur.natOp = r.natOp;
      if (r.chave) cur.chave = r.chave;
      cur.notas = chaves.size;
    } else {
      map.set(key, {
        nome: r.nome,
        cfop: r.cfop,
        natOp: r.natOp,
        partyDoc: r.partyDoc,
        partyNome: r.partyNome,
        chave: r.chave,
        notas: chaves.size,
        count: 1,
        total: r.valor,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}
