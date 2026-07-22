"use client";

import { useActionState } from "react";
import { ACCENT } from "@/lib/design";
import { ConfirmForm } from "@/components/app/ConfirmForm";
import { addSearchClient, removeSearchClient, toggleSearchClient, type SearchClientState } from "./actions";

const LBL: React.CSSProperties = { fontSize: 10.5, fontWeight: 600, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 };
const INP: React.CSSProperties = { width: "100%", fontSize: 13, padding: "9px 11px", borderRadius: 8, border: "1px solid #e2e2de", outline: "none" };
const CARD: React.CSSProperties = { background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, padding: 22, display: "flex", flexDirection: "column", gap: 14, maxWidth: 680 };
const BTN: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#fff", background: ACCENT, padding: "9px 16px", borderRadius: 8, border: "none", cursor: "pointer" };

export type SearchClientRow = { id: string; name: string; email: string; active: boolean };

export function SearchClientPanel({ clients }: { clients: SearchClientRow[] }) {
  const [state, action, pending] = useActionState<SearchClientState, FormData>(addSearchClient, {});

  return (
    <div style={CARD}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>Acesso de pesquisa para clientes</div>
        <div style={{ fontSize: 11.5, color: "#8a8d98", marginTop: 3 }}>
          Crie um acesso simples — só consulta de tributação por NCM — para um cliente seu, sem acesso ao resto do sistema.
        </div>
      </div>
      <form action={action} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 180px" }}>
          <div style={LBL}>Nome</div>
          <input className="fc" name="name" placeholder="Nome do cliente" style={INP} />
        </div>
        <div style={{ flex: "1 1 220px" }}>
          <div style={LBL}>E-mail</div>
          <input className="fc" name="email" type="email" placeholder="cliente@empresa.com.br" style={INP} />
        </div>
        <button type="submit" disabled={pending} className="hv-btn" style={{ ...BTN, opacity: pending ? 0.7 : 1 }}>
          {pending ? "Criando…" : "+ Criar acesso"}
        </button>
      </form>
      {state.error ? <div style={{ fontSize: 12, color: "#b3402e" }}>{state.error}</div> : null}
      <div style={{ fontSize: 11, color: "#8a8d98", marginTop: -6 }}>
        A pessoa acessa em “Primeiro acesso”, na tela de login, com esse e-mail — validamos por código enviado ao e-mail.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
        {clients.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, border: "1px solid #ececea" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
              <div style={{ fontSize: 11, color: "#8a8d98", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</div>
            </div>
            <div
              style={{
                fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 99, flex: "none",
                background: c.active ? "#e8f5f0" : "#f4f4f2", color: c.active ? "#0e7a6f" : "#8a8d98",
              }}
            >
              {c.active ? "Ativo" : "Inativo"}
            </div>
            <form action={toggleSearchClient}>
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="active" value={String(c.active)} />
              <button
                type="submit"
                className="hv-light"
                style={{ fontSize: 11.5, fontWeight: 600, color: "#4b4e58", background: "#fff", border: "1.5px solid #e2e2de", borderRadius: 7, padding: "5px 10px", cursor: "pointer" }}
              >
                {c.active ? "Desativar" : "Ativar"}
              </button>
            </form>
            <ConfirmForm action={removeSearchClient} message={`Remover o acesso de ${c.name}?`}>
              <input type="hidden" name="id" value={c.id} />
              <button type="submit" className="hv-danger" title="Remover" style={{ color: "#c2c3c9", cursor: "pointer", padding: 4, background: "none", border: "none" }}>
                <svg width="14" height="14" viewBox="0 0 15 15">
                  <path d="M2 3.5h11M6 3.5V2h3v1.5M3.5 3.5l.7 9.5h6.6l.7-9.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </ConfirmForm>
          </div>
        ))}
        {clients.length === 0 ? <div style={{ fontSize: 12, color: "#a0a3ad", fontStyle: "italic" }}>Nenhum acesso criado ainda.</div> : null}
      </div>
    </div>
  );
}
