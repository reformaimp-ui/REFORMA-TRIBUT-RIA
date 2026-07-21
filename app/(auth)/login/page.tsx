import { AuthHero } from "@/components/AuthHero";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fff" }}>
      <AuthHero
        title="Bem-vindo de volta ao seu escritório."
        subtitle="Acompanhe prazos, tarefas e a transição para o novo modelo tributário — tudo em um só lugar, do ano-teste de 2026 à vigência plena em 2033."
      />
      <LoginForm />
    </div>
  );
}
