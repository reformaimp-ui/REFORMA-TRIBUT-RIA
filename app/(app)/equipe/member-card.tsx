"use client";

import { useState } from "react";
import { ACCENT, av } from "@/lib/design";
import { ConfirmForm } from "@/components/app/ConfirmForm";
import type { Permissions } from "@/lib/permissions";
import { removeMember } from "./actions";
import { MemberPermissionsModal } from "./member-permissions-modal";

export type MemberLite = {
  id: string;
  name: string;
  email: string | null;
  ini: string;
  color: string;
  cargo: string | null;
  role: string;
  permissions: Permissions | null;
};

export function MemberCard({
  m,
  locked,
  canManage,
  canRemove,
}: {
  m: MemberLite;
  locked: boolean;
  canManage: boolean;
  canRemove: boolean;
}) {
  const [open, setOpen] = useState(false);
  const isAdmin = m.role === "admin";
  const clickable = canManage && !isAdmin;

  return (
    <>
      <div
        onClick={() => clickable && setOpen(true)}
        className={clickable ? "hv-card" : undefined}
        title={clickable ? "Clique para configurar permissões" : undefined}
        style={{
          background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, padding: "16px 18px",
          display: "flex", flexDirection: "column", gap: 10, cursor: clickable ? "pointer" : "default",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={av(m.color, 34)}>{m.ini}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
            <div style={{ fontSize: 11, color: "#8a8d98", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.cargo}</div>
          </div>
          {locked ? (
            <div title="Atribuído a tarefas ou clientes" style={{ color: "#c2c3c9", padding: 2 }}>
              <svg width="13" height="13" viewBox="0 0 13 13">
                <rect x="2.5" y="6" width="8" height="5.5" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.3" />
                <path d="M4 6V4a2.5 2.5 0 015 0v2" fill="none" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </div>
          ) : canRemove ? (
            <ConfirmForm
              action={removeMember}
              message={`Remover ${m.name} da equipe? Ela perde o acesso ao escritório imediatamente.`}
              onClick={(e) => e.stopPropagation()}
            >
              <input type="hidden" name="id" value={m.id} />
              <button
                type="submit"
                title="Remover"
                className="hv-danger"
                style={{ color: "#c2c3c9", cursor: "pointer", padding: 2, background: "none", border: "none" }}
              >
                <svg width="14" height="14" viewBox="0 0 15 15">
                  <path d="M2 3.5h11M6 3.5V2h3v1.5M3.5 3.5l.7 9.5h6.6l.7-9.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </ConfirmForm>
          ) : null}
        </div>
        <div style={{ height: 1, background: "#f0f0ed" }} />
        <div style={{ fontSize: 11.5, color: "#6b6e78", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email || "—"}</div>
        <div
          style={{
            alignSelf: "flex-start", fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 99,
            background: isAdmin ? "#eef1ff" : "#f4f4f2", color: isAdmin ? ACCENT : "#6b6e78",
          }}
        >
          {isAdmin ? "Admin" : "Membro"}
        </div>
      </div>
      {open ? <MemberPermissionsModal memberId={m.id} memberName={m.name} initial={m.permissions} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
