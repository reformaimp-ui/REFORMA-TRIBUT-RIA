"use client";

import { useActionState, useRef, useState } from "react";
import { ACCENT } from "@/lib/design";
import { Avatar } from "@/components/app/Avatar";
import { createClient } from "@/lib/supabase/client";
import { updateAvatarUrl, updateName, changePassword, type SettingsState } from "./actions";
import { SearchClientPanel, type SearchClientRow } from "./search-client-panel";
import type { Member, Office } from "@/lib/data";

const LBL: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 600,
  color: "#8a8d98",
  textTransform: "uppercase",
  letterSpacing: ".05em",
  marginBottom: 6,
};
const INP: React.CSSProperties = {
  width: "100%",
  fontSize: 13,
  padding: "9px 11px",
  borderRadius: 8,
  border: "1px solid #e2e2de",
  outline: "none",
};
const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e7e7e3",
  borderRadius: 12,
  padding: 22,
  display: "flex",
  flexDirection: "column",
  gap: 14,
  maxWidth: 460,
};
const BTN: React.CSSProperties = {
  alignSelf: "flex-start",
  fontSize: 12,
  fontWeight: 600,
  color: "#fff",
  background: ACCENT,
  padding: "9px 16px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
};

function Msg({ state }: { state: SettingsState }) {
  if (state.error) return <div style={{ fontSize: 12, color: "#b3402e" }}>{state.error}</div>;
  if (state.success) return <div style={{ fontSize: 12, color: "#0e7a6f" }}>{state.success}</div>;
  return null;
}

export function SettingsForm({
  member, office, isAdmin, searchClients,
}: {
  member: Member; office: Office; isAdmin: boolean; searchClients: SearchClientRow[];
}) {
  const [nameState, nameAction, namePending] = useActionState<SettingsState, FormData>(updateName, {});
  const [pwState, pwAction, pwPending] = useActionState<SettingsState, FormData>(changePassword, {});
  const [avatarUrl, setAvatarUrl] = useState(member.avatar_url);
  const [avatarState, setAvatarState] = useState<SettingsState>({});
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File) => {
    setUploading(true);
    setAvatarState({});
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${member.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });
    if (upErr) {
      setAvatarState({ error: "Não foi possível enviar a foto." });
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${data.publicUrl}?v=${Date.now()}`;
    const res = await updateAvatarUrl(url);
    setAvatarState(res);
    if (!res.error) setAvatarUrl(url);
    setUploading(false);
  };

  return (
    <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Perfil */}
      <div style={CARD}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>Perfil</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Avatar name={member.name} color={member.color} ini={member.ini} avatarUrl={avatarUrl} size={64} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="hv-light"
              style={{ fontSize: 12, fontWeight: 600, color: "#4b4e58", background: "#fff", border: "1.5px solid #e2e2de", borderRadius: 8, padding: "8px 14px", cursor: "pointer", opacity: uploading ? 0.6 : 1 }}
            >
              {uploading ? "Enviando…" : "Trocar foto"}
            </button>
            <Msg state={avatarState} />
          </div>
        </div>

        <form action={nameAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div style={LBL}>Nome</div>
            <input className="fc" name="name" defaultValue={member.name} style={INP} />
          </div>
          <div>
            <div style={LBL}>E-mail</div>
            <input value={member.email ?? ""} disabled style={{ ...INP, color: "#a0a3ad", background: "#f7f7f4" }} />
          </div>
          <div>
            <div style={LBL}>Escritório</div>
            <input value={office.name} disabled style={{ ...INP, color: "#a0a3ad", background: "#f7f7f4" }} />
          </div>
          <Msg state={nameState} />
          <button type="submit" disabled={namePending} className="hv-btn" style={{ ...BTN, opacity: namePending ? 0.7 : 1 }}>
            {namePending ? "Salvando…" : "Salvar nome"}
          </button>
        </form>
      </div>

      {/* Senha */}
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
            {pwPending ? "Alterando…" : "Alterar senha"}
          </button>
        </form>
      </div>

      {isAdmin ? <SearchClientPanel clients={searchClients} /> : null}
    </div>
  );
}
