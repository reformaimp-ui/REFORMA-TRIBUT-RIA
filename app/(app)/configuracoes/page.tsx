import { getContext } from "@/lib/data";
import { SettingsForm } from "./settings-form";

export default async function ConfiguracoesPage() {
  const { member, office } = await getContext();
  return <SettingsForm member={member} office={office} />;
}
