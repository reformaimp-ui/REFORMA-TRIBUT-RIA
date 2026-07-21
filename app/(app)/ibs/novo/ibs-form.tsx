"use client";

import { useActionState, useState } from "react";
import { ACCENT } from "@/lib/design";
import { ImportPanel } from "@/components/app/ImportPanel";
import { addBatch, addCclass, addCst, addCstLink, addProduto, type IbsState } from "../actions";

type Code = { code: string; descr: string };
const INP: React.CSSProperties = { width: "100%", fontSize: 13, padding: "9px 11px", borderRadius: 8, border: "1px solid #e2e2de", outline: "none" };
const MONO = { ...INP, fontFamily: "var(--font-jetbrains)" } as React.CSSProperties;
const LBL: React.CSSProperties = { fontSize: 10.5, fontWeight: 600, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 };
const BTN: React.CSSProperties = { alignSelf: "flex-start", fontSize: 12, fontWeight: 600, color: "#fff", background: ACCENT, padding: "9px 16px", borderRadius: 8, border: "none", cursor: "pointer" };

function pill(active: boolean): React.CSSProperties {
  return { fontSize: 12.5, fontWeight: 600, padding: "8px 16px", borderRadius: 8, cursor: "pointer", color: active ? "#fff" : "#4b4e58", background: active ? ACCENT : "#fff", border: `1px solid ${active ? ACCENT : "#e2e2de"}` };
}

const TEMPLATES: Record<string, { filename: string; rows: string[][] }> = {
  cst: {
    filename: "modelo-cst.xlsx",
    rows: [
      ["CST", "Descrição"],
      ["200", "Alíquota zero"],
      ["210", "Alíquota reduzida"],
      ["400", "Imunidade"],
    ],
  },
  cclass: {
    filename: "modelo-cclasstrib.xlsx",
    rows: [
      ["cClassTrib", "Descrição"],
      ["200001", "Cesta básica nacional — alíquota zero"],
      ["210001", "Medicamentos — redução de 60%"],
      ["400001", "Livros e periódicos — imunidade"],
    ],
  },
  produto: {
    filename: "modelo-produtos.xlsx",
    rows: [
      ["NCM", "Descrição", "CST", "cClassTrib", "Alíq. IBS", "Alíq. CBS", "Red. IBS", "Red. CBS"],
      ["1006.30.11", "Arroz beneficiado", "200", "200001", "17,7%", "8,8%", "100%", "100%"],
      ["3004.90.99", "Medicamento de uso humano", "210", "210001", "17,7%", "8,8%", "60%", "60%"],
    ],
  },
  vinculo: {
    filename: "modelo-vinculo-cst-cclasstrib.xlsx",
    rows: [
      ["CST", "cClassTrib"],
      ["000", "000001"],
      ["000", "000002"],
      ["000", "000003"],
      ["000", "000004"],
      ["000", "000005"],
      ["010", "010001"],
      ["010", "010002"],
      ["011", "011001"],
      ["011", "011002"],
      ["011", "011003"],
      ["011", "011004"],
    ],
  },
};

function Batch({ type, placeholder, desc }: { type: string; placeholder: string; desc: React.ReactNode }) {
  const [state, action, pending] = useActionState<IbsState, FormData>(addBatch, {});
  return (
    <ImportPanel
      action={action}
      pending={pending}
      error={state.error}
      hidden={{ type }}
      desc={desc}
      placeholder={placeholder}
      noun="registro(s)"
      confirmLabel={(n) => `Importar ${n} registro(s)`}
      template={TEMPLATES[type] ?? TEMPLATES.cst}
      format="xlsx"
    />
  );
}

export function IbsForm({ initial, cstRows, cclassRows }: { initial: string; cstRows: Code[]; cclassRows: Code[] }) {
  const [type, setType] = useState(
    initial === "produto" ? "produto" : initial === "cclass" ? "cclass" : initial === "vinculo" ? "vinculo" : "cst",
  );
  const [cstState, cstAction, cstPending] = useActionState<IbsState, FormData>(addCst, {});
  const [ccState, ccAction, ccPending] = useActionState<IbsState, FormData>(addCclass, {});
  const [pState, pAction, pPending] = useActionState<IbsState, FormData>(addProduto, {});
  const [lkState, lkAction, lkPending] = useActionState<IbsState, FormData>(addCstLink, {});

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        <div onClick={() => setType("cst")} style={pill(type === "cst")}>CST</div>
        <div onClick={() => setType("cclass")} style={pill(type === "cclass")}>cClassTrib</div>
        <div onClick={() => setType("produto")} style={pill(type === "produto")}>Tributação de produto</div>
        <div onClick={() => setType("vinculo")} style={pill(type === "vinculo")}>Vínculo CST × cClassTrib</div>
      </div>

      {type === "cst" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
          <form action={cstAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".06em" }}>Cadastro individual</div>
            <div><div style={LBL}>Código CST</div><input className="fc" name="code" placeholder="Ex.: 200" autoFocus style={MONO} /></div>
            <div><div style={LBL}>Descrição</div><input className="fc" name="descr" placeholder="Descrição do CST" style={INP} /></div>
            {cstState.error ? <div style={{ fontSize: 12, color: "#b3402e" }}>{cstState.error}</div> : null}
            <button type="submit" disabled={cstPending} className="hv-btn" style={{ ...BTN, marginTop: 4, opacity: cstPending ? 0.7 : 1 }}>Adicionar CST</button>
          </form>
          <Batch type="cst" placeholder={"200\tAlíquota zero\n210\tAlíquota reduzida"} desc={<span>Uma linha por código — colunas <b>CST, Descrição</b> — ou importe um .xlsx.</span>} />
        </div>
      ) : null}

      {type === "cclass" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
          <form action={ccAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".06em" }}>Cadastro individual</div>
            <div><div style={LBL}>Código cClassTrib</div><input className="fc" name="code" placeholder="Ex.: 200001" autoFocus style={MONO} /></div>
            <div><div style={LBL}>Descrição</div><input className="fc" name="descr" placeholder="Descrição do cClassTrib" style={INP} /></div>
            {ccState.error ? <div style={{ fontSize: 12, color: "#b3402e" }}>{ccState.error}</div> : null}
            <button type="submit" disabled={ccPending} className="hv-btn" style={{ ...BTN, marginTop: 4, opacity: ccPending ? 0.7 : 1 }}>Adicionar cClassTrib</button>
          </form>
          <Batch type="cclass" placeholder={"200001\tCesta básica nacional\n210001\tMedicamentos — redução 60%"} desc={<span>Uma linha por código — colunas <b>cClassTrib, Descrição</b> — ou importe um .xlsx.</span>} />
        </div>
      ) : null}

      {type === "produto" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
          <form action={pAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".06em" }}>Cadastro individual</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><div style={LBL}>NCM</div><input className="fc" name="ncm" placeholder="Ex.: 1006.30.11" autoFocus style={MONO} /></div>
              <div><div style={LBL}>Descrição</div><input className="fc" name="descr" placeholder="Descrição" style={INP} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={LBL}>CST</div>
                {cstRows.length ? (
                  <select name="cst" defaultValue={cstRows[0]?.code} style={INP}>{cstRows.map((r) => <option key={r.code} value={r.code}>{r.code} — {r.descr}</option>)}</select>
                ) : (
                  <input className="fc" name="cst" placeholder="Ex.: 200" style={MONO} />
                )}
              </div>
              <div>
                <div style={LBL}>cClassTrib</div>
                {cclassRows.length ? (
                  <select name="cclass" defaultValue={cclassRows[0]?.code} style={INP}>{cclassRows.map((r) => <option key={r.code} value={r.code}>{r.code} — {r.descr}</option>)}</select>
                ) : (
                  <input className="fc" name="cclass" placeholder="Ex.: 200001" style={MONO} />
                )}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><div style={LBL}>Alíquota IBS</div><input className="fc" name="aliq_ibs" placeholder="17,7%" style={INP} /></div>
              <div><div style={LBL}>Alíquota CBS</div><input className="fc" name="aliq_cbs" placeholder="8,8%" style={INP} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><div style={LBL}>Redução IBS</div><input className="fc" name="red_ibs" placeholder="60%" style={INP} /></div>
              <div><div style={LBL}>Redução CBS</div><input className="fc" name="red_cbs" placeholder="60%" style={INP} /></div>
            </div>
            {pState.error ? <div style={{ fontSize: 12, color: "#b3402e" }}>{pState.error}</div> : null}
            <button type="submit" disabled={pPending} className="hv-btn" style={{ ...BTN, marginTop: 4, opacity: pPending ? 0.7 : 1 }}>Adicionar produto</button>
          </form>
          <Batch type="produto" placeholder={"1006.30.11\tArroz beneficiado\t200\t200001\t17,7%\t8,8%\t100%\t100%"} desc={<span>Uma linha por produto — colunas <b>NCM, Descrição, CST, cClassTrib, Alíq. IBS, Alíq. CBS, Red. IBS, Red. CBS</b> — ou importe um .xlsx.</span>} />
        </div>
      ) : null}

      {type === "vinculo" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
          <form action={lkAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".06em" }}>Cadastro individual</div>
            <div>
              <div style={LBL}>CST</div>
              {cstRows.length ? (
                <select name="cst" defaultValue={cstRows[0]?.code} style={INP}>{cstRows.map((r) => <option key={r.code} value={r.code}>{r.code} — {r.descr}</option>)}</select>
              ) : (
                <input className="fc" name="cst" placeholder="Ex.: 000" autoFocus style={MONO} />
              )}
            </div>
            <div>
              <div style={LBL}>cClassTrib</div>
              {cclassRows.length ? (
                <select name="cclass" defaultValue={cclassRows[0]?.code} style={INP}>{cclassRows.map((r) => <option key={r.code} value={r.code}>{r.code} — {r.descr}</option>)}</select>
              ) : (
                <input className="fc" name="cclass" placeholder="Ex.: 000001" style={MONO} />
              )}
            </div>
            {lkState.error ? <div style={{ fontSize: 12, color: "#b3402e" }}>{lkState.error}</div> : null}
            <button type="submit" disabled={lkPending} className="hv-btn" style={{ ...BTN, marginTop: 4, opacity: lkPending ? 0.7 : 1 }}>Vincular</button>
          </form>
          <Batch type="vinculo" placeholder={"000\t000001\n000\t000002\n010\t010001"} desc={<span>Uma linha por vínculo — colunas <b>CST, cClassTrib</b> — ou importe um .xlsx.</span>} />
        </div>
      ) : null}
    </div>
  );
}
