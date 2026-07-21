# Reforma 2033 — SaaS de gestão da transição tributária

App Next.js (App Router) + Supabase (Postgres, Auth, RLS) para escritórios de contabilidade
acompanharem a reforma tributária (CBS · IBS · IS) — tarefas por cliente, prazos, fluxos,
equipe, tabelas de IBS/CBS e base de conhecimento. Multi-tenant: cada escritório é isolado por RLS.

> O protótipo original (single-file, validado) está preservado em [`prototype/`](prototype/).

## Stack

- **Next.js 16** (App Router, React 19, TypeScript) · **Tailwind CSS v4**
- **Supabase**: Postgres + Auth (email/senha) + Row Level Security
- Acesso a dados via `@supabase/ssr` em Server Components / Server Actions (respeita RLS)
- Deploy alvo: **Vercel** (app) + **Supabase Cloud** (banco)

## Pré-requisitos

- Node 20+ (testado com 22)
- Conta no [Supabase](https://supabase.com) e um projeto criado
- Supabase CLI (já instalado): `supabase --version`

## Configuração (primeira vez)

1. **Crie um projeto no Supabase** (Dashboard → New project). Guarde a senha do banco.

2. **Preencha `.env.local`** com os dados do projeto (Dashboard → Project Settings → API):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
   ```

3. **Aplique o schema** (migrations em `supabase/migrations/`):
   ```bash
   supabase login                       # abre o navegador para autenticar
   supabase link --project-ref SEU-REF  # ref = subdomínio do projeto
   supabase db push                     # cria tabelas, RLS, funções e seed
   ```

4. **(Recomendado) Desative a confirmação de e-mail** para o fluxo de cadastro criar a sessão na hora:
   Dashboard → Authentication → Providers → Email → desmarque *Confirm email*.
   (Com confirmação ligada, o cadastro pede para confirmar o e-mail antes do primeiro login.)

5. **Gere os tipos do banco** (opcional, melhora o type-check):
   ```bash
   npm run gen:types
   ```

6. **Rode o app:**
   ```bash
   npm run dev            # http://localhost:3000
   ```

## Modelo de dados (resumo)

Todas as tabelas têm `office_id` e são isoladas por RLS (`office_id = auth_office_id()`).

- `offices` (tenant) · `members` (pessoas atribuíveis; `user_id` liga à conta de login)
- `clients` · `tasks` · `subtasks` · `task_people` · `task_clients` · `subtask_completions` · `comments`
- `changes` (prazos) · `events` (calendário)
- `flows` · `flow_nodes` · `flow_edges`
- `cst_rows` · `cclass_rows` · `produto_rows` · `notes`

**Cadastro:** `create_office_with_admin()` cria o escritório + membro admin e chama
`seed_office_defaults()`, que semeia **apenas dados regulatórios reais**: CSTs e cClassTrib
(Informe Técnico 2025.002), marcos oficiais da reforma (aba Prazos) e a legislação da Base de
conhecimento (LC 214/2025, EC 132/2023, PLP 108/2024, NT NF-e 2025.002). Clientes, tarefas,
equipe, produtos, eventos e fluxos começam **vazios** — sem dados de exemplo.

## Estrutura

```
app/(auth)/{login,cadastro}     páginas de autenticação (Server Actions)
app/(app)/layout.tsx            shell protegido (sidebar + header)
app/(app)/{dashboard,tarefas,clientes,equipe,prazos,fluxos,ibs,base-conhecimento}
lib/supabase/{server,client,middleware}.ts   helpers SSR do Supabase
lib/{data,design}.ts            contexto do tenant + tokens/utilitários de UI
proxy.ts                        renova sessão e protege rotas
supabase/migrations/            schema + RLS + funções + seed
```

## Status da implementação

- [x] **Fase 0** — Fundação (Next.js + Tailwind + tokens + fontes + helpers Supabase)
- [x] **Fase 1** — Auth + tenant (schema + RLS aplicados e verificados; isolamento testado)
- [x] **Fase 2** — Núcleo: Clientes, Equipe e Tarefas (progresso de subtarefas por cliente)
- [x] **Fase 3** — Dashboard, Prazos, Fluxos (canvas persistido), IBS/CBS e Base de conhecimento
- [x] **Limpeza** — banco zerado, sem dados de teste; seed contém só referência regulatória
- [ ] **Fase 4** — Deploy (Vercel + Supabase prod)
