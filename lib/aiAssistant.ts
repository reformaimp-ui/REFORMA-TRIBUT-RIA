"use server";

import { searchProdutoPublic, searchServicoPublic } from "@/app/pesquisa/actions";
import { searchNcm } from "@/app/(app)/ibs/actions";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-4-8";
const MAX_TOOL_ITERATIONS = 6;

export type AiChatMessage = { role: "user" | "assistant"; text: string };

const SYSTEM_PROMPT = `Você é um assistente especializado em classificação fiscal para a Reforma Tributária brasileira (IBS e CBS), integrado ao sistema de um escritório de contabilidade.

Seu objetivo é ajudar a pessoa a descobrir o NCM (para produtos/mercadorias) ou o NBS (para serviços) mais provável a partir da descrição do que ela vende ou presta, e então informar a tributação estimada de IBS e CBS.

Como proceder:
1. Se a descrição do produto ou serviço for ambígua ou genérica demais para classificar com segurança, faça perguntas objetivas e específicas antes de responder (ex.: material predominante, uso/finalidade, se é revenda ou industrialização própria, se o serviço é padronizado ou sob encomenda etc.). Faça só as perguntas estritamente necessárias — não uma lista longa.
2. Para PRODUTOS: use a ferramenta buscar_ncm para pesquisar candidatos na árvore oficial de NCM a partir da descrição. Depois de identificar o NCM mais provável, use buscar_tributacao_produto com esse NCM para verificar se o escritório já tem CST, cClassTrib e alíquotas de IBS/CBS cadastrados para ele.
3. Para SERVIÇOS: use a ferramenta buscar_servico para pesquisar diretamente na base de serviços do escritório (por NBS, descrição do NBS ou descrição do item) — essa base já traz a tributação cadastrada.
4. Sempre que encontrar um cadastro correspondente, baseie a tributação na informação real (CST, cClassTrib, alíquotas e reduções) em vez de estimar. Se não encontrar nada cadastrado para o código identificado, deixe claro que a tributação apresentada é uma estimativa geral com base nas regras da reforma, e não um dado cadastrado pelo escritório.
5. Nunca invente um código NCM ou NBS — baseie-se sempre nos resultados retornados pelas ferramentas de busca. Se as ferramentas não retornarem nada plausível, diga isso e peça mais detalhes.
6. Responda em português do Brasil, de forma direta e objetiva, sem enrolação. Ao concluir a classificação, apresente claramente: o código (NCM ou NBS) identificado, a descrição oficial, e a tributação (CST, cClassTrib, alíquotas/reduções de IBS e CBS), indicando se veio do cadastro do escritório ou se é uma estimativa.`;

const TOOLS = [
  {
    name: "buscar_ncm",
    description:
      "Pesquisa a árvore oficial de códigos NCM por código (ou parte dele) ou por termo da descrição. Use para descobrir o NCM provável de um produto a partir da sua descrição.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Código NCM (completo ou parcial) ou termo de busca da descrição do produto" },
      },
      required: ["query"],
    },
  },
  {
    name: "buscar_tributacao_produto",
    description:
      "Verifica se um NCM específico já tem tributação de IBS/CBS (CST, cClassTrib, alíquotas e reduções) cadastrada pelo escritório. Use depois de identificar o NCM provável com buscar_ncm.",
    input_schema: {
      type: "object",
      properties: {
        ncm: { type: "string", description: "Código NCM, com ou sem pontuação" },
      },
      required: ["ncm"],
    },
  },
  {
    name: "buscar_servico",
    description:
      "Pesquisa a base de serviços do escritório por código NBS, descrição do NBS ou descrição do item prestado. Retorna a tributação de IBS/CBS já cadastrada para o serviço encontrado.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Código NBS ou termo de busca da descrição do serviço" },
      },
      required: ["query"],
    },
  },
] as const;

type AnthropicContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "thinking"; thinking: string };

type AnthropicMessage = {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[];
};

async function runTool(name: string, input: Record<string, unknown>): Promise<string> {
  try {
    if (name === "buscar_ncm") {
      const results = await searchNcm(String(input.query ?? ""));
      return JSON.stringify(results.slice(0, 10));
    }
    if (name === "buscar_tributacao_produto") {
      const results = await searchProdutoPublic(String(input.ncm ?? ""));
      return JSON.stringify(results.slice(0, 5));
    }
    if (name === "buscar_servico") {
      const results = await searchServicoPublic(String(input.query ?? ""));
      return JSON.stringify(results.slice(0, 5));
    }
    return JSON.stringify({ error: `Ferramenta desconhecida: ${name}` });
  } catch {
    return JSON.stringify({ error: "Falha ao consultar os dados do escritório." });
  }
}

/**
 * Assistente de IA (Claude) para classificação de NCM/NBS. Roda um loop de
 * tool-use server-side contra as mesmas buscas usadas na pesquisa pública/
 * interna, para que a tributação retornada venha do cadastro real do
 * escritório sempre que existir, em vez de ser apenas uma estimativa do modelo.
 */
export async function askTaxAssistant(history: AiChatMessage[]): Promise<{ reply: string; error?: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { reply: "", error: "O assistente de IA ainda não foi configurado neste escritório. Peça ao administrador para configurar a chave da API da Anthropic." };
  }
  if (!history.length) return { reply: "" };

  const messages: AnthropicMessage[] = history.map((m) => ({ role: m.role, content: m.text }));

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    let res: Response;
    try {
      res = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          thinking: { type: "adaptive" },
          tools: TOOLS,
          messages,
        }),
      });
    } catch {
      return { reply: "", error: "Não foi possível conectar ao assistente de IA. Tente novamente." };
    }

    if (!res.ok) {
      return { reply: "", error: res.status === 401 ? "Chave da API da IA inválida." : "O assistente de IA não conseguiu responder agora. Tente novamente em instantes." };
    }

    const data = await res.json();
    const content = (data.content ?? []) as AnthropicContentBlock[];

    if (data.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content });
      const toolResults: { type: "tool_result"; tool_use_id: string; content: string }[] = [];
      for (const block of content) {
        if (block.type === "tool_use") {
          const result = await runTool(block.name, block.input);
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
        }
      }
      messages.push({ role: "user", content: toolResults as unknown as AnthropicContentBlock[] });
      continue;
    }

    const textBlock = content.find((b): b is { type: "text"; text: string } => b.type === "text");
    return { reply: textBlock?.text ?? "" };
  }

  return { reply: "", error: "O assistente não conseguiu concluir a consulta. Tente reformular a pergunta." };
}
