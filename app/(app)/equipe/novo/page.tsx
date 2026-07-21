import { BackBar } from "@/components/app/BackBar";
import { MemberForm } from "./member-form";

export default function NovoMembroPage() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <BackBar href="/equipe" title="Convidar pessoa" />
      <div style={{ flex: 1, overflow: "auto", padding: "24px 22px 60px" }}>
        <MemberForm />
      </div>
    </div>
  );
}
