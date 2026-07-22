"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ACCENT } from "@/lib/design";
import { login, type AuthState } from "./actions";

const INP: React.CSSProperties = {
  width: "100%",
  fontSize: 13.5,
  padding: "11px 14px",
  borderRadius: 10,
  border: "1.5px solid #e2e2de",
  outline: "none",
};

export function LoginForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(login, {});

  return (
    <div
      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}
    >
      <form
        action={formAction}
        style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 26 }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.01em" }}>Entrar</div>
          <div style={{ fontSize: 13, color: "#8a8d98", marginTop: 6 }}>
            Acesse a conta do seu escritório.
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "#6b6e78", marginBottom: 6 }}>
              E-mail
            </div>
            <input
              className="fc"
              name="email"
              type="email"
              placeholder="voce@escritorio.com.br"
              style={INP}
            />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#6b6e78" }}>Senha</div>
              <Link href="/esqueci-senha" style={{ fontSize: 11.5, color: ACCENT }}>
                Esqueci minha senha
              </Link>
            </div>
            <input className="fc" name="password" type="password" placeholder="••••••••" style={INP} />
          </div>
        </div>
        {state.error ? <div style={{ fontSize: 12, color: "#b3402e" }}>{state.error}</div> : null}
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
          {pending ? "Entrando…" : "Entrar"}
        </button>
        <div style={{ textAlign: "center", fontSize: 12.5, color: "#8a8d98" }}>
          Ainda não tem conta?{" "}
          <Link href="/cadastro" style={{ color: ACCENT, fontWeight: 600 }}>
            Cadastre seu escritório
          </Link>
        </div>
        <div style={{ textAlign: "center", fontSize: 12.5, color: "#8a8d98" }}>
          Foi convidado para um escritório?{" "}
          <Link href="/primeiro-acesso" style={{ color: ACCENT, fontWeight: 600 }}>
            Primeiro acesso
          </Link>
        </div>
      </form>
    </div>
  );
}
