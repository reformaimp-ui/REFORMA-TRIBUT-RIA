import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";
import { canDo } from "@/lib/permissions";
import { BackBar } from "@/components/app/BackBar";
import { ClientForm } from "./client-form";

export default async function NovoClientePage() {
  const { member } = await getContext();
  if (!canDo(member, "clientes", "create")) redirect("/clientes");
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <BackBar href="/clientes" title="Adicionar cliente" />
      <div style={{ flex: 1, overflow: "auto", padding: "26px 28px 60px" }}>
        <ClientForm />
      </div>
    </div>
  );
}
