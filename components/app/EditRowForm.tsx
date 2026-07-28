"use client";

import { ACCENT } from "@/lib/design";

export function EditField({
  label, value, onChange, width,
}: {
  label: string; value: string; onChange: (v: string) => void; width?: number | string;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 10, fontWeight: 700, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".04em", width }}>
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        style={{ fontSize: 12.5, padding: "6px 8px", border: "1px solid #d8d8d3", borderRadius: 6, fontFamily: "inherit", width: "100%" }}
      />
    </label>
  );
}

export function EditActions({
  pending, error, onCancel, onSave,
}: {
  pending: boolean; error: string; onCancel: () => void; onSave: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {error ? <div style={{ fontSize: 11.5, color: "#c23b3b", flex: 1 }}>{error}</div> : <div style={{ flex: 1 }} />}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onCancel(); }}
        className="hv-light"
        style={{ fontSize: 12, fontWeight: 600, color: "#4b4e58", background: "#fff", border: "1px solid #e2e2de", borderRadius: 8, padding: "7px 14px", cursor: "pointer" }}
      >
        Descartar
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onSave(); }}
        disabled={pending}
        className="hv-btn"
        style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: ACCENT, borderRadius: 8, padding: "7px 14px", border: "none", cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}
      >
        {pending ? "Atualizando…" : "Atualizar"}
      </button>
    </div>
  );
}
