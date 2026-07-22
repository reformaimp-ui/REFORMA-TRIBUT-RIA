import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";
import { BackBar } from "@/components/app/BackBar";
import { MemberForm } from "./member-form";

export default async function NovoMembroPage() {
  const { member } = await getContext();
  if (member.role !== "admin") redirect("/equipe");
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <BackBar href="/equipe" title="Convidar pessoa" />
      <div style={{ flex: 1, overflow: "auto", padding: "24px 22px 60px" }}>
        <MemberForm />
      </div>
    </div>
  );
}
