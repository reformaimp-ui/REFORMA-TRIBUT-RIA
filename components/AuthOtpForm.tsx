"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ACCENT } from "@/lib/design";
import { createClient } from "@/lib/supabase/client";

const INP: React.CSSProperties = {
  width: "100%",
  fontSize: 13.5,
  padding: "11px 14px",
  borderRadius: 10,
  border: "1.5px solid #e2e2de",
  outline: "none",
};

function btnStyle(pending: boolean): React.CSSProperties {
  return {
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
  };
}

type Step = "email" | "otp" | "senha";

/**
 * Fluxo de confirmação por código de 6 dígitos (signInWithOtp + verifyOtp),
 * em vez de link de e-mail — evita depender da configuração de Redirect URL
 * do Supabase (que varia por ambiente e causou link quebrado apontando para
 * localhost). Usado tanto no primeiro acesso quanto em "esqueci minha senha":
 * as duas telas só diferem no texto, a mecânica de confirmar o e-mail e
 * definir a senha é a mesma.
 */
export function AuthOtpForm({
  heading,
  emailStepDesc,
  notFoundError,
  finalButtonLabel,
}: {
  heading: string;
  emailStepDesc: string;
  notFoundError: string;
  finalButtonLabel: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const em = email.trim();
    if (!em) return setError("Informe o e-mail.");
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email: em, options: { shouldCreateUser: false } });
    setPending(false);
    if (error) return setError(notFoundError);
    setStep("otp");
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!code.trim()) return setError("Informe o código recebido por e-mail.");
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    setPending(false);
    if (error) return setError("Código inválido ou expirado.");
    setStep("senha");
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError("A senha deve ter ao menos 6 caracteres.");
    if (password !== confirm) return setError("As senhas não coincidem.");
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (error) return setError("Não foi possível definir a senha. Tente novamente.");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    router.push(user?.app_metadata?.portal ? "/pesquisa" : "/dashboard");
    router.refresh();
  };

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 26 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.01em" }}>{heading}</div>
          <div style={{ fontSize: 13, color: "#8a8d98", marginTop: 6 }}>
            {step === "email" ? emailStepDesc : null}
            {step === "otp" ? `Digite o código de 6 dígitos enviado para ${email}.` : null}
            {step === "senha" ? "Confirmado! Agora crie sua senha de acesso." : null}
          </div>
        </div>

        {step === "email" ? (
          <form onSubmit={sendCode} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#6b6e78", marginBottom: 6 }}>E-mail</div>
              <input
                className="fc"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@escritorio.com.br"
                autoFocus
                style={INP}
              />
            </div>
            {error ? <div style={{ fontSize: 12, color: "#b3402e" }}>{error}</div> : null}
            <button type="submit" disabled={pending} className="hv-btn" style={btnStyle(pending)}>
              {pending ? "Enviando…" : "Enviar código"}
            </button>
          </form>
        ) : null}

        {step === "otp" ? (
          <form onSubmit={verifyCode} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#6b6e78", marginBottom: 6 }}>Código de 6 dígitos</div>
              <input
                className="fc"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                autoFocus
                style={{ ...INP, letterSpacing: "0.3em", textAlign: "center", fontFamily: "var(--font-jetbrains)" }}
              />
            </div>
            {error ? <div style={{ fontSize: 12, color: "#b3402e" }}>{error}</div> : null}
            <button type="submit" disabled={pending} className="hv-btn" style={btnStyle(pending)}>
              {pending ? "Verificando…" : "Confirmar código"}
            </button>
          </form>
        ) : null}

        {step === "senha" ? (
          <form onSubmit={submitPassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#6b6e78", marginBottom: 6 }}>Nova senha</div>
              <input
                className="fc"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
                style={INP}
              />
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#6b6e78", marginBottom: 6 }}>Confirmar senha</div>
              <input
                className="fc"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                style={INP}
              />
            </div>
            {error ? <div style={{ fontSize: 12, color: "#b3402e" }}>{error}</div> : null}
            <button type="submit" disabled={pending} className="hv-btn" style={btnStyle(pending)}>
              {pending ? "Salvando…" : finalButtonLabel}
            </button>
          </form>
        ) : null}

        <div style={{ textAlign: "center", fontSize: 12.5, color: "#8a8d98" }}>
          <Link href="/login" style={{ color: ACCENT, fontWeight: 600 }}>Voltar para o login</Link>
        </div>
      </div>
    </div>
  );
}
