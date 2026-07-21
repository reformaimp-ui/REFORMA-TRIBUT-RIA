"use client";

import { useRouter } from "next/navigation";
import { ACCENT, av, catMeta, progColor, statusLabel, toBRshort } from "@/lib/design";
import type { TaskListItem } from "@/lib/tasks";
import { deleteTask } from "./actions";

type MemberLite = { ini: string; color: string; name: string };

export function TaskCard({
  task,
  members,
  clienteFilter,
}: {
  task: TaskListItem;
  members: Record<string, MemberLite>;
  clienteFilter: string;
}) {
  const router = useRouter();
  const cm = catMeta[task.category] || catMeta.Fiscal;
  const links = clienteFilter === "all" ? task.links : task.links.filter((l) => l.clientId === clienteFilter);
  const open = (clientId?: string) =>
    router.push(`/tarefas/${task.id}${clientId ? `?cliente=${clientId}` : ""}`);

  return (
    <div
      onClick={() => open(task.links[0]?.clientId)}
      className="hv-card"
      style={{
        background: "#fff",
        border: "1px solid #e7e7e3",
        borderRadius: 12,
        padding: "16px 18px",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
        <div style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: cm.bg, color: cm.fg }}>
          {task.category}
        </div>
        {task.rec ? (
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: 99,
              background: "#eef1ff",
              color: ACCENT,
              fontFamily: "var(--font-jetbrains)",
            }}
          >
            ↻ {task.recLabel}
          </div>
        ) : null}
        <div style={{ fontSize: 11, color: "#8a8d98", fontFamily: "var(--font-jetbrains)" }}>
          {toBRshort(task.startDate)} → {toBRshort(task.dueDate)}
        </div>
        <div
          style={{
            marginLeft: "auto",
            fontSize: 11,
            fontWeight: 600,
            color: task.avgPct === null ? "#a0a3ad" : progColor(task.avgPct),
          }}
        >
          {task.avgPct === null ? "Sem clientes" : `${task.avgPct}% em média`}
        </div>
        <form action={deleteTask} onClick={(e) => e.stopPropagation()}>
          <input type="hidden" name="id" value={task.id} />
          <button
            type="submit"
            title="Excluir tarefa"
            className="hv-danger"
            style={{ color: "#c2c3c9", cursor: "pointer", padding: 2, background: "none", border: "none" }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15">
              <path
                d="M2 3.5h11M6 3.5V2h3v1.5M3.5 3.5l.7 9.5h6.6l.7-9.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, marginTop: 9, lineHeight: 1.4, textWrap: "pretty" }}>
        {task.title}
      </div>
      <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
        {task.peopleIds.map((pid, i) => {
          const p = members[pid];
          if (!p) return null;
          return (
            <div
              key={pid}
              title={p.name}
              style={{ ...av(p.color, 22), border: "2px solid #fff", marginLeft: i ? -8 : 0 }}
            >
              {p.ini}
            </div>
          );
        })}
        <div style={{ fontSize: 11, color: "#8a8d98", marginLeft: 8 }}>{task.subtaskCount} subtarefas</div>
      </div>
      <div style={{ height: 1, background: "#f0f0ed", margin: "12px 0" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {links.map((l) => (
          <div
            key={l.tcId}
            onClick={(e) => {
              e.stopPropagation();
              open(l.clientId);
            }}
            className="hv-soft"
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 6px", borderRadius: 8 }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                flex: "none",
                borderRadius: 99,
                background: l.color,
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontSize: 9,
                fontWeight: 700,
              }}
            >
              {l.ini}
            </div>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 500,
                width: 150,
                flex: "none",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {l.name}
            </div>
            <div style={{ flex: 1, height: 6, background: "#f0f0ed", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${l.pct}%`, height: "100%", borderRadius: 99, background: progColor(l.pct) }} />
            </div>
            <div style={{ fontSize: 11, color: "#6b6e78", fontFamily: "var(--font-jetbrains)", width: 34, textAlign: "right" }}>
              {l.pct}%
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, color: "#fff", background: progColor(l.pct) }}>
              {statusLabel(l.pct)}
            </div>
          </div>
        ))}
        {links.length === 0 ? (
          <div style={{ fontSize: 11.5, color: "#a0a3ad", fontStyle: "italic", padding: "4px 6px" }}>
            Nenhum cliente vinculado
          </div>
        ) : null}
      </div>
    </div>
  );
}
