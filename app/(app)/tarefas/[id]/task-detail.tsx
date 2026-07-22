"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ACCENT, av, catMeta, CATEGORY_OPTIONS, progColor } from "@/lib/design";
import { ConfirmForm } from "@/components/app/ConfirmForm";
import {
  addComment,
  addSubtask,
  deleteTask,
  linkClient,
  removeSubtask,
  toggleCompletion,
  togglePerson,
  toggleRec,
  unlinkClient,
  updateTaskField,
} from "../actions";

type Sub = { id: string; title: string };
type Link = { tcId: string; clientId: string; name: string; ini: string; color: string; pct: number; done: string[] };
type Comment = { id: string; text: string; time: string; name: string; ini: string; color: string };
type Opt = { id: string; name: string };

export type TaskDetailData = {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string | null;
  dueDate: string | null;
  rec: boolean;
  recLabel: string;
  flowId: string | null;
  flowName: string | null;
  subtasks: Sub[];
  peopleIds: string[];
  links: Link[];
  comments: Comment[];
};

const LBL: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 600,
  color: "#8a8d98",
  textTransform: "uppercase",
  letterSpacing: ".05em",
  marginBottom: 6,
};

export function TaskDetail({
  task,
  members,
  clients,
  flows,
  initialActive,
}: {
  task: TaskDetailData;
  members: Opt[];
  clients: Opt[];
  flows: Opt[];
  initialActive: string | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(task.description);
  const [subInput, setSubInput] = useState("");
  const [comment, setComment] = useState("");
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<string | null>(
    initialActive && task.links.some((l) => l.clientId === initialActive)
      ? initialActive
      : task.links[0]?.clientId ?? null,
  );

  const cm = catMeta[task.category] || catMeta.Fiscal;
  const activeLink = task.links.find((l) => l.clientId === active) ?? null;
  const available = clients.filter((c) => !task.links.some((l) => l.clientId === c.id));
  const availFiltered = available.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  const call = (action: (fd: FormData) => Promise<void> | void, fields: Record<string, string>) => {
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => fd.set(k, v));
    startTransition(() => {
      void action(fd);
    });
  };
  const setField = (field: string, value: string) => call(updateTaskField, { id: task.id, field, value });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 12, padding: "14px 22px", background: "#fff", borderBottom: "1px solid #e7e7e3" }}>
        <button onClick={() => router.push("/tarefas")} className="hv-light" style={{ width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center", cursor: "pointer", color: "#4b4e58", background: "none", border: "none" }}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Tarefa</div>
        <ConfirmForm action={deleteTask} message={`Excluir a tarefa "${task.title}"?`} style={{ marginLeft: "auto" }}>
          <input type="hidden" name="id" value={task.id} />
          <button type="submit" title="Excluir tarefa" className="hv-danger" style={{ color: "#c2c3c9", cursor: "pointer", padding: 4, background: "none", border: "none" }}>
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M2.5 4h11M6 4V2.3h4V4M4 4l.8 10h6.4l.8-10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </ConfirmForm>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "24px 28px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 24, alignItems: "start" }}>
          {/* left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
            <input
              className="fc hv-inbdr"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => title.trim() && title !== task.title && setField("title", title.trim())}
              style={{ font: "700 19px var(--font-instrument)", border: "1px solid transparent", borderRadius: 8, padding: "6px 8px", outline: "none", margin: "0 -8px" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: cm.bg, color: cm.fg }}>{task.category}</div>
              <select value={task.category} onChange={(e) => setField("category", e.target.value)} style={{ fontSize: 12, padding: "6px 10px", borderRadius: 8, border: "1.5px solid #e4d9fb", background: "#f5f0ff", color: "#7c3aed", fontWeight: 700 }}>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input type="date" value={task.startDate ?? ""} onChange={(e) => setField("start_date", e.target.value)} style={{ fontSize: 11.5, padding: "5px 7px", borderRadius: 7, border: "1px solid #e2e2de", color: "#4b4e58" }} />
              <div style={{ fontSize: 12, color: "#a0a3ad" }}>→</div>
              <input type="date" value={task.dueDate ?? ""} onChange={(e) => setField("due_date", e.target.value)} style={{ fontSize: 11.5, padding: "5px 7px", borderRadius: 7, border: "1px solid #e2e2de", color: "#4b4e58" }} />
              <div
                onClick={() => call(toggleRec, { id: task.id, rec: task.rec ? "true" : "false" })}
                style={{ width: 34, height: 19, borderRadius: 99, cursor: "pointer", background: task.rec ? ACCENT : "#d8d8d4", position: "relative" }}
              >
                <div style={{ width: 15, height: 15, borderRadius: 99, background: "#fff", position: "absolute", top: 2, left: task.rec ? 17 : 2 }} />
              </div>
              <div style={{ fontSize: 11.5, color: "#8a8d98" }}>Recorrente</div>
              {task.rec ? (
                <select value={task.recLabel} onChange={(e) => setField("rec_label", e.target.value)} style={{ fontSize: 12, padding: "6px 10px", borderRadius: 8, border: "1.5px solid #d9deff", background: "#eef1ff", color: ACCENT, fontWeight: 700 }}>
                  <option value="mensal">Mensal</option>
                  <option value="anual">Anual</option>
                </select>
              ) : null}
            </div>
            <div>
              <div style={LBL}>Descrição</div>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                onBlur={() => desc !== task.description && setField("description", desc)}
                rows={3}
                placeholder="Sem descrição — adicione notas sobre esta tarefa…"
                style={{ width: "100%", font: "400 13px var(--font-instrument)", border: "1px solid #e2e2de", borderRadius: 10, padding: "11px 13px", outline: "none", resize: "vertical", lineHeight: 1.6 }}
              />
            </div>
            <div style={{ height: 1, background: "#f0f0ed" }} />
            <div>
              <div style={{ ...LBL, marginBottom: 2 }}>Subtarefas</div>
              {activeLink ? (
                <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 8 }}>
                  Progresso de <b>{activeLink.name}</b> — {activeLink.pct}%
                </div>
              ) : null}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {task.subtasks.map((s) => {
                  const done = activeLink ? activeLink.done.includes(s.id) : false;
                  return (
                    <div key={s.id} className="hv-soft" style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 4px", borderRadius: 8 }}>
                      <div
                        onClick={() =>
                          activeLink &&
                          call(toggleCompletion, { taskClientId: activeLink.tcId, subtaskId: s.id, taskId: task.id })
                        }
                        style={{
                          width: 18,
                          height: 18,
                          flex: "none",
                          borderRadius: 5,
                          display: "grid",
                          placeItems: "center",
                          cursor: activeLink ? "pointer" : "default",
                          background: done ? progColor(100) : "#fff",
                          border: `1.5px solid ${done ? progColor(100) : "#d8d8d4"}`,
                          opacity: activeLink ? 1 : 0.5,
                        }}
                      >
                        {done ? (
                          <svg width="10" height="10" viewBox="0 0 10 10">
                            <path d="M1 5l2.5 2.5L9 1.5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : null}
                      </div>
                      <div style={{ fontSize: 12.5, flex: 1, color: done ? "#a0a3ad" : "#33363f", textDecoration: done ? "line-through" : "none" }}>{s.title}</div>
                      <div onClick={() => call(removeSubtask, { id: s.id, taskId: task.id })} className="hv-danger" style={{ color: "#c2c3c9", cursor: "pointer" }}>
                        ✕
                      </div>
                    </div>
                  );
                })}
              </div>
              <input
                value={subInput}
                onChange={(e) => setSubInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && subInput.trim()) {
                    call(addSubtask, { taskId: task.id, title: subInput.trim() });
                    setSubInput("");
                  }
                }}
                placeholder="Nova subtarefa — Enter para adicionar"
                style={{ width: "100%", fontSize: 12.5, padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e2de", outline: "none", marginTop: 6 }}
              />
            </div>
            <div style={{ height: 1, background: "#f0f0ed" }} />
            <div>
              <div style={{ ...LBL, marginBottom: 10 }}>Comentários</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
                {task.comments.map((c) => (
                  <div key={c.id} style={{ display: "flex", gap: 10 }}>
                    <div style={av(c.color, 26)}>{c.ini}</div>
                    <div style={{ flex: 1, background: "#f7f7f4", borderRadius: 10, padding: "9px 12px" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{c.name}</div>
                        <div style={{ fontSize: 10.5, color: "#a0a3ad" }}>{c.time}</div>
                      </div>
                      <div style={{ fontSize: 12.5, color: "#33363f", marginTop: 3, lineHeight: 1.5, textWrap: "pretty" }}>{c.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Escreva um comentário…" style={{ flex: 1, font: "400 12.5px var(--font-instrument)", border: "1px solid #e2e2de", borderRadius: 10, padding: "9px 11px", outline: "none", resize: "vertical" }} />
                <button
                  onClick={() => {
                    if (comment.trim()) {
                      call(addComment, { taskId: task.id, text: comment.trim() });
                      setComment("");
                    }
                  }}
                  className="hv-btn"
                  style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: ACCENT, padding: "9px 14px", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap", border: "none" }}
                >
                  Comentar
                </button>
              </div>
            </div>
          </div>

          {/* right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
            <div>
              <div style={LBL}>Pessoas envolvidas</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {members.map((m) => {
                  const picked = task.peopleIds.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => call(togglePerson, { taskId: task.id, memberId: m.id })}
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "6px 12px",
                        borderRadius: 99,
                        cursor: "pointer",
                        border: `1px solid ${picked ? ACCENT : "#e2e2de"}`,
                        color: picked ? "#fff" : "#4b4e58",
                        background: picked ? ACCENT : "#fff",
                      }}
                    >
                      {m.name.split(" ")[0]}
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <div style={{ ...LBL, marginBottom: 8 }}>Clientes &amp; progresso ({task.links.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 280, overflow: "auto", marginBottom: 8 }}>
                {task.links.map((l) => (
                  <div
                    key={l.tcId}
                    onClick={() => setActive(l.clientId)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      padding: "7px 8px",
                      borderRadius: 8,
                      border: `1.5px solid ${l.clientId === active ? ACCENT : "transparent"}`,
                      background: l.clientId === active ? "#f7f8ff" : "transparent",
                    }}
                  >
                    <div style={{ ...av(l.color, 22), fontSize: 9.5 }}>{l.ini}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.name}</div>
                    <div style={{ fontSize: 10.5, color: "#6b6e78", fontFamily: "var(--font-jetbrains)" }}>{l.pct}%</div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        call(unlinkClient, { taskClientId: l.tcId, taskId: task.id });
                      }}
                      title="Desvincular"
                      className="hv-danger"
                      style={{ color: "#c2c3c9", cursor: "pointer" }}
                    >
                      <svg width="12" height="12" viewBox="0 0 13 13">
                        <path d="M2.5 2.5l8 8M10.5 2.5l-8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
              {adding ? (
                <div style={{ border: "1px solid #e2e2de", borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
                  <input value={search} onChange={(e) => setSearch(e.target.value)} autoFocus placeholder="Buscar cliente…" style={{ width: "100%", border: "none", borderBottom: "1px solid #e2e2de", padding: "9px 11px", fontSize: 12, outline: "none" }} />
                  <div style={{ maxHeight: 200, overflow: "auto", padding: 4 }}>
                    {availFiltered.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          call(linkClient, { taskId: task.id, clientId: c.id });
                          setActive(c.id);
                          setAdding(false);
                          setSearch("");
                        }}
                        className="hv-soft"
                        style={{ fontSize: 12.5, padding: "7px 9px", borderRadius: 7, cursor: "pointer" }}
                      >
                        {c.name}
                      </div>
                    ))}
                    {availFiltered.length === 0 ? <div style={{ fontSize: 12, color: "#a0a3ad", padding: "7px 9px" }}>Nenhum cliente disponível.</div> : null}
                  </div>
                </div>
              ) : null}
              <div onClick={() => setAdding(!adding)} style={{ fontSize: 11.5, fontWeight: 600, color: ACCENT, cursor: "pointer" }}>
                + Vincular cliente
              </div>
            </div>
            <div>
              <div style={LBL}>Fluxo vinculado</div>
              <select value={task.flowId ?? ""} onChange={(e) => setField("flow_id", e.target.value)} style={{ width: "100%", fontSize: 12, padding: "8px 11px", borderRadius: 9, border: "1.5px solid #f5e4c8", background: "#fdf3e6", color: "#b5750f", fontWeight: 700, marginBottom: 8 }}>
                <option value="">Nenhum</option>
                {flows.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              {task.flowName ? (
                <div onClick={() => router.push(`/fluxos/${task.flowId}`)} className="hv-dim" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: ACCENT, background: "#eef1ff", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}>
                  <svg width="13" height="13" viewBox="0 0 15 15">
                    <circle cx="3" cy="3.5" r="2.2" fill="currentColor" />
                    <circle cx="12" cy="7.5" r="2.2" fill="currentColor" opacity=".45" />
                    <circle cx="4" cy="12" r="2.2" fill="currentColor" opacity=".7" />
                    <path d="M5 4.5l5 2M5.5 10.8l4.5-2.5" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                  Abrir {task.flowName}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
