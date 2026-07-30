-- ─────────────────────────── Auditoria ───────────────────────────
-- Log genérico de criação/edição/exclusão, alimentado por um único trigger
-- reaproveitado em várias tabelas — em vez de instrumentar manualmente cada
-- server action, o próprio banco observa as mudanças e resolve o autor via
-- auth.uid() (mesmo padrão de auth_office_id()).

create table audit_log (
  id               uuid primary key default gen_random_uuid(),
  office_id        uuid not null references offices(id) on delete cascade,
  actor_member_id  uuid references members(id) on delete set null,
  actor_name       text,                 -- snapshot: sobrevive à remoção do membro
  table_name       text not null,
  record_id        uuid,
  action           text not null check (action in ('create','update','delete')),
  summary          text,                 -- rótulo legível do registro (título/nome/código no momento)
  changed_fields   jsonb,                -- só em 'update': { campo: { old, new } }
  created_at       timestamptz not null default now()
);
create index audit_log_office_idx on audit_log(office_id, created_at desc);
create index audit_log_actor_idx on audit_log(actor_member_id);
create index audit_log_table_idx on audit_log(office_id, table_name);

alter table audit_log enable row level security;
-- Só leitura por RLS — a escrita acontece exclusivamente via trigger (security
-- definer), então não há policy de insert/update/delete para o role autenticado.
create policy audit_log_sel on audit_log for select using (office_id = auth_office_id());

-- ─────────────────────────── Função do trigger ───────────────────────────

create or replace function audit_log_trigger_fn()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_office_id  uuid;
  v_record_id  uuid;
  v_actor_id   uuid;
  v_actor_name text;
  v_summary    text;
  v_changed    jsonb := '{}'::jsonb;
  v_old        jsonb;
  v_new        jsonb;
  v_row        jsonb;
  k            text;
begin
  if tg_op = 'INSERT' then
    v_row := to_jsonb(new);
  elsif tg_op = 'DELETE' then
    v_row := to_jsonb(old);
  else
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    v_row := v_new;
  end if;

  v_office_id := (v_row->>'office_id')::uuid;
  v_record_id := (v_row->>'id')::uuid;

  select id, name into v_actor_id, v_actor_name from members where user_id = auth.uid() limit 1;

  v_summary := coalesce(
    v_row->>'title', v_row->>'name', v_row->>'nome', v_row->>'descr',
    v_row->>'nbs_descr', v_row->>'code', v_row->>'ncm', v_row->>'nbs',
    v_row->>'text',                      -- comments
    v_row->>'month',                     -- prazo_months (sem coluna 'id')
    v_record_id::text
  );

  if tg_op = 'UPDATE' then
    for k in select jsonb_object_keys(v_new) loop
      if k not in ('id','office_id','created_at','updated_at','position')
         and v_old->k is distinct from v_new->k then
        v_changed := v_changed || jsonb_build_object(k, jsonb_build_object('old', v_old->k, 'new', v_new->k));
      end if;
    end loop;
    -- Nada relevante mudou (ex.: só "position" por drag-and-drop) → não loga.
    if v_changed = '{}'::jsonb then
      return new;
    end if;
  end if;

  insert into audit_log (office_id, actor_member_id, actor_name, table_name, record_id, action, summary, changed_fields)
  values (
    v_office_id, v_actor_id, v_actor_name, tg_table_name, v_record_id,
    case tg_op when 'INSERT' then 'create' when 'DELETE' then 'delete' else 'update' end,
    left(v_summary, 200),
    case when tg_op = 'UPDATE' then v_changed else null end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- ─────────────────────────── Aplicação nas tabelas ───────────────────────────
-- Cobre as entidades onde "quem criou/editou/apagou o quê" tem valor de
-- auditoria. Ficam de fora tabelas de ligação e de alta frequência sem valor
-- narrativo (task_people, task_clients, subtask_completions, flow_nodes,
-- flow_edges) e as de importação em massa (nfe_notes, nfe_note_items), que
-- inundariam o log com milhares de linhas por importação.

do $$
declare t text;
begin
  foreach t in array array[
    'members','clients','tasks','subtasks','comments','changes','events',
    'flows','cst_rows','cclass_rows','produto_rows','servico_rows','notes',
    'documents','nfe_empresas','search_clients','prazo_months'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on %I for each row execute function audit_log_trigger_fn()',
      t || '_audit_trg', t
    );
  end loop;
end $$;
