"use client";

import { useState } from "react";
import { ACCENT } from "@/lib/design";
import { TABLE_LABELS, ACTION_LABELS, type AuditLogRow } from "@/app/(app)/relatorios/auditoria/constants";

const ACTION_COLORS: Record<string, { bg: string; fg: string }> = {
  create: { bg: "#e8f5ec", fg: "#1f9254" },
  update: { bg: "#eef1ff", fg: ACCENT },
  delete: { bg: "#fdecec", fg: "#c0392b" },
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatFieldValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function AuditLogTable({ rows }: { rows: AuditLogRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <div style={{ background: "#f7f7f4", border: "1px solid #e7e7e3", borderRadius: 12, padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "#8a8d98" }}>Nenhum registro encontrado para os filtros selecionados.</div>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #e7e7e3", background: "#f7f7f4" }}>
            <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, color: "#33363f" }}>Data/Hora</th>
            <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, color: "#33363f" }}>Usuário</th>
            <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, color: "#33363f" }}>Ação</th>
            <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, color: "#33363f" }}>Área</th>
            <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, color: "#33363f" }}>Registro</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const colors = ACTION_COLORS[row.action] ?? ACTION_COLORS.update;
            const hasDiff = row.action === "update" && row.changed_fields && Object.keys(row.changed_fields).length > 0;
            const expanded = expandedId === row.id;
            return (
              <>
                <tr
                  key={row.id}
                  onClick={() => hasDiff && setExpandedId(expanded ? null : row.id)}
                  style={{
                    borderBottom: "1px solid #ececea",
                    background: i % 2 === 1 ? "#fbfbfa" : "transparent",
                    cursor: hasDiff ? "pointer" : "default",
                  }}
                >
                  <td style={{ padding: "10px 12px", color: "#4b4e58", fontFamily: "var(--font-jetbrains)", fontSize: 11 }}>
                    {formatDateTime(row.created_at)}
                  </td>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>{row.actor_name || "—"}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span
                      style={{
                        display: "inline-block", fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                        background: colors.bg, color: colors.fg,
                      }}
                    >
                      {ACTION_LABELS[row.action] ?? row.action}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", color: "#4b4e58" }}>{TABLE_LABELS[row.table_name] ?? row.table_name}</td>
                  <td style={{ padding: "10px 12px", color: "#33363f" }}>
                    {row.summary || "—"}
                    {hasDiff ? <span style={{ marginLeft: 6, color: "#8a8d98", fontSize: 10.5 }}>{expanded ? "▲ ocultar" : "▼ ver alterações"}</span> : null}
                  </td>
                </tr>
                {expanded && hasDiff ? (
                  <tr key={`${row.id}-diff`} style={{ background: "#fbfbfa" }}>
                    <td colSpan={5} style={{ padding: "0 12px 12px 12px" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                        <thead>
                          <tr style={{ color: "#8a8d98" }}>
                            <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: 600 }}>Campo</th>
                            <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: 600 }}>De</th>
                            <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: 600 }}>Para</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(row.changed_fields ?? {}).map(([field, diff]) => (
                            <tr key={field}>
                              <td style={{ padding: "4px 8px", fontWeight: 600, color: "#4b4e58" }}>{field}</td>
                              <td style={{ padding: "4px 8px", color: "#c0392b" }}>{formatFieldValue(diff.old)}</td>
                              <td style={{ padding: "4px 8px", color: "#1f9254" }}>{formatFieldValue(diff.new)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                ) : null}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
