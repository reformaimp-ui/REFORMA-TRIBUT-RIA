import { Suspense } from "react";
import { AuthHero } from "@/components/AuthHero";
import { DefinirSenhaForm } from "./definir-senha-form";

export default function DefinirSenhaPage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fff" }}>
      <AuthHero
        title="Só falta um passo para entrar."
        subtitle="Defina sua senha para acessar o escritório que te convidou."
      />
      <Suspense fallback={<div style={{ flex: 1 }} />}>
        <DefinirSenhaForm />
      </Suspense>
    </div>
  );
}
