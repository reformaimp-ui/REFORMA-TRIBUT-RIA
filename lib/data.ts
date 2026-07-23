import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Permissions } from "@/lib/permissions";

export type Member = {
  id: string;
  name: string;
  email: string | null;
  ini: string;
  color: string;
  cargo: string | null;
  role: string;
  avatar_url: string | null;
  permissions: Permissions | null;
  active: boolean;
};

export type Office = { id: string; name: string; cnpj: string | null; accent: string };

export type AppContext = {
  userId: string;
  office: Office;
  member: Member;
  members: Member[];
};

/**
 * Loads the authenticated user's office + team.
 *
 * Performance notes:
 * - Wrapped in React `cache()`: layout + page call it in the same render, but the
 *   queries run only once per request.
 * - Uses the session from the cookie (no network hit) — the proxy already validated
 *   the user via `getUser()` on this same request, and every DB query is enforced
 *   by RLS on the server regardless (a forged cookie yields zero rows).
 * - 2 parallel queries (members + office) instead of 3 sequential.
 */
export const getContext = cache(async (): Promise<AppContext> => {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) redirect("/login");

  let [{ data: members }, { data: offices }] = await Promise.all([
    supabase
      .from("members")
      .select("id,name,email,ini,color,cargo,role,office_id,user_id,avatar_url,permissions,active")
      .order("created_at"),
    supabase.from("offices").select("id,name,cnpj,accent"),
  ]);

  let member = (members ?? []).find((m) => m.user_id === user.id);

  // First authenticated load: create the office from the metadata captured at signup.
  if (!member) {
    const pendingName = user.user_metadata?.pending_office_name as string | undefined;
    if (pendingName) {
      const { error: rpcError } = await supabase.rpc("create_office_with_admin", {
        p_office_name: pendingName,
        p_cnpj: (user.user_metadata?.pending_office_cnpj as string | null) ?? null,
        p_responsavel: (user.user_metadata?.full_name as string | null) ?? null,
      });
      if (rpcError) throw new Error("Falha ao configurar o escritório: " + rpcError.message);
      [{ data: members }, { data: offices }] = await Promise.all([
        supabase
          .from("members")
          .select("id,name,email,ini,color,cargo,role,office_id,user_id,avatar_url,permissions,active")
          .order("created_at"),
        supabase.from("offices").select("id,name,cnpj,accent"),
      ]);
      member = (members ?? []).find((m) => m.user_id === user.id);
    }
    if (!member) redirect("/cadastro");
  }

  // Pessoa desativada por um admin: bloqueia aqui, no chokepoint usado por
  // todas as páginas e server actions de (app) — em vez de deixar cada uma
  // checar sozinha.
  if (member.active === false) redirect("/conta-desativada");

  const office = (offices ?? []).find((o) => o.id === member.office_id);
  if (!office) redirect("/cadastro");

  return {
    userId: user.id,
    office: office as Office,
    member: member as Member,
    members: (members ?? []) as Member[],
  };
});
