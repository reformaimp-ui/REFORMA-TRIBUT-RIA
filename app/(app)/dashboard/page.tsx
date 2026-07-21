import Link from "next/link";
import { getContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { loadTaskList } from "@/lib/tasks";
import { ACCENT, av, isoDate, tipoColor, tipoLabel, toBRshort } from "@/lib/design";

export const dynamic = "force-dynamic";

const PHASES = [
  { year: "2026", title: "Ano-teste", desc: "CBS 0,9% + IBS 0,1% destacados na NF-e; recolhimento dispensado", from: 2020, to: 2026 },
  { year: "2027", title: "CBS integral", desc: "Extinção de PIS/Cofins; Imposto Seletivo em vigor; IPI zerado (exceto ZFM)", from: 2027, to: 2027 },
  { year: "2028", title: "Consolidação", desc: "CBS e IS plenos; IBS mantém alíquota de teste", from: 2028, to: 2028 },
  { year: "2029–32", title: "Transição IBS", desc: "ICMS e ISS reduzidos gradualmente; IBS sobe na mesma proporção", from: 2029, to: 2032 },
  { year: "2033", title: "Regime pleno", desc: "Extinção de ICMS e ISS; IVA dual em vigência integral", from: 2033, to: 2077 },
  { year: "2078", title: "Fim da compensação", desc: "Encerramento dos ajustes federativos de receita", from: 2078, to: 9999, dim: true },
];

export default async function DashboardPage() {
  const { members } = await getContext();
  const supabase = await createClient();
  const now = new Date();
  const yr = now.getFullYear();
  const todayISO = isoDate(now);
  const in7 = new Date(now);
  in7.setDate(in7.getDate() + 7);
  const in7ISO = isoDate(in7);

  const [tasks, { data: clients }, { data: events }] = await Promise.all([
    loadTaskList(supabase),
    supabase.from("clients").select("pct,status"),
    supabase.from("events").select("date,title,tipo").order("date"),
  ]);

  const cliList = (clients ?? []) as { pct: number; status: string }[];
  const attn = cliList.filter((c) => c.status !== "Em dia").length;
  const avgAdeq = cliList.length ? Math.round(cliList.reduce((a, c) => a + c.pct, 0) / cliList.length) : 0;

  const isDone = (t: (typeof tasks)[number]) => t.avgPct !== null && t.avgPct >= 100;
  const openTasks = tasks.filter((t) => !isDone(t));
  const late = openTasks.filter((t) => t.dueDate && t.dueDate < todayISO);

  const evList = (events ?? []) as { date: string; title: string; tipo: string }[];
  const upcoming = evList.filter((e) => e.date >= todayISO).slice(0, 6);
  const next7 = evList.filter((e) => e.date >= todayISO && e.date <= in7ISO);

  const maxLoad = Math.max(...members.map((m) => openTasks.filter((t) => t.peopleIds.includes(m.id)).length), 1);

  const kpis = [
    { label: "Clientes em adequação", value: String(cliList.length), suffix: "ativos", delta: `${attn} em situação crítica ou atenção`, dc: attn ? "#b3512e" : "#0e7a6f" },
    { label: "Tarefas abertas", value: String(openTasks.length), suffix: `de ${tasks.length}`, delta: `${late.length} em atraso`, dc: late.length ? "#b3402e" : "#0e7a6f" },
    { label: "Prazos nos próximos 7 dias", value: String(next7.length), suffix: next7.length ? `até ${toBRshort(in7ISO)}` : "", delta: next7.length ? next7.slice(0, 3).map((e) => e.title.split(" — ")[0]).join(", ") : "Nenhum prazo na janela", dc: "#6b6e78" },
    { label: "Adequação média da carteira", value: `${avgAdeq}%`, suffix: "", delta: `média de ${cliList.length} clientes`, dc: "#0e7a6f" },
  ];

  return (
    <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }} className="animate-fadeup">
      <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".05em" }}>{k.label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
              <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.02em" }}>{k.value}</span>
              <span style={{ fontSize: 12, color: "#8a8d98" }}>{k.suffix}</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, marginTop: 6, color: k.dc }}>{k.delta}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>Linha do tempo da transição</div>
          <div style={{ fontSize: 11, color: "#8a8d98" }}>EC 132/2023 · LC 214/2025</div>
        </div>
        <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10 }}>
          {PHASES.map((ph, i) => {
            const on = yr >= ph.from && yr <= ph.to;
            return (
              <div key={i} style={{ border: `1px solid ${on ? ACCENT : "#ececea"}`, background: on ? "#f7f8ff" : "#fafaf8", borderRadius: 10, padding: 12, opacity: ph.dim ? 0.55 : 1 }}>
                <div style={{ display: "inline-block", fontFamily: "var(--font-jetbrains)", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, color: on ? "#fff" : "#5b5f6b", background: on ? ACCENT : "#ececea" }}>{ph.year}</div>
                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6 }}>{ph.title}</div>
                <div style={{ fontSize: 11, color: "#7c7f89", marginTop: 3, lineHeight: 1.45, textWrap: "pretty" }}>{ph.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 14 }}>
        <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>Próximos prazos</div>
            <Link href="/prazos" style={{ fontSize: 12, color: ACCENT, fontWeight: 600 }}>Ver calendário →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {upcoming.map((u, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 2px", borderBottom: "1px solid #f0f0ed" }}>
                <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 11, fontWeight: 600, color: "#5b5f6b", width: 44 }}>{toBRshort(u.date)}</div>
                <div style={{ width: 8, height: 8, flex: "none", borderRadius: 99, background: tipoColor[u.tipo] }} />
                <div style={{ fontSize: 12.5, flex: 1 }}>{u.title}</div>
                <div style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "#f4f4f2", color: "#6b6e78" }}>{tipoLabel[u.tipo]}</div>
              </div>
            ))}
            {upcoming.length === 0 ? <div style={{ fontSize: 12, color: "#a0a3ad", fontStyle: "italic", padding: "6px 0" }}>Nenhum prazo futuro cadastrado.</div> : null}
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>Carga por responsável</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {members.map((m) => {
              const count = openTasks.filter((t) => t.peopleIds.includes(m.id)).length;
              return (
                <div key={m.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <div style={av(m.color, 22)}>{m.ini}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, flex: 1 }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: "#8a8d98", fontFamily: "var(--font-jetbrains)" }}>{count} tarefas</div>
                  </div>
                  <div style={{ height: 6, background: "#f0f0ed", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${Math.round((count / maxLoad) * 100)}%`, height: "100%", background: m.color, borderRadius: 99 }} />
                  </div>
                </div>
              );
            })}
          </div>
          {late.length ? (
            <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: "#fdf6ef", border: "1px solid #f3e2cd" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#9a5b1f" }}>{late.length} {late.length === 1 ? "tarefa em atraso" : "tarefas em atraso"}</div>
              <div style={{ fontSize: 11.5, color: "#a97b47", marginTop: 2 }}>{late.slice(0, 3).map((t) => t.title).join(" · ")}</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
