import { XMLParser } from "fast-xml-parser";
import { z } from "zod";

/**
 * Parser puro (sem dependência de Supabase) — roda tanto no client (preview
 * antes de confirmar o import) quanto no server (Server Action, fonte da
 * verdade para o que é persistido).
 */

export type ParsedNfe = {
  chave: string;
  mod: "55" | "65";
  numero: string;
  serie: string;
  dataEmissao: string | null;
  naturezaOperacao: string;
  emitDocumento: string;
  emitNome: string;
  emitFantasia: string | null;
  emitUf: string;
  emitMunicipio: string;
  destDocumento: string | null;
  destNome: string | null;
  destUf: string | null;
  destMunicipio: string | null;
  valorProdutos: number | null;
  valorDesconto: number | null;
  valorFrete: number | null;
  valorIcms: number | null;
  valorPis: number | null;
  valorCofins: number | null;
  valorIbs: number | null;
  valorCbs: number | null;
  valorTotal: number;
  temIbsCbs: boolean;
  itens: ParsedNfeItem[];
};

export type ParsedNfeItem = { nome: string; valor: number; cfop: string };

export type ParseNfeResult = { ok: true; data: ParsedNfe } | { ok: false; error: string };

// parseTagValue: false é essencial — a chave de acesso e o CNPJ são strings numéricas
// longas; o parser converteria pra Number por padrão, e a chave (44 dígitos) estoura
// Number.MAX_SAFE_INTEGER, virando notação científica e perdendo dígitos.
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", trimValues: true, parseTagValue: false });

const ParsedNfeSchema = z.object({
  chave: z.string().regex(/^\d{44}$/, "Chave de acesso inválida — deve ter 44 dígitos."),
  mod: z.enum(["55", "65"]),
  numero: z.string(),
  serie: z.string(),
  dataEmissao: z.string().nullable(),
  naturezaOperacao: z.string(),
  emitDocumento: z.string().min(11, "CNPJ/CPF do emitente não encontrado."),
  emitNome: z.string().min(1, "Nome (razão social) do emitente não encontrado."),
  emitFantasia: z.string().nullable(),
  emitUf: z.string(),
  emitMunicipio: z.string(),
  destDocumento: z.string().nullable(),
  destNome: z.string().nullable(),
  destUf: z.string().nullable(),
  destMunicipio: z.string().nullable(),
  valorProdutos: z.number().nullable(),
  valorDesconto: z.number().nullable(),
  valorFrete: z.number().nullable(),
  valorIcms: z.number().nullable(),
  valorPis: z.number().nullable(),
  valorCofins: z.number().nullable(),
  valorIbs: z.number().nullable(),
  valorCbs: z.number().nullable(),
  valorTotal: z.number({ invalid_type_error: "Valor total da nota (vNF) não encontrado." }),
  temIbsCbs: z.boolean(),
  itens: z.array(z.object({ nome: z.string(), valor: z.number(), cfop: z.string() })),
});

/** Busca uma chave em qualquer profundidade da árvore parseada — tolera as
 * variações de envelope do XML (nfeProc > NFe > infNFe, NFe > infNFe, ou infNFe solto). */
function deepFind(obj: unknown, key: string): unknown {
  if (obj == null || typeof obj !== "object") return undefined;
  if (!Array.isArray(obj) && key in (obj as Record<string, unknown>)) return (obj as Record<string, unknown>)[key];
  const values = Array.isArray(obj) ? obj : Object.values(obj as Record<string, unknown>);
  for (const v of values) {
    if (v && typeof v === "object") {
      const found = deepFind(v, key);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

function str(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function numOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
}

/** Verifica se algum item (<det><imposto>) traz o bloco <IBSCBS> — não importa
 * o conteúdo, só a presença da tag, que é o que o usuário quer sinalizar. */
function hasIbsCbs(infNFe: Record<string, unknown>): boolean {
  const det = infNFe.det;
  if (!det) return false;
  const items = Array.isArray(det) ? det : [det];
  return items.some((item) => {
    if (!item || typeof item !== "object") return false;
    const imposto = (item as Record<string, unknown>).imposto as Record<string, unknown> | undefined;
    return !!imposto && imposto.IBSCBS != null;
  });
}

/** Extrai nome, valor líquido de desconto e CFOP de cada item (<det><prod>). */
function extractItems(infNFe: Record<string, unknown>): ParsedNfeItem[] {
  const det = infNFe.det;
  if (!det) return [];
  const items = Array.isArray(det) ? det : [det];
  return items.flatMap((item): ParsedNfeItem[] => {
    if (!item || typeof item !== "object") return [];
    const prod = (item as Record<string, unknown>).prod as Record<string, unknown> | undefined;
    if (!prod) return [];
    const nome = str(prod.xProd);
    if (!nome) return [];
    const vProd = numOrNull(prod.vProd) ?? 0;
    const vDesc = numOrNull(prod.vDesc) ?? 0;
    return [{ nome, valor: vProd - vDesc, cfop: str(prod.CFOP) }];
  });
}

export function parseNfeXml(xmlText: string): ParseNfeResult {
  let root: unknown;
  try {
    root = parser.parse(xmlText);
  } catch {
    return { ok: false, error: "XML inválido — não foi possível ler o arquivo." };
  }

  const infNFe = deepFind(root, "infNFe") as Record<string, unknown> | undefined;
  if (!infNFe || typeof infNFe !== "object") {
    return { ok: false, error: "Tag <infNFe> não encontrada — não parece ser um XML de NF-e/NFC-e." };
  }

  const ide = infNFe.ide as Record<string, unknown> | undefined;
  const emit = infNFe.emit as Record<string, unknown> | undefined;
  const total = infNFe.total as Record<string, unknown> | undefined;
  const icmsTot = total?.ICMSTot as Record<string, unknown> | undefined;

  if (!ide) return { ok: false, error: "Tag <ide> não encontrada no XML." };
  if (!emit) return { ok: false, error: "Tag <emit> (emitente) não encontrada no XML." };
  if (!icmsTot) return { ok: false, error: "Tag <ICMSTot> não encontrada no XML." };

  const mod = str(ide.mod);
  if (mod !== "55" && mod !== "65") {
    return { ok: false, error: `Modelo do documento inválido ("${mod || "vazio"}") — esperado 55 (NF-e) ou 65 (NFC-e).` };
  }

  let chave = str(deepFind(root, "chNFe")).replace(/\D/g, "");
  if (!chave) {
    const rawId = str(infNFe["@_Id"] ?? infNFe["@_id"]);
    chave = rawId.replace(/^NFe/i, "").replace(/\D/g, "");
  }

  const enderEmit = (emit.enderEmit as Record<string, unknown> | undefined) ?? {};
  const dest = infNFe.dest as Record<string, unknown> | undefined;
  let destDocumento: string | null = null;
  let destNome: string | null = null;
  let destUf: string | null = null;
  let destMunicipio: string | null = null;
  if (dest) {
    destDocumento = str(dest.CNPJ ?? dest.CPF).replace(/\D/g, "") || null;
    destNome = str(dest.xNome) || null;
    const enderDest = (dest.enderDest as Record<string, unknown> | undefined) ?? {};
    destUf = str(enderDest.UF) || null;
    destMunicipio = str(enderDest.xMun) || null;
  }

  const candidate: ParsedNfe = {
    chave,
    mod,
    numero: str(ide.nNF),
    serie: str(ide.serie),
    dataEmissao: str(ide.dhEmi || ide.dEmi) || null,
    naturezaOperacao: str(ide.natOp),
    emitDocumento: str(emit.CNPJ ?? emit.CPF).replace(/\D/g, ""),
    emitNome: str(emit.xNome),
    emitFantasia: str(emit.xFant) || null,
    emitUf: str(enderEmit.UF),
    emitMunicipio: str(enderEmit.xMun),
    destDocumento,
    destNome,
    destUf,
    destMunicipio,
    valorProdutos: numOrNull(icmsTot.vProd),
    valorDesconto: numOrNull(icmsTot.vDesc),
    valorFrete: numOrNull(icmsTot.vFrete),
    valorIcms: numOrNull(icmsTot.vICMS),
    valorPis: numOrNull(icmsTot.vPIS),
    valorCofins: numOrNull(icmsTot.vCOFINS),
    valorIbs: numOrNull(icmsTot.vIBS),
    valorCbs: numOrNull(icmsTot.vCBS),
    valorTotal: numOrNull(icmsTot.vNF) as unknown as number,
    temIbsCbs: hasIbsCbs(infNFe),
    itens: extractItems(infNFe),
  };

  const parsed = ParsedNfeSchema.safeParse(candidate);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "XML de NF-e inválido." };
  }
  return { ok: true, data: parsed.data as ParsedNfe };
}

/** compra = NF-e recebida; NFC-e (modelo 65) nunca é uma compra — é sempre venda ao consumidor. */
export function checkTipoModConsistency(tipo: "compra" | "venda", mod: "55" | "65"): string | null {
  if (tipo === "compra" && mod === "65") {
    return "NFC-e (modelo 65) representa uma venda ao consumidor final — não pode ser importada como compra.";
  }
  return null;
}

export function formatCnpjCpf(doc: string | null | undefined): string {
  const d = (doc ?? "").replace(/\D/g, "");
  if (d.length === 14) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
  if (d.length === 11) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
  return doc || "—";
}
