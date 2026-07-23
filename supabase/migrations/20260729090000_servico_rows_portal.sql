-- Leitura pública (somente SELECT) de Tributação dos serviços no portal de
-- pesquisa de clientes — mesmo padrão de produto_rows_portal_sel.
create policy servico_rows_portal_sel on servico_rows for select using (office_id = search_client_office_id());
