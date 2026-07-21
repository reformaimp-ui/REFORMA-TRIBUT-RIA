import { BackBar } from "@/components/app/BackBar";
import { ClientForm } from "./client-form";

export default function NovoClientePage() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <BackBar href="/clientes" title="Adicionar cliente" />
      <div style={{ flex: 1, overflow: "auto", padding: "26px 28px 60px" }}>
        <ClientForm />
      </div>
    </div>
  );
}
