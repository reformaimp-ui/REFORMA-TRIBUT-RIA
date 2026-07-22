"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getContext } from "@/lib/data";
import { canDo } from "@/lib/permissions";
import { iniOf, PALETTE } from "@/lib/design";

export type ClientFormState = { error?: string };

type Row = { name: string; setor: string; regime: string };

function parseRows(text: string): Row[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split(",").map((c) => c.trim()))
    .filter((cols) => cols[0] && !/^nome$/i.test(cols[0]))
    .map((cols) => ({ name: cols[0], setor: cols[1] || "", regime: cols[2] || "" }));
}

async function insertClients(rows: Row[]) {
  if (!rows.length) return;
  const { office, member } = await getContext();
  if (!canDo(member, "clientes", "create")) return;
  const supabase = await createClient();
  const { count } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true });
  const base = count ?? 0;
  const payload = rows.map((r, i) => ({
    office_id: office.id,
    name: r.name,
    setor: r.setor || "Não informado",
    regime: r.regime || "Simples Nacional",
    resp_member_id: member.id,
    pct: 0,
    status: "Em dia",
    ini: iniOf(r.name),
    color: PALETTE[(base + i) % PALETTE.length],
  }));
  await supabase.from("clients").insert(payload);
}

export async function addClientSingle(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const name = String(formData.get("name") || "").trim();
  const setor = String(formData.get("setor") || "").trim();
  const regime = String(formData.get("regime") || "Simples Nacional");
  if (!name) return { error: "Informe o nome do cliente." };
  await insertClients([{ name, setor, regime }]);
  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function addClientsBatch(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const rows = parseRows(String(formData.get("batchText") || ""));
  if (!rows.length) return { error: "Nenhum cliente reconhecido no texto." };
  await insertClients(rows);
  revalidatePath("/clientes");
  redirect("/clientes");
}
