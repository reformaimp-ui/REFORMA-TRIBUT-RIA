"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SignupState = { error?: string; notice?: string };

export async function signup(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const officeName = String(formData.get("officeName") || "").trim();
  const responsavel = String(formData.get("responsavel") || "").trim();
  const cnpj = String(formData.get("cnpj") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (!officeName || !email || !password) return { error: "Preencha os campos obrigatórios." };
  if (password !== confirm) return { error: "As senhas não coincidem." };
  if (password.length < 6) return { error: "A senha deve ter ao menos 6 caracteres." };

  const supabase = await createClient();

  // Office details ride along in user metadata; the office is created on the first
  // authenticated load (getContext), so this works with or without email confirmation.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: responsavel,
        pending_office_name: officeName,
        pending_office_cnpj: cnpj || null,
      },
    },
  });
  if (error) {
    return {
      error: error.message.toLowerCase().includes("registered")
        ? "Este e-mail já está cadastrado."
        : "Não foi possível criar a conta.",
    };
  }

  if (!data.session) {
    // Email confirmation is enabled — the office is created when they log in.
    return { notice: "Conta criada! Confirme seu e-mail e depois faça login para entrar no escritório." };
  }

  redirect("/dashboard");
}
