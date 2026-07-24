"use client";

import { useActionState } from "react";
import { ACCENT } from "@/lib/design";
import { Spinner } from "@/components/app/Spinner";
import { changePassword, type SettingsState } from "@/app/(app)/configuracoes/actions";

const LBL: React.CSSProperties = { fontSize: 10.5, fontWeight: 600, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 };
const INP: React.CSSProperties = { width: "100%", fontSize: 13, padding: "9px 11px", borderRadius: 8, border: "1px solid #e2e2de", outline: "none" };
const CARD: React.CSSProperties = { background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, padding: 22, display: "flex", flexDirection: "column", gap: 14, maxWidth: 480 };
const BTN: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-start", fontSize: 12, fontWeight: 600, color: "#fff", background: ACCENT, padding: "9px 16px", borderRadius: 8, border: "none", cursor: "pointer" };

function Msg({ state }: { state: SettingsState }) {
  if (state.error) return <div style={{ fontSize: 12, color: "#b3402e" }}>{state.error}</div>;
  if (state.success) return <div style={{ fontSize: 12, color: "#0e7a6f" }}>{state.success}</div>;
  return null;
}

export function PortalSettingsForm({ client, officeName }: { client: { name: string; email: string }; officeName: string }) {
  const [pwState, pwAction, pwPending] = useActionState<SettingsState, FormData>(changePassword, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={CARD}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>Perfil</div>
        <div>
          <div style={LBL}>Nome</div>
          <input value={client.name} disabled style={{ ...INP, color: "#a0a3ad", background: "#f7f7f4" }} />
        </div>
        <div>
          <div style={LBL}>E-mail</div>
          <input value={client.email} disabled style={{ ...INP, color: "#a0a3ad", background: "#f7f7f4" }} />
        </div>
        <div>
          <div style={LBL}>Escritório</div>
          <input value={officeName} disabled style={{ ...INP, color: "#a0a3ad", background: "#f7f7f4" }} />
        </div>
        <div style={{ fontSize: 11, color: "#a0a3ad" }}>Nome e e-mail são gerenciados pelo escritório.</div>
      </div>

      <div style={CARD}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>Trocar senha</div>
        <form action={pwAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div style={LBL}>Senha atual</div>
            <input className="fc" name="currentPassword" type="password" placeholder="••••••••" style={INP} />
          </div>
          <div>
            <div style={LBL}>Nova senha</div>
            <input className="fc" name="newPassword" type="password" placeholder="••••••••" style={INP} />
          </div>
          <div>
            <div style={LBL}>Confirmar nova senha</div>
            <input className="fc" name="confirmPassword" type="password" placeholder="••••••••" style={INP} />
          </div>
          <Msg state={pwState} />
          <button type="submit" disabled={pwPending} className="hv-btn" style={{ ...BTN, opacity: pwPending ? 0.7 : 1 }}>
            {pwPending ? <Spinner size={12} color="#fff" /> : null}
            {pwPending ? "Alterando…" : "Alterar senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
