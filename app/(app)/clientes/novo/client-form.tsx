"use client";

import { useActionState } from "react";
import { ACCENT, REGIME_OPTIONS } from "@/lib/design";
import { ImportPanel } from "@/components/app/ImportPanel";
import { addClientSingle, addClientsBatch, type ClientFormState } from "../actions";

const INP: React.CSSProperties = {
  width: "100%",
  fontSize: 13,
  padding: "9px 11px",
  borderRadius: 8,
  border: "1px solid #e2e2de",
  outline: "none",
};
const LBL: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 600,
  color: "#8a8d98",
  textTransform: "uppercase",
  letterSpacing: ".05em",
  marginBottom: 6,
};

const TEMPLATE = `Nome, Setor, Regime
Padaria Sol Nascente, Alimentação, Simples Nacional
Transportes Rio Verde, Logística, Lucro Real
Clínica Vida Plena, Saúde, Lucro Presumido
`;

export function ClientForm() {
  const [single, singleAction, singlePending] = useActionState<ClientFormState, FormData>(
    addClientSingle,
    {},
  );
  const [batch, batchAction, batchPending] = useActionState<ClientFormState, FormData>(
    addClientsBatch,
    {},
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
      <form action={singleAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".06em" }}>
          Cadastro individual
        </div>
        <div>
          <div style={LBL}>Nome do cliente</div>
          <input className="fc" name="name" placeholder="Razão social" autoFocus style={INP} />
        </div>
        <div>
          <div style={LBL}>Setor</div>
          <input className="fc" name="setor" placeholder="Ex.: Varejo alimentar" style={INP} />
        </div>
        <div>
          <div style={LBL}>Regime tributário</div>
          <select
            className="fc"
            name="regime"
            defaultValue="Simples Nacional"
            style={{ ...INP, fontWeight: 700, color: "#0e7a6f", background: "#eef6f2", border: "1.5px solid #d3ecdf", borderRadius: 9 }}
          >
            {REGIME_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        {single.error ? <div style={{ fontSize: 12, color: "#b3402e" }}>{single.error}</div> : null}
        <button
          type="submit"
          disabled={singlePending}
          className="hv-btn"
          style={{
            alignSelf: "flex-start",
            fontSize: 12,
            fontWeight: 600,
            color: "#fff",
            background: ACCENT,
            padding: "9px 16px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            marginTop: 4,
            opacity: singlePending ? 0.7 : 1,
          }}
        >
          {singlePending ? "Adicionando…" : "Adicionar cliente"}
        </button>
      </form>

      <ImportPanel
        action={batchAction}
        pending={batchPending}
        error={batch.error}
        desc={
          <span>
            Uma linha por cliente — <b>Nome, Setor, Regime</b> (setor e regime são opcionais).
          </span>
        }
        placeholder={"Padaria Sol Nascente, Alimentação, Simples Nacional\nTransportes Rio Verde, Logística, Lucro Real"}
        noun="cliente(s)"
        confirmLabel={(n) => `Importar ${n} cliente(s)`}
        template={{ filename: "modelo-clientes.csv", content: TEMPLATE }}
      />
    </div>
  );
}
