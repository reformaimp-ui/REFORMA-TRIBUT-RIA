import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";
import { canViewTab } from "@/lib/permissions";
import { SettingsForm } from "./settings-form";

export default async function ConfiguracoesPage() {
  const { member, office } = await getContext();
  if (!canViewTab(member, "configuracoes")) redirect("/dashboard");
  return <SettingsForm member={member} office={office} />;
}
