import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ACCENT } from "@/lib/design";

export const dynamic = "force-dynamic";

function tabStyle(active: boolean): React.CSSProperties {
  return {
    fontSize: 12.5, fontWeight: 600, padding: "8px 16px", borderRadius: 8,
    color: active ? "#fff" : "#4b4e58", background: active ? ACCENT : "#fff",
    border: `1px solid ${active ? ACCENT : "#e2e2de"}`,
  };
}
const th: React.CSSProperties = {
  padding: "10px 18px", background: "#fafaf8", borderBottom: "1px solid #ececea",
  fontSize: 10.5, fontWeight: 700, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".05em",
};

export default async function IbsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const sp = await searchParams;
  const tab = sp.tab === "produtos" ? "produtos" : "dados";
  const supabase = await createClient();
  const [{ data: cst }, { data: cclass }, { data: prod }] = await Promise.all([
    supabase.from("cst_rows").select("code,descr").order("position"),
    supabase.from("cclass_rows").select("code,descr").order("position"),
    supabase.from("produto_rows").select("ncm,descr,cst,cclass,aliq_ibs,aliq_cbs,red_ibs,red_cbs").order("position"),
  ]);

  return (
    <div className="stagger" style={{ padding: "20px 22px", height: "100%", overflow: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Link href="/ibs?tab=dados" style={tabStyle(tab === "dados")}>Dados do IBS e CBS</Link>
        <Link href="/ibs?tab=produtos" style={tabStyle(tab === "produtos")}>Tributação dos produtos</Link>
        <Link href={`/ibs/novo?tipo=${tab === "produtos" ? "produto" : "cst"}`} className="hv-btn" style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "#fff", background: ACCENT, borderRadius: 8, padding: "7px 14px" }}>
          + Adicionar dado
        </Link>
      </div>

      {tab === "dados" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>CSTs do IBS e CBS</div>
            <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>Código de Situação Tributária — Informe Técnico 2025.002 (RFB)</div>
            <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, ...th }}>
                <div>CST</div><div>Descrição</div>
              </div>
              {(cst ?? []).map((r: { code: string; descr: string }, i: number) => (
                <div key={i} className="hv-row" style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, alignItems: "center", padding: "10px 18px", borderBottom: "1px solid #f0f0ed" }}>
                  <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 700, color: ACCENT }}>{r.code}</div>
                  <div style={{ fontSize: 12.5, color: "#33363f" }}>{r.descr}</div>
                </div>
              ))}
              {(cst ?? []).length === 0 ? (
                <div style={{ padding: 18, fontSize: 12.5, color: "#a0a3ad", fontStyle: "italic" }}>Nenhum CST cadastrado — use “+ Adicionar dado”.</div>
              ) : null}
            </div>
          </section>
          <section>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>cClassTrib do IBS e CBS</div>
            <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>Código de Classificação Tributária — os 3 primeiros dígitos coincidem com o CST</div>
            <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, ...th }}>
                <div>cClassTrib</div><div>Descrição</div>
              </div>
              {(cclass ?? []).map((r: { code: string; descr: string }, i: number) => (
                <div key={i} className="hv-row" style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, alignItems: "center", padding: "10px 18px", borderBottom: "1px solid #f0f0ed" }}>
                  <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 700, color: "#7c3aed" }}>{r.code}</div>
                  <div style={{ fontSize: 12.5, color: "#33363f" }}>{r.descr}</div>
                </div>
              ))}
              {(cclass ?? []).length === 0 ? (
                <div style={{ padding: 18, fontSize: 12.5, color: "#a0a3ad", fontStyle: "italic" }}>Nenhum cClassTrib cadastrado — use “+ Adicionar dado”.</div>
              ) : null}
            </div>
          </section>
        </div>
      ) : (
        <section>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Tributação dos produtos</div>
          <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>Alíquotas de referência do período de transição</div>
          <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, overflow: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "110px 1.6fr 70px 90px 90px 90px 100px 100px", gap: 10, whiteSpace: "nowrap", ...th }}>
              <div>NCM</div><div>Descrição</div><div>CST</div><div>cClassTrib</div><div>Alíq. IBS</div><div>Alíq. CBS</div><div>Red. IBS</div><div>Red. CBS</div>
            </div>
            {(prod ?? []).map((r: Record<string, string>, i: number) => (
              <div key={i} className="hv-row" style={{ display: "grid", gridTemplateColumns: "110px 1.6fr 70px 90px 90px 90px 100px 100px", gap: 10, alignItems: "center", padding: "11px 18px", borderBottom: "1px solid #f0f0ed" }}>
                <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "#4b4e58" }}>{r.ncm}</div>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{r.descr}</div>
                <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 700, color: ACCENT }}>{r.cst}</div>
                <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 700, color: "#7c3aed" }}>{r.cclass}</div>
                <div style={{ fontSize: 12, color: "#33363f" }}>{r.aliq_ibs}</div>
                <div style={{ fontSize: 12, color: "#33363f" }}>{r.aliq_cbs}</div>
                <div style={{ fontSize: 12, color: "#0e7a6f", fontWeight: 600 }}>{r.red_ibs}</div>
                <div style={{ fontSize: 12, color: "#0e7a6f", fontWeight: 600 }}>{r.red_cbs}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
