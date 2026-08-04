import { AuthHero } from "@/components/AuthHero";
import { PrimeiroAcessoForm } from "./primeiro-acesso-form";

export default function PrimeiroAcessoPage() {
  return (
    <div className="auth-shell">
      <AuthHero
        title="Só falta um passo para entrar."
        subtitle="Confirme o e-mail que te convidaram e crie sua senha de acesso."
      />
      <PrimeiroAcessoForm />
    </div>
  );
}
