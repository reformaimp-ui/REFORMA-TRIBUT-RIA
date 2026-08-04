import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Imperform — Pesquise a tributação do seu produto na Reforma Tributária",
  description:
    "Digite o produto ou o NCM e veja IBS, CBS e Imposto Seletivo, com um assistente de IA que explica o resultado citando a base legal (EC 132/2023 e LC 214/2025).",
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Quem já está autenticado vai direto para o app; visitante vê a landing.
  if (user) {
    redirect(user.app_metadata?.portal === true ? "/pesquisa" : "/dashboard");
  }

  return <LandingPage />;
}
