"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getContext } from "@/lib/data";
import { canDo } from "@/lib/permissions";
import { parseNfeXml, checkTipoModConsistency, type ParsedNfeItem } from "@/lib/nfe/parseNfe";
import { CONSUMIDOR_FINAL_DOC } from "@/lib/nfe/aggregate";

export type NfeTipo = "compra" | "venda";
export type NfeFile = { name: string; xml: string };
export type NfeRejected = { file: string; reason: string };
export type NfeImportResult = { inserted: number; rejected: NfeRejected[]; error?: string };
export type EmpresaState = { error?: string };

/**
 * Importa um lote de XMLs já lidos no client (FileReader). Chamada em loop
 * pelo NfeImportPanel — cada chamada carrega poucos arquivos por vez, bem
 * abaixo do limite de payload da Server Action. O parsing e a validação
 * definitivos acontecem aqui (fonte da verdade), não no preview do client.
 */
export async function importNfeChunk(tipo: NfeTipo, empresaId: string, files: NfeFile[]): Promise<NfeImportResult> {
  if (tipo !== "compra" && tipo !== "venda") return { inserted: 0, rejected: [], error: "Tipo inválido." };
  if (!empresaId) return { inserted: 0, rejected: [], error: "Selecione a empresa antes de importar." };
  if (!Array.isArray(files) || !files.length) return { inserted: 0, rejected: [] };
  const { office, member } = await getContext();
  if (!canDo(member, "analise", "create")) return { inserted: 0, rejected: [], error: "Você não tem permissão para isso." };
  const supabase = await createClient();

  const { data: empresa } = await supabase.from("nfe_empresas").select("id").eq("id", empresaId).maybeSingle();
  if (!empresa) return { inserted: 0, rejected: [], error: "Empresa inválida — recarregue a página e tente novamente." };

  const rejected: NfeRejected[] = [];
  const parsedByChave = new Map<
    string,
    { row: Record<string, unknown>; itens: ParsedNfeItem[]; natOp: string; partyDoc: string | null; partyNome: string | null }
  >();

  for (const f of files) {
    const res = parseNfeXml(f.xml);
    if (!res.ok) {
      rejected.push({ file: f.name, reason: res.error });
      continue;
    }
    const d = res.data;
    const mismatch = checkTipoModConsistency(tipo, d.mod);
    if (mismatch) {
      rejected.push({ file: f.name, reason: mismatch });
      continue;
    }
    // Vínculo do produto com a contraparte da nota: na compra é o emitente
    // (fornecedor), na venda é o destinatário (cliente).
    parsedByChave.set(d.chave, {
      natOp: d.naturezaOperacao,
      itens: d.itens,
      partyDoc: tipo === "compra" ? d.emitDocumento : d.destDocumento,
      partyNome: tipo === "compra" ? d.emitNome : d.destNome,
      row: {
        office_id: office.id,
        empresa_id: empresaId,
        tipo,
        mod: d.mod,
        chave: d.chave,
        numero: d.numero,
        serie: d.serie,
        data_emissao: d.dataEmissao,
        natureza_operacao: d.naturezaOperacao,
        emit_documento: d.emitDocumento,
        emit_nome: d.emitNome,
        emit_fantasia: d.emitFantasia,
        emit_uf: d.emitUf,
        emit_municipio: d.emitMunicipio,
        dest_documento: d.destDocumento,
        dest_nome: d.destNome,
        dest_uf: d.destUf,
        dest_municipio: d.destMunicipio,
        valor_produtos: d.valorProdutos,
        valor_desconto: d.valorDesconto,
        valor_frete: d.valorFrete,
        valor_icms: d.valorIcms,
        valor_pis: d.valorPis,
        valor_cofins: d.valorCofins,
        valor_ibs: d.valorIbs,
        valor_cbs: d.valorCbs,
        valor_total: d.valorTotal,
        tem_ibs_cbs: d.temIbsCbs,
        arquivo_nome: f.name,
      },
    });
  }

  if (!parsedByChave.size) return { inserted: 0, rejected };

  const deduped = [...parsedByChave.values()].map((v) => v.row);
  const { data: upserted, error } = await supabase
    .from("nfe_notes")
    .upsert(deduped, { onConflict: "office_id,chave" })
    .select("id,chave");
  if (error) return { inserted: 0, rejected, error: error.message };

  // Reimportar substitui os itens da nota (não duplica) — apaga os antigos
  // daquelas notas e insere os itens recém-parseados.
  const notes = (upserted ?? []) as { id: string; chave: string }[];
  const noteIds = notes.map((n) => n.id);
  if (noteIds.length) {
    await supabase.from("nfe_note_items").delete().in("note_id", noteIds);
    const itemRows = notes.flatMap((n) => {
      const parsed = parsedByChave.get(n.chave);
      if (!parsed) return [];
      return parsed.itens.map((it) => ({
        office_id: office.id,
        note_id: n.id,
        empresa_id: empresaId,
        tipo,
        nome: it.nome,
        cfop: it.cfop,
        nat_op: parsed.natOp,
        chave: n.chave,
        party_documento: parsed.partyDoc,
        party_nome: parsed.partyNome,
        valor: it.valor,
      }));
    });
    if (itemRows.length) await supabase.from("nfe_note_items").insert(itemRows);
  }

  return { inserted: deduped.length, rejected };
}

export async function finishNfeImport() {
  revalidatePath("/analise");
}

export async function addEmpresa(_p: EmpresaState, fd: FormData): Promise<EmpresaState> {
  const nome = String(fd.get("nome") || "").trim();
  if (!nome) return { error: "Informe o nome da empresa." };
  const { office, member } = await getContext();
  if (!canDo(member, "analise", "create")) return { error: "Você não tem permissão para isso." };
  const supabase = await createClient();
  const cnpjDigits = String(fd.get("cnpj") || "").replace(/\D/g, "");
  const { error } = await supabase.from("nfe_empresas").insert({
    office_id: office.id,
    nome,
    cnpj: cnpjDigits || null,
  });
  if (error) return { error: error.message.includes("nfe_empresas_cnpj_idx") ? "Já existe uma empresa cadastrada com esse CNPJ." : error.message };
  revalidatePath("/analise");
  return {};
}

/** Apaga a empresa e todas as notas importadas vinculadas a ela — não sobra nada órfão. */
export async function deleteEmpresa(fd: FormData) {
  const id = String(fd.get("id") || "");
  if (!id) return;
  const { member } = await getContext();
  if (!canDo(member, "analise", "delete")) return;
  const supabase = await createClient();
  await supabase.from("nfe_notes").delete().eq("empresa_id", id);
  await supabase.from("nfe_empresas").delete().eq("id", id);
  revalidatePath("/analise");
}

/** Mesma exclusão, mas usada a partir da página de detalhe — depois de apagar não há mais o que mostrar ali. */
export async function deleteEmpresaAndRedirect(fd: FormData) {
  await deleteEmpresa(fd);
  redirect("/analise?tab=empresas");
}

/**
 * Apaga todas as notas de um fornecedor (compra) ou cliente (venda) — é assim
 * que "excluir" um fornecedor/cliente funciona, já que eles não têm linha
 * própria, são só um agregado das notas. Quando empresaId vem vazio (lista
 * global, sem recorte por empresa), apaga em todas as empresas do escritório.
 */
export async function deleteParty(fd: FormData) {
  const tipo = String(fd.get("tipo") || "");
  const doc = String(fd.get("doc") || "");
  const empresaId = String(fd.get("empresaId") || "");
  if (tipo !== "compra" && tipo !== "venda") return;
  const { member } = await getContext();
  if (!canDo(member, "analise", "delete")) return;
  const supabase = await createClient();

  let query = supabase.from("nfe_notes").delete().eq("tipo", tipo);
  if (tipo === "compra") {
    query = query.eq("emit_documento", doc);
  } else {
    query = doc === CONSUMIDOR_FINAL_DOC ? query.is("dest_documento", null) : query.eq("dest_documento", doc);
  }
  if (empresaId) query = query.eq("empresa_id", empresaId);

  await query;
  revalidatePath("/analise");
}
