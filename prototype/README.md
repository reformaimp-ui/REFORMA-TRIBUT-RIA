# Reforma 2033 — Gestão da transição tributária

Aplicativo para escritórios de contabilidade acompanharem a transição da reforma tributária
(EC 132/2023 · LC 214/2025): tarefas por cliente, prazos, fluxos, equipe, tabelas de IBS/CBS
e base de conhecimento.

## Como abrir

Basta dar **dois cliques em `index.html`** — o app abre no navegador.
Requer internet (React, Babel e fontes são carregados via CDN).

## Funcionalidades

- **Login / Cadastro** do escritório (o nome cadastrado vira a marca no topo)
- **Visão geral** — KPIs calculados ao vivo (tarefas abertas, atrasos, prazos em 7 dias,
  adequação média), linha do tempo da transição 2026→2033 e carga por responsável
- **Tarefas** — criação com subtarefas, categoria, recorrência, pessoas e clientes vinculados;
  progresso de subtarefas é acompanhado **por cliente**; comentários por tarefa
- **Prazos** — mudanças da reforma agrupadas por mês, com severidade e edição inline
- **Fluxos** — editor visual de fluxos (arrastar nós, conectar, zoom, duplo clique cria nó)
- **Clientes** — carteira com regime, responsável e % de adequação; cadastro individual,
  em lote (colar linhas) ou importação de .csv; dashboard por cliente
- **Equipe** — convite de pessoas com permissão e cor de avatar
- **IBS e CBS** — tabelas de CST, cClassTrib e tributação de produtos (NCM), com
  cadastro individual, em lote ou .csv
- **Base de conhecimento** — legislação e notas internas

## Dados

Tudo é salvo automaticamente no **localStorage do navegador** (chave
`reforma2033-state-v1`). Para zerar o app e voltar aos dados de exemplo, apague essa
chave nas ferramentas do desenvolvedor (F12 → Application → Local Storage) ou use
uma janela anônima.

## Origem

Implementação do design `Reforma Tributária.dc.html` (Claude Design):
https://claude.ai/design/p/5d764e04-e966-4abf-b052-c6182d2b2506
