import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ACCENT } from "@/lib/design";
import { createFlow, deleteFlow } from "./actions";

export const dynamic = "force-dynamic";

export default async function FluxosPage() {
  const supabase = await createClient();
  const { data: flows } = await supabase.from("flows").select("id,name").order("created_at");
  const { data: nodes } = await supabase.from("flow_nodes").select("flow_id");
  const counts: Record<string, number> = {};
  (nodes ?? []).forEach((n: { flow_id: string }) => (counts[n.flow_id] = (counts[n.flow_id] || 0) + 1));

  return (
    <div style={{ padding: "20px 22px", height: "100%", overflow: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Fluxos</div>
        <form action={createFlow} style={{ marginLeft: "auto" }}>
          <button type="submit" className="hv-btn" style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: ACCENT, borderRadius: 8, padding: "7px 14px", border: "none", cursor: "pointer" }}>+ Novo fluxo</button>
        </form>
      </div>
      <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 14 }}>
        {(flows ?? []).map((f: { id: string; name: string }) => {
          const n = counts[f.id] || 0;
          return (
            <div key={f.id} style={{ position: "relative" }}>
              <Link href={`/fluxos/${f.id}`} className="hv-card" style={{ display: "flex", flexDirection: "column", gap: 12, background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, padding: 18, color: "inherit" }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "#eef1ff", display: "grid", placeItems: "center", color: ACCENT }}>
                  <svg width="16" height="16" viewBox="0 0 15 15"><circle cx="3" cy="3.5" r="2.2" fill="currentColor" /><circle cx="12" cy="7.5" r="2.2" fill="currentColor" opacity=".45" /><circle cx="4" cy="12" r="2.2" fill="currentColor" opacity=".7" /><path d="M5 4.5l5 2M5.5 10.8l4.5-2.5" stroke="currentColor" strokeWidth="1.3" /></svg>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.35, textWrap: "pretty" }}>{f.name}</div>
                <div style={{ fontSize: 11, color: "#8a8d98" }}>{n} {n === 1 ? "nó" : "nós"}</div>
              </Link>
              <form action={deleteFlow} style={{ position: "absolute", right: 12, bottom: 14 }}>
                <input type="hidden" name="id" value={f.id} />
                <button type="submit" title="Excluir fluxo" className="hv-danger" style={{ color: "#c2c3c9", cursor: "pointer", padding: 2, background: "none", border: "none" }}>
                  <svg width="14" height="14" viewBox="0 0 15 15"><path d="M2 3.5h11M6 3.5V2h3v1.5M3.5 3.5l.7 9.5h6.6l.7-9.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
