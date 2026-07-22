"use client";

import { useActionState, useState } from "react";
import { ACCENT, PALETTE } from "@/lib/design";
import { addMember, type MemberFormState } from "../actions";

const INP: React.CSSProperties = {
  width: "100%",
  fontSize: 13,
  padding: "9px 11px",
  borderRadius: 8,
  border: "1px solid #e2e2de",
  outline: "none",
};
const LBL: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 600,
  color: "#8a8d98",
  textTransform: "uppercase",
  letterSpacing: ".05em",
  marginBottom: 6,
};

export function MemberForm() {
  const [state, formAction, pending] = useActionState<MemberFormState, FormData>(addMember, {});
  const [color, setColor] = useState(PALETTE[0]);

  return (
    <form
      action={formAction}
      style={{ maxWidth: 420, display: "flex", flexDirection: "column", gap: 14 }}
    >
      <input type="hidden" name="color" value={color} />
      <div>
        <div style={LBL}>Nome</div>
        <input className="fc" name="name" placeholder="Nome completo" autoFocus style={INP} />
      </div>
      <div>
        <div style={LBL}>E-mail</div>
        <input className="fc" name="email" type="email" required placeholder="pessoa@escritorio.com.br" style={INP} />
        <div style={{ fontSize: 11, color: "#8a8d98", marginTop: 5 }}>
          A pessoa acessa em “Primeiro acesso”, na tela de login, com esse e-mail — validamos por
          código enviado ao e-mail e ela cria a própria senha.
        </div>
      </div>
      <div>
        <div style={LBL}>Cargo</div>
        <input className="fc" name="cargo" placeholder="Ex.: Analista fiscal" style={INP} />
      </div>
      <div>
        <div style={LBL}>Permissão</div>
        <select
          className="fc"
          name="permissao"
          defaultValue="membro"
          style={{
            ...INP,
            fontWeight: 700,
            color: ACCENT,
            background: "#eef1ff",
            border: "1.5px solid #d9deff",
            borderRadius: 10,
          }}
        >
          <option value="admin">Admin — acesso total</option>
          <option value="membro">Membro — acesso à operação</option>
        </select>
      </div>
      <div>
        <div style={LBL}>Cor do avatar</div>
        <div style={{ display: "flex", gap: 8 }}>
          {PALETTE.map((c) => (
            <div
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: 22,
                height: 22,
                borderRadius: 7,
                cursor: "pointer",
                background: c,
                border: `2px solid ${color === c ? "#1c1e26" : "transparent"}`,
              }}
            />
          ))}
        </div>
      </div>
      {state.error ? <div style={{ fontSize: 12, color: "#b3402e" }}>{state.error}</div> : null}
      <button
        type="submit"
        disabled={pending}
        className="hv-btn"
        style={{
          alignSelf: "flex-start",
          fontSize: 12,
          fontWeight: 600,
          color: "#fff",
          background: ACCENT,
          padding: "9px 16px",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          marginTop: 4,
          opacity: pending ? 0.7 : 1,
        }}
      >
        {pending ? "Convidando…" : "Convidar pessoa"}
      </button>
    </form>
  );
}
