import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getContext } from "@/lib/data";
import { canDo, canViewTab } from "@/lib/permissions";
import { FileBoard, type DocRow } from "./file-board";

export const dynamic = "force-dynamic";

export default async function ArquivosPage() {
  const { office, member } = await getContext();
  if (!canViewTab(member, "arquivos")) redirect("/dashboard");
  const perms = {
    create: canDo(member, "arquivos", "create"),
    edit: canDo(member, "arquivos", "edit"),
    delete: canDo(member, "arquivos", "delete"),
  };
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("id,parent_id,kind,name,content,storage_path,mime_type,size_bytes,created_by,created_at,updated_at")
    .order("name");

  return <FileBoard docs={(data ?? []) as DocRow[]} perms={perms} officeId={office.id} />;
}
