import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Cliente com a service_role key — só pode ser usado em código de servidor
 * (Server Actions), nunca em Client Components. Necessário para operações de
 * admin como convidar um usuário por e-mail (auth.admin.inviteUserByEmail),
 * que a anon key não tem permissão de fazer.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada no ambiente do servidor.");
  return createSupabaseClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
