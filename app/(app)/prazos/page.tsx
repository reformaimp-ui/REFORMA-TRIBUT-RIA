import { createClient } from "@/lib/supabase/server";
import { PrazosBoard, type ChangeRow } from "./prazos-board";

export const dynamic = "force-dynamic";

export default async function PrazosPage() {
  const supabase = await createClient();
  const [{ data: chgs, error: chgsError }, { data: pmonths, error: monthsError }] = await Promise.all([
    supabase.from("changes").select("id,month,severity,title,description,date,badge,content").order("month"),
    supabase.from("prazo_months").select("month"),
  ]);

  if (chgsError || monthsError) {
    return (
      <div style={{ padding: "24px 26px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#b3402e", marginBottom: 6 }}>Não foi possível carregar os prazos.</div>
        <div style={{ fontSize: 12, color: "#8a8d98", fontFamily: "var(--font-jetbrains)" }}>
          {chgsError?.message || monthsError?.message}
        </div>
      </div>
    );
  }

  const changes = (chgs ?? []) as ChangeRow[];
  const months = [
    ...new Set([...changes.map((c) => c.month), ...((pmonths ?? []) as { month: string }[]).map((m) => m.month)]),
  ].sort();

  return <PrazosBoard months={months} changes={changes} />;
}
