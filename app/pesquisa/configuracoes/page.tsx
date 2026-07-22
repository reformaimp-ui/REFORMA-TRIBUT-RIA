import { getSearchClientContext } from "@/lib/searchClient";
import { PortalSettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function PesquisaConfigPage() {
  const { client, office } = await getSearchClientContext();
  return (
    <div style={{ padding: "40px 40px 60px", maxWidth: 480 }}>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.01em", marginBottom: 22 }}>Configurações</div>
      <PortalSettingsForm client={client} officeName={office.name} />
    </div>
  );
}
