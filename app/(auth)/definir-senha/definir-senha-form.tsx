"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ACCENT } from "@/lib/design";
import { createClient } from "@/lib/supabase/client";
import type { EmailOtpType } from "@supabase/supabase-js";

const INP: React.CSSProperties = {
  width: "100%",
  fontSize: 13.5,
  padding: "11px 14px",
  borderRadius: 10,
  border: "1.5px solid #e2e2de",
  outline: "none",
};

type Status = "validando" | "pronto" | "invalido" | "concluido";

/**
 * Processa o link de convite do Supabase, que pode chegar em 3 formatos
 * diferentes dependendo da configuração do projeto — implicit (hash com
 * access_token), PKCE (?code=) ou OTP por e-mail (?token_hash=&type=) — e só
 * então libera o formulário de senha.
 */
export function DefinirSenhaForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<Status>("validando");
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      try {
        if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
          const hp = new URLSearchParams(window.location.hash.slice(1));
          const access_token = hp.get("access_token");
          const refresh_token = hp.get("refresh_token");
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;
            setStatus("pronto");
            return;
          }
        }

        const code = params.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setStatus("pronto");
          return;
        }

        const token_hash = params.get("token_hash");
        const type = params.get("type");
        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as EmailOtpType });
          if (error) throw error;
          setStatus("pronto");
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setStatus("pronto");
          return;
        }
        setStatus("invalido");
      } catch {
        setStatus("invalido");
      }
    })();
  }, [params]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError("A senha deve ter ao menos 6 caracteres.");
    if (password !== confirm) return setError("As senhas não coincidem.");
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (error) return setError("Não foi possível definir a senha. Tente novamente.");
    setStatus("concluido");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 26 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.01em" }}>Definir senha</div>
          <div style={{ fontSize: 13, color: "#8a8d98", marginTop: 6 }}>Primeiro acesso — crie sua senha para entrar.</div>
        </div>

        {status === "validando" ? (
          <div style={{ fontSize: 13, color: "#8a8d98" }}>Validando convite…</div>
        ) : status === "invalido" ? (
          <div style={{ fontSize: 13, color: "#b3402e" }}>
            Este link de convite é inválido ou expirou. Peça para quem te convidou enviar um novo convite.
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#6b6e78", marginBottom: 6 }}>Nova senha</div>
              <input
                className="fc"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                style={INP}
              />
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#6b6e78", marginBottom: 6 }}>Confirmar senha</div>
              <input
                className="fc"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                style={INP}
              />
            </div>
            {error ? <div style={{ fontSize: 12, color: "#b3402e" }}>{error}</div> : null}
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
              {pending ? "Salvando…" : "Definir senha e entrar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
