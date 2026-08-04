import { AuthHero } from "@/components/AuthHero";
import { EsqueciSenhaForm } from "./esqueci-senha-form";

export default function EsqueciSenhaPage() {
  return (
    <div className="auth-shell">
      <AuthHero
        title="Vamos recuperar seu acesso."
        subtitle="Confirme seu e-mail com um código de 6 dígitos e defina uma nova senha em segundos."
      />
      <EsqueciSenhaForm />
    </div>
  );
}
