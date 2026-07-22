"use client";

import { AuthOtpForm } from "@/components/AuthOtpForm";

export function PrimeiroAcessoForm() {
  return (
    <AuthOtpForm
      heading="Primeiro acesso"
      emailStepDesc="Informe o e-mail que te convidaram para o escritório."
      notFoundError="Este e-mail não foi convidado por nenhum escritório. Confira se digitou certo."
      finalButtonLabel="Definir senha e entrar"
    />
  );
}
