"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TABLE_LABELS, ACTION_LABELS, type AuditFilters } from "@/app/(app)/relatorios/auditoria/constants";

export function AuditFilterBar({
  members,
  initialFilters,
}: {
  members: { id: string; name: string }[];
  initialFilters: AuditFilters;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState(initialFilters);

  const updateUrl = (newFilters: AuditFilters) => {
    const params = new URLSearchParams();
    if (newFilters.memberId.length > 0) params.set("member", newFilters.memberId.join(","));
    if (newFilters.table.length > 0) params.set("table", newFilters.table.join(","));
    if (newFilters.action.length > 0) params.set("action", newFilters.action.join(","));
    if (newFilters.dateFrom) params.set("from", newFilters.dateFrom);
    if (newFilters.dateTo) params.set("to", newFilters.dateTo);
    const qs = params.toString();
    router.push(qs ? `/relatorios/auditoria?${qs}` : "/relatorios/auditoria");
  };

  const toggle = (field: "memberId" | "table" | "action", value: string) => {
    const current = filters[field];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    const newFilters = { ...filters, [field]: next };
    setFilters(newFilters);
    updateUrl(newFilters);
  };

  const setDate = (field: "dateFrom" | "dateTo", value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    updateUrl(newFilters);
  };

  const clear = () => {
    const newFilters: AuditFilters = { memberId: [], table: [], action: [], dateFrom: "", dateTo: "" };
    setFilters(newFilters);
    updateUrl(newFilters);
  };

  const tableEntries = Object.entries(TABLE_LABELS);

  return (
    <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
          Ação
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {Object.entries(ACTION_LABELS).map(([key, label]) => (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={filters.action.includes(key)} onChange={() => toggle("action", key)} style={{ cursor: "pointer" }} />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div style={{ borderTop: "1px solid #e7e7e3", paddingTop: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
          Membro
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 150, overflow: "auto" }}>
          {members.map((m) => (
            <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, cursor: "pointer" }}>
              <input type="checkbox" checked={filters.memberId.includes(m.id)} onChange={() => toggle("memberId", m.id)} style={{ cursor: "pointer" }} />
              {m.name}
            </label>
          ))}
        </div>
      </div>

      <div style={{ borderTop: "1px solid #e7e7e3", paddingTop: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
          Área
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflow: "auto" }}>
          {tableEntries.map(([key, label]) => (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, cursor: "pointer" }}>
              <input type="checkbox" checked={filters.table.includes(key)} onChange={() => toggle("table", key)} style={{ cursor: "pointer" }} />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div style={{ borderTop: "1px solid #e7e7e3", paddingTop: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
          Período
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setDate("dateFrom", e.target.value)}
            style={{ fontSize: 11, padding: "6px 8px", border: "1px solid #e7e7e3", borderRadius: 6, boxSizing: "border-box" }}
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setDate("dateTo", e.target.value)}
            style={{ fontSize: 11, padding: "6px 8px", border: "1px solid #e7e7e3", borderRadius: 6, boxSizing: "border-box" }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={clear}
        className="hv-light"
        style={{
          marginTop: 4, width: "100%", fontSize: 12, fontWeight: 600, color: "#4b4e58",
          background: "#fff", border: "1px solid #e2e2de", borderRadius: 8, padding: "7px 12px", cursor: "pointer",
        }}
      >
        Limpar Filtros
      </button>
    </div>
  );
}
