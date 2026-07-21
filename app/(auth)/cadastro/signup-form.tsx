"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ACCENT } from "@/lib/design";
import { signup, type SignupState } from "./actions";

const INP: React.CSSProperties = {
  width: "100%",
  fontSize: 13.5,
  padding: "11px 14px",
  borderRadius: 10,
  border: "1.5px solid #e2e2de",
  outline: "none",
};
const LBL: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 600,
  color: "#6b6e78",
  marginBottom: 6,
};

export function SignupForm() {
  const [state, formAction, pending] = useActionState<SignupState, FormData>(signup, {});

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        overflow: "auto",
      }}
    >
      <form
        action={formAction}
        style={{
          width: "100%",
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          gap: 22,
          padding: "24px 0",
        }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.01em" }}>
            Cadastre seu escritório
          </div>
          <div style={{ fontSize: 13, color: "#8a8d98", marginTop: 6 }}>
            Sua equipe será convidada depois, na aba Equipe.
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={LBL}>Nome do escritório</div>
            <input className="fc" name="officeName" placeholder="Ex.: Andrade Contabilidade" style={INP} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={LBL}>Seu nome</div>
              <input className="fc" name="responsavel" placeholder="Responsável" style={INP} />
            </div>
            <div>
              <div style={LBL}>CNPJ</div>
              <input className="fc" name="cnpj" placeholder="00.000.000/0001-00" style={INP} />
            </div>
          </div>
          <div>
            <div style={LBL}>E-mail</div>
            <input className="fc" name="email" type="email" placeholder="voce@escritorio.com.br" style={INP} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={LBL}>Senha</div>
              <input className="fc" name="password" type="password" placeholder="••••••••" style={INP} />
            </div>
            <div>
              <div style={LBL}>Confirmar senha</div>
              <input className="fc" name="confirm" type="password" placeholder="••••••••" style={INP} />
            </div>
          </div>
        </div>
        {state.error ? <div style={{ fontSize: 12, color: "#b3402e" }}>{state.error}</div> : null}
        {state.notice ? (
          <div
            style={{
              fontSize: 12.5,
              color: "#0e7a6f",
              background: "#e8f5f0",
              border: "1px solid #cbe7dd",
              borderRadius: 8,
              padding: "10px 12px",
              lineHeight: 1.5,
            }}
          >
            {state.notice}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="hv-btn"
          style={{
            textAlign: "center",
            fontSize: 13.5,
            fontWeight: 700,
            color: "#fff",
            background: ACCENT,
            padding: 12,
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? "Criando…" : "Criar conta do escritório"}
        </button>
        <div style={{ textAlign: "center", fontSize: 12.5, color: "#8a8d98" }}>
          Já tem conta?{" "}
          <Link href="/login" style={{ color: ACCENT, fontWeight: 600 }}>
            Entrar
          </Link>
        </div>
      </form>
    </div>
  );
}
