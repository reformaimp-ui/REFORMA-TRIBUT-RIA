import Link from "next/link";
import { getContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { ACCENT, av, STATUS_COLOR } from "@/lib/design";

export const dynamic = "force-dynamic";

const REGIMES = ["Todos", "Lucro Real", "Lucro Presumido", "Simples Nacional"];

function barColor(pct: number) {
  return pct < 35 ? "#b3402e" : pct < 60 ? "#c98a2e" : "#0e7a6f";
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ regime?: string }>;
}) {
  const { members } = await getContext();
  const sp = await searchParams;
  const filter = sp.regime && REGIMES.includes(sp.regime) ? sp.regime : "Todos";
  const byId = Object.fromEntries(members.map((m) => [m.id, m]));

  const supabase = await createClient();
  let q = supabase
    .from("clients")
    .select("id,name,setor,regime,resp_member_id,pct,status,ini,color")
    .order("created_at");
  if (filter !== "Todos") q = q.eq("regime", filter);
  const { data: clients } = await q;

  return (
    <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {REGIMES.map((r) => {
          const active = filter === r;
          return (
            <Link
              key={r}
              href={r === "Todos" ? "/clientes" : `/clientes?regime=${encodeURIComponent(r)}`}
              className="hv-card"
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: 99,
                cursor: "pointer",
                border: `1px solid ${active ? ACCENT : "#e2e2de"}`,
                color: active ? "#fff" : "#4b4e58",
                background: active ? ACCENT : "#fff",
              }}
            >
              {r}
            </Link>
          );
        })}
        <Link
          href="/clientes/novo"
          className="hv-btn"
          style={{
            marginLeft: "auto",
            fontSize: 12,
            fontWeight: 600,
            color: "#fff",
            background: ACCENT,
            borderRadius: 8,
            padding: "7px 14px",
          }}
        >
          + Adicionar cliente
        </Link>
      </div>
      <div className="stagger" style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1.4fr 90px",
            gap: 12,
            padding: "11px 18px",
            background: "#fafaf8",
            borderBottom: "1px solid #ececea",
            fontSize: 10.5,
            fontWeight: 700,
            color: "#6b6e78",
            textTransform: "uppercase",
            letterSpacing: ".05em",
          }}
        >
          <div>Cliente</div>
          <div>Regime</div>
          <div>Responsável</div>
          <div>Adequação à reforma</div>
          <div>Status</div>
        </div>
        {(clients ?? []).map((c: Record<string, unknown>) => {
          const resp = byId[c.resp_member_id as string];
          const pct = c.pct as number;
          const st = STATUS_COLOR[c.status as string] ?? STATUS_COLOR["Em dia"];
          return (
            <Link
              key={c.id as string}
              href={`/clientes/${c.id}`}
              className="hv-row"
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1.4fr 90px",
                gap: 12,
                alignItems: "center",
                padding: "13px 18px",
                borderBottom: "1px solid #f0f0ed",
                cursor: "pointer",
                color: "inherit",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name as string}</div>
                <div style={{ fontSize: 11, color: "#8a8d98" }}>{c.setor as string}</div>
              </div>
              <div style={{ fontSize: 12, color: "#4b4e58" }}>{c.regime as string}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                {resp ? <div style={av(resp.color, 22)}>{resp.ini}</div> : null}
                <span style={{ fontSize: 12, color: "#4b4e58" }}>
                  {resp ? resp.name.split(" ")[0] : "—"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, height: 6, background: "#f0f0ed", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: barColor(pct) }} />
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#6b6e78",
                    fontFamily: "var(--font-jetbrains)",
                    width: 34,
                    textAlign: "right",
                  }}
                >
                  {pct}%
                </div>
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: "3px 9px",
                  borderRadius: 99,
                  textAlign: "center",
                  background: st[0],
                  color: st[1],
                }}
              >
                {c.status as string}
              </div>
            </Link>
          );
        })}
        {(clients ?? []).length === 0 ? (
          <div style={{ padding: "18px", fontSize: 12.5, color: "#a0a3ad", fontStyle: "italic" }}>
            Nenhum cliente ainda. Clique em “Adicionar cliente”.
          </div>
        ) : null}
      </div>
    </div>
  );
}
