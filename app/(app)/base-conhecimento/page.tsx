import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getContext } from "@/lib/data";
import { canDo, canViewTab } from "@/lib/permissions";
import { KbBoard, type NoteRow } from "./kb-board";

export const dynamic = "force-dynamic";

export default async function BasePage() {
  const { member } = await getContext();
  if (!canViewTab(member, "base-conhecimento")) redirect("/dashboard");
  const perms = {
    create: canDo(member, "base-conhecimento", "create"),
    edit: canDo(member, "base-conhecimento", "edit"),
    delete: canDo(member, "base-conhecimento", "delete"),
  };
  const supabase = await createClient();
  const { data } = await supabase
    .from("notes")
    .select("id,title,content,created_at")
    .order("created_at", { ascending: false });

  return <KbBoard notes={(data ?? []) as NoteRow[]} perms={perms} />;
}
