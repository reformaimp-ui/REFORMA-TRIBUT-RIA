import { createClient } from "@/lib/supabase/server";
import { KbBoard, type NoteRow } from "./kb-board";

export const dynamic = "force-dynamic";

export default async function BasePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notes")
    .select("id,title,content,created_at")
    .order("created_at", { ascending: false });

  return <KbBoard notes={(data ?? []) as NoteRow[]} />;
}
