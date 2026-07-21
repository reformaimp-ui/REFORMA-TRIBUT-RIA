"use client";

import { useActionState, useState } from "react";
import { ACCENT, CATEGORY_OPTIONS } from "@/lib/design";
import { createTask, type CreateTaskState } from "../actions";

type Opt = { id: string; name: string };

const LBL: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 600,
  color: "#8a8d98",
  textTransform: "uppercase",
  letterSpacing: ".05em",
  marginBottom: 6,
};

function chip(active: boolean): React.CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 600,
    padding: "6px 12px",
    borderRadius: 99,
    cursor: "pointer",
    border: `1px solid ${active ? ACCENT : "#e2e2de"}`,
    color: active ? "#fff" : "#4b4e58",
    background: active ? ACCENT : "#fff",
  };
}

export function CreateForm({
  members,
  clients,
  flows,
}: {
  members: Opt[];
  clients: Opt[];
  flows: Opt[];
}) {
  const [state, formAction, pending] = useActionState<CreateTaskState, FormData>(createTask, {});
  const [people, setPeople] = useState<string[]>([]);
  const [pickedClients, setPickedClients] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [subInput, setSubInput] = useState("");
  const [rec, setRec] = useState(false);
  const [search, setSearch] = useState("");

  const clientById = Object.fromEntries(clients.map((c) => [c.id, c]));
  const filtered = clients.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <form action={formAction} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 24, alignItems: "start" }}>
      <input type="hidden" name="people" value={JSON.stringify(people)} />
      <input type="hidden" name="clients" value={JSON.stringify(pickedClients)} />
      <input type="hidden" name="subtasks" value={JSON.stringify(subtasks)} />
      <input type="hidden" name="rec" value={rec ? "true" : "false"} />

      <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
        <input
          className="fc"
          name="title"
          placeholder="Título da tarefa"
          autoFocus
          style={{ font: "700 19px var(--font-instrument)", border: "none", borderBottom: "2px solid #e2e2de", padding: "6px 2px", outline: "none" }}
        />
        <textarea
          name="description"
          rows={3}
          placeholder="Descreva o objetivo desta tarefa…"
          style={{ width: "100%", font: "400 13px var(--font-instrument)", border: "1px solid #e2e2de", borderRadius: 10, padding: "11px 13px", outline: "none", resize: "vertical", lineHeight: 1.6 }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div>
            <div style={LBL}>Categoria</div>
            <select className="fc" name="category" defaultValue="Fiscal" style={{ width: "100%", fontSize: 12.5, padding: "7px 9px", borderRadius: 8, border: "1px solid #e2e2de", background: "#f5f0ff", color: "#7c3aed", fontWeight: 700 }}>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div style={LBL}>Data inicial</div>
            <input type="date" name="start" style={{ width: "100%", fontSize: 12.5, padding: "7px 9px", borderRadius: 8, border: "1px solid #e2e2de", color: "#33363f" }} />
          </div>
          <div>
            <div style={LBL}>Prazo final</div>
            <input type="date" name="due" style={{ width: "100%", fontSize: 12.5, padding: "7px 9px", borderRadius: 8, border: "1px solid #e2e2de", color: "#33363f" }} />
          </div>
        </div>
        <div>
          <div style={LBL}>Subtarefas</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
            {subtasks.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "#f7f7f4", borderRadius: 7, padding: "8px 10px" }}>
                <div style={{ fontSize: 12.5, flex: 1 }}>{s}</div>
                <div onClick={() => setSubtasks(subtasks.filter((_, j) => j !== i))} className="hv-danger" style={{ color: "#c2c3c9", cursor: "pointer" }}>
                  ✕
                </div>
              </div>
            ))}
          </div>
          <input
            value={subInput}
            onChange={(e) => setSubInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (subInput.trim()) {
                  setSubtasks([...subtasks, subInput.trim()]);
                  setSubInput("");
                }
              }
            }}
            placeholder="Nova subtarefa — Enter para adicionar"
            style={{ width: "100%", fontSize: 12.5, padding: "9px 11px", borderRadius: 8, border: "1px solid #e2e2de", outline: "none" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            onClick={() => setRec(!rec)}
            style={{ width: 34, height: 19, borderRadius: 99, cursor: "pointer", background: rec ? ACCENT : "#d8d8d4", position: "relative", transition: "background .15s" }}
          >
            <div style={{ width: 15, height: 15, borderRadius: 99, background: "#fff", position: "absolute", top: 2, left: rec ? 17 : 2, transition: "left .15s" }} />
          </div>
          <div style={{ fontSize: 12, color: "#4b4e58" }}>Recorrente</div>
          {rec ? (
            <select name="recLabel" defaultValue="mensal" style={{ fontSize: 12, padding: "6px 10px", borderRadius: 8, border: "1.5px solid #d9deff", background: "#eef1ff", color: ACCENT, fontWeight: 700 }}>
              <option value="mensal">Mensal</option>
              <option value="anual">Anual</option>
            </select>
          ) : null}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
        <div>
          <div style={LBL}>Pessoas envolvidas</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {members.map((m) => {
              const active = people.includes(m.id);
              return (
                <div
                  key={m.id}
                  onClick={() => setPeople(active ? people.filter((x) => x !== m.id) : [...people, m.id])}
                  style={chip(active)}
                >
                  {m.name.split(" ")[0]}
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div style={LBL}>Clientes vinculados ({pickedClients.length})</div>
          {pickedClients.length ? (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
              {pickedClients.map((cid) => (
                <div key={cid} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "4px 5px 4px 9px", borderRadius: 99, background: "#eef1ff", color: ACCENT }}>
                  {clientById[cid]?.name}
                  <span onClick={() => setPickedClients(pickedClients.filter((x) => x !== cid))} style={{ cursor: "pointer", padding: "1px 3px" }}>
                    ✕
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          <div style={{ border: "1px solid #e2e2de", borderRadius: 10, overflow: "hidden" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Buscar entre ${clients.length} clientes…`}
              style={{ width: "100%", border: "none", borderBottom: "1px solid #e2e2de", padding: "9px 11px", fontSize: 12, outline: "none" }}
            />
            <div style={{ maxHeight: 230, overflow: "auto", padding: 4 }}>
              {filtered.map((c) => {
                const picked = pickedClients.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => setPickedClients(picked ? pickedClients.filter((x) => x !== c.id) : [...pickedClients, c.id])}
                    style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 9px", borderRadius: 7, cursor: "pointer", background: picked ? "#eef1ff" : "transparent" }}
                  >
                    <div style={{ width: 16, height: 16, flex: "none", borderRadius: 4, border: `1.5px solid ${picked ? ACCENT : "#d8d8d4"}`, background: picked ? ACCENT : "#fff", display: "grid", placeItems: "center" }}>
                      {picked ? (
                        <svg width="9" height="9" viewBox="0 0 10 10">
                          <path d="M1 5l2.5 2.5L9 1.5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : null}
                    </div>
                    <div style={{ fontSize: 12.5 }}>{c.name}</div>
                  </div>
                );
              })}
              {filtered.length === 0 ? <div style={{ fontSize: 12, color: "#a0a3ad", padding: "7px 9px" }}>Nenhum cliente.</div> : null}
            </div>
          </div>
        </div>
        <div>
          <div style={LBL}>Fluxo vinculado</div>
          <select name="flowId" defaultValue="" style={{ width: "100%", fontSize: 12, padding: "8px 11px", borderRadius: 9, border: "1.5px solid #f5e4c8", background: "#fdf3e6", color: "#b5750f", fontWeight: 700 }}>
            <option value="">Nenhum</option>
            {flows.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        {state.error ? <div style={{ fontSize: 12, color: "#b3402e" }}>{state.error}</div> : null}
        <button
          type="submit"
          disabled={pending}
          className="hv-btn"
          style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: ACCENT, padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer", opacity: pending ? 0.7 : 1 }}
        >
          {pending ? "Criando…" : "Criar tarefa"}
        </button>
      </div>
    </form>
  );
}
