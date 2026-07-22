"use client";

import { useState, useTransition } from "react";
import { ACCENT } from "@/lib/design";
import { addChange } from "./actions";

const LBL: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: "#1c1e26", marginBottom: 8 };
const REQ = <span style={{ color: "#b3402e" }}> *</span>;
const FIELD: React.CSSProperties = {
  width: "100%",
  fontSize: 13.5,
  padding: "11px 14px",
  borderRadius: 10,
  border: "1.5px solid #e2e2de",
  outline: "none",
  background: "#fff",
  color: "#33363f",
};

function monthTitle(mk: string) {
  const [yy, mm] = mk.split("-").map(Number);
  const name = new Date(yy, mm - 1, 1).toLocaleDateString("pt-BR", { month: "long" });
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${yy}`;
}

export function AddChange({ month }: { month: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [severity, setSeverity] = useState("informativo");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const valid = title.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date);

  const close = () => {
    setOpen(false);
    setTitle("");
    setDescription("");
    setDate("");
    setSeverity("informativo");
    setError(null);
  };

  const submit = () => {
    if (!valid || pending) return;
    setError(null);
    const fd = new FormData();
    fd.set("month", month);
    fd.set("title", title.trim());
    fd.set("description", description.trim());
    fd.set("date", date);
    fd.set("severity", severity);
    startTransition(async () => {
      const res = await addChange(fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      close();
    });
  };

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="hv-dim"
        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, color: ACCENT, background: "#eef1ff", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}
      >
        + Nova mudança
      </div>

      {open ? (
        <>
          <div onClick={close} className="overlay-in" style={{ position: "fixed", inset: 0, background: "rgba(20,20,30,.45)", zIndex: 60 }} />
          <div
            role="dialog"
            className="modal-in"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              width: 460,
              maxWidth: "94vw",
              maxHeight: "92vh",
              overflow: "auto",
              background: "#fff",
              borderRadius: 16,
              zIndex: 70,
              padding: "26px 30px",
              boxShadow: "0 24px 80px rgba(20,20,30,.3)",
              cursor: "default",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-.01em" }}>Nova Mudança — {monthTitle(month)}</div>
              <div onClick={close} className="hv-gray" style={{ marginLeft: "auto", fontSize: 16, color: "#8a8d98", cursor: "pointer", padding: 4, lineHeight: 1 }}>✕</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <div style={LBL}>Título{REQ}</div>
                <input
                  className="fc"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                  placeholder="Ex: Vigência da alíquota do IBS..."
                  style={FIELD}
                />
              </div>

              <div>
                <div style={LBL}>Descrição</div>
                <textarea
                  className="fc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Detalhes sobre a mudança..."
                  style={{ ...FIELD, resize: "vertical", lineHeight: 1.5, fontFamily: "inherit" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={LBL}>Data exata{REQ}</div>
                  <input className="fc" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={FIELD} />
                </div>
                <div>
                  <div style={LBL}>Urgência</div>
                  <select className="fc" value={severity} onChange={(e) => setSeverity(e.target.value)} style={{ ...FIELD, cursor: "pointer" }}>
                    <option value="informativo">Informativo</option>
                    <option value="importante">Importante</option>
                    <option value="critico">Crítico</option>
                  </select>
                </div>
              </div>

              {error ? <div style={{ fontSize: 12, color: "#b3402e" }}>{error}</div> : null}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
                <button
                  onClick={close}
                  className="hv-light"
                  style={{ fontSize: 13, fontWeight: 700, color: "#1c1e26", background: "#fff", border: "1.5px solid #e2e2de", borderRadius: 10, padding: "10px 18px", cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  onClick={submit}
                  disabled={!valid || pending}
                  className={valid ? "hv-btn" : undefined}
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#fff",
                    background: ACCENT,
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 18px",
                    cursor: valid && !pending ? "pointer" : "not-allowed",
                    opacity: valid && !pending ? 1 : 0.45,
                  }}
                >
                  {pending ? "Criando…" : "Criar mudança"}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
