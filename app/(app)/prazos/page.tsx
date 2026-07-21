import { createClient } from "@/lib/supabase/server";
import { PrazosBoard, type ChangeRow } from "./prazos-board";

export const dynamic = "force-dynamic";

export default async function PrazosPage() {
  const supabase = await createClient();
  const [{ data: chgs }, { data: pmonths }] = await Promise.all([
    supabase.from("changes").select("id,month,severity,title,description,date,badge,content").order("month"),
    supabase.from("prazo_months").select("month"),
  ]);

  const changes = (chgs ?? []) as ChangeRow[];
  const months = [
    ...new Set([...changes.map((c) => c.month), ...((pmonths ?? []) as { month: string }[]).map((m) => m.month)]),
  ].sort();

  return <PrazosBoard months={months} changes={changes} />;
}
