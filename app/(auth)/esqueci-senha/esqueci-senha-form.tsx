"use client";

import { AuthOtpForm } from "@/components/AuthOtpForm";

export function EsqueciSenhaForm() {
  return (
    <AuthOtpForm
      heading="Redefinir senha"
      emailStepDesc="Informe o e-mail da sua conta para receber um código de confirmação."
      notFoundError="Não encontramos uma conta com este e-mail."
      finalButtonLabel="Redefinir senha e entrar"
    />
  );
}
