import { AuthHero } from "@/components/AuthHero";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fff" }}>
      <AuthHero
        title="Bem-vindo de volta"
        subtitle="Pesquise a tributação de produtos e serviços na Reforma e acompanhe a regularização de cada cliente do seu escritório em um só lugar."
      />
      <LoginForm />
    </div>
  );
}
