import { AuthHero } from "@/components/AuthHero";
import { SignupForm } from "./signup-form";

export default function CadastroPage() {
  return (
    <div className="auth-shell">
      <AuthHero
        title="Leve seu escritório pela transição tributária."
        subtitle="Cadastre seu escritório e centralize tarefas, prazos e a adequação de todos os seus clientes à CBS, ao IBS e ao Imposto Seletivo."
      />
      <SignupForm />
    </div>
  );
}
