import Link from "next/link";
import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { ACCENT } from "@/lib/design";
import { canViewTab } from "@/lib/permissions";
import { MemberCard } from "./member-card";

export const dynamic = "force-dynamic";

export default async function EquipePage() {
  const { member, members } = await getContext();
  if (!canViewTab(member, "equipe")) redirect("/dashboard");
  const isAdmin = member.role === "admin";
  const supabase = await createClient();

  const [{ data: tp }, { data: cli }] = await Promise.all([
    supabase.from("task_people").select("member_id"),
    supabase.from("clients").select("resp_member_id"),
  ]);
  const inUse = new Set<string>();
  (tp ?? []).forEach((r: { member_id: string }) => inUse.add(r.member_id));
  (cli ?? []).forEach((r: { resp_member_id: string | null }) => r.resp_member_id && inUse.add(r.resp_member_id));

  return (
    <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Equipe</div>
        <div style={{ fontSize: 11.5, color: "#8a8d98", marginLeft: 10 }}>
          {members.length} pessoas com acesso ao escritório
        </div>
        {isAdmin ? (
          <Link
            href="/equipe/novo"
            className="hv-btn"
            style={{
              marginLeft: "auto",
              fontSize: 12,
              fontWeight: 600,
              color: "#fff",
              background: ACCENT,
              borderRadius: 8,
              padding: "7px 14px",
            }}
          >
            + Convidar pessoa
          </Link>
        ) : null}
      </div>
      {isAdmin ? (
        <div style={{ fontSize: 11.5, color: "#8a8d98", marginTop: -8 }}>
          Clique em uma pessoa (que não seja admin) para configurar quais abas e ações ela pode usar.
        </div>
      ) : null}
      <div
        className="stagger"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
          gap: 14,
        }}
      >
        {members.map((m) => (
          <MemberCard
            key={m.id}
            m={m}
            locked={inUse.has(m.id)}
            canManage={isAdmin}
            canRemove={isAdmin && !inUse.has(m.id) && members.length > 1}
          />
        ))}
      </div>
    </div>
  );
}
