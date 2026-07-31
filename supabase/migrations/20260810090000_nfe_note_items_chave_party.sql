-- Itens de nota passam a carregar a chave de acesso da nota-mãe e o vínculo com
-- a contraparte (fornecedor na compra, cliente na venda). Denormalizado no mesmo
-- padrão do resto do schema: a agregação de produtos roda sem join.

alter table nfe_note_items
  add column chave           text,
  add column party_documento text,
  add column party_nome      text;

-- Backfill dos itens já importados a partir da nota-mãe.
update nfe_note_items i
set chave = n.chave,
    party_documento = case when i.tipo = 'compra' then n.emit_documento else n.dest_documento end,
    party_nome      = case when i.tipo = 'compra' then n.emit_nome      else n.dest_nome      end
from nfe_notes n
where n.id = i.note_id;

create index nfe_note_items_party_idx on nfe_note_items(office_id, empresa_id, tipo, party_documento);
