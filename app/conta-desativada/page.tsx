import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(app)/actions";

export const dynamic = "force-dynamic";

export default async function ContaDesativadaPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select("office_id,active")
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (member?.active !== false) redirect("/dashboard");

  const { data: office } = await supabase.from("offices").select("name").eq("id", member.office_id).maybeSingle();

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center", background: "#fafaf8" }}>
      <div style={{ maxWidth: 380 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Acesso desativado</div>
        <div style={{ fontSize: 13.5, color: "#8a8d98", lineHeight: 1.6, marginBottom: 20 }}>
          Seu acesso{office?.name ? ` a ${office.name}` : ""} foi desativado. Entre em contato com um administrador do escritório para reativar.
        </div>
        <form action={logout}>
          <button
            type="submit"
            style={{ fontSize: 12.5, fontWeight: 600, color: "#4b4e58", background: "#fff", border: "1.5px solid #e2e2de", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}
          >
            Sair da conta
          </button>
        </form>
      </div>
    </div>
  );
}
