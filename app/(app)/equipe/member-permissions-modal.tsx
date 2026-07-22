"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ACCENT } from "@/lib/design";
import {
  ACTION_TABS,
  TAB_LABELS,
  TAB_ORDER,
  type Action,
  type ActionTab,
  type Permissions,
  type TabKey,
} from "@/lib/permissions";
import { updateMemberPermissions, type PermissionsFormState } from "./actions";

const ACTIONS: Action[] = ["create", "edit", "delete"];
const ACTION_COL_LABELS: Record<Action, string> = { create: "Criar", edit: "Editar", delete: "Excluir" };

export function MemberPermissionsModal({
  memberId,
  memberName,
  initial,
  onClose,
}: {
  memberId: string;
  memberName: string;
  initial: Permissions | null;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [tabs, setTabs] = useState<Partial<Record<TabKey, boolean>>>(initial?.tabs ?? {});
  const [actions, setActions] = useState<Partial<Record<ActionTab, Partial<Record<Action, boolean>>>>>(initial?.actions ?? {});
  const [state, formAction, pending] = useActionState<PermissionsFormState, FormData>(updateMemberPermissions, {});
  const wasPending = useRef(false);

  // Fecha o modal automaticamente assim que o salvamento termina sem erro.
  useEffect(() => {
    if (wasPending.current && !pending && !state.error) onClose();
    wasPending.current = pending;
  }, [pending, state.error, onClose]);

  const isTabOn = (t: TabKey) => tabs[t] !== false;
  const toggleTab = (t: TabKey) => setTabs((p) => ({ ...p, [t]: !isTabOn(t) }));
  const isActionOn = (t: ActionTab, a: Action) => actions[t]?.[a] !== false;
  const toggleAction = (t: ActionTab, a: Action) =>
    setActions((p) => ({ ...p, [t]: { ...p[t], [a]: !isActionOn(t, a) } }));

  if (!mounted) return null;

  return createPortal(
    <>
      <div onClick={onClose} className="overlay-in" style={{ position: "fixed", inset: 0, background: "rgba(20,20,30,.45)", zIndex: 60 }} />
      <form
        action={(fd) => {
          fd.set("id", memberId);
          fd.set("permissions", JSON.stringify({ tabs, actions }));
          formAction(fd);
        }}
        role="dialog"
        className="modal-in"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: 600,
          maxWidth: "94vw",
          maxHeight: "88vh",
          overflow: "auto",
          background: "#fff",
          borderRadius: 16,
          zIndex: 70,
          padding: "24px 26px",
          boxShadow: "0 24px 80px rgba(20,20,30,.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Permissões — {memberName}</div>
            <div style={{ fontSize: 11.5, color: "#8a8d98", marginTop: 2 }}>Controle quais abas ela vê e o que pode fazer em cada uma.</div>
          </div>
          <div onClick={onClose} className="hv-gray" style={{ marginLeft: "auto", fontSize: 16, color: "#8a8d98", cursor: "pointer", padding: 4, lineHeight: 1 }}>
            ✕
          </div>
        </div>

        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
          Abas visíveis
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
          {TAB_ORDER.filter((t) => t !== "dashboard").map((t) => (
            <label
              key={t}
              style={{
                display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600,
                padding: "6px 10px", borderRadius: 8, cursor: "pointer",
                border: `1px solid ${isTabOn(t) ? "#d9deff" : "#e2e2de"}`,
                background: isTabOn(t) ? "#f7f8ff" : "#fafaf8",
                color: isTabOn(t) ? ACCENT : "#8a8d98",
              }}
            >
              <input type="checkbox" checked={isTabOn(t)} onChange={() => toggleTab(t)} style={{ accentColor: ACCENT }} />
              {TAB_LABELS[t]}
            </label>
          ))}
        </div>

        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
          Ações por aba
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(3,1fr)", gap: 8, fontSize: 10, fontWeight: 700, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".04em", padding: "0 4px 6px" }}>
            <div>Aba</div>
            {ACTIONS.map((a) => <div key={a}>{ACTION_COL_LABELS[a]}</div>)}
          </div>
          {ACTION_TABS.map((t) => (
            <div key={t} style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(3,1fr)", gap: 8, alignItems: "center", padding: "8px 4px", borderBottom: "1px solid #f0f0ed" }}>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{TAB_LABELS[t]}</div>
              {ACTIONS.map((a) => (
                <input
                  key={a}
                  type="checkbox"
                  checked={isActionOn(t, a)}
                  onChange={() => toggleAction(t, a)}
                  style={{ accentColor: ACCENT, width: 16, height: 16, cursor: "pointer" }}
                />
              ))}
            </div>
          ))}
        </div>

        {state.error ? <div style={{ fontSize: 12, color: "#b3402e", marginBottom: 12 }}>{state.error}</div> : null}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            className="hv-light"
            style={{ fontSize: 13, fontWeight: 700, color: "#1c1e26", background: "#fff", border: "1.5px solid #e2e2de", borderRadius: 10, padding: "10px 18px", cursor: "pointer" }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className="hv-btn"
            style={{ fontSize: 13, fontWeight: 700, color: "#fff", background: ACCENT, border: "none", borderRadius: 10, padding: "10px 18px", cursor: "pointer", opacity: pending ? 0.7 : 1 }}
          >
            {pending ? "Salvando…" : "Salvar permissões"}
          </button>
        </div>
      </form>
    </>,
    document.body,
  );
}
