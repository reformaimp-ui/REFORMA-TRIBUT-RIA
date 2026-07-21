import Link from "next/link";
import { getContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { ACCENT, av } from "@/lib/design";
import { removeMember } from "./actions";

export const dynamic = "force-dynamic";

export default async function EquipePage() {
  const { members } = await getContext();
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
      </div>
      <div
        className="stagger"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
          gap: 14,
        }}
      >
        {members.map((m) => {
          const isAdmin = m.role === "admin";
          const locked = inUse.has(m.id);
          return (
            <div
              key={m.id}
              style={{
                background: "#fff",
                border: "1px solid #e7e7e3",
                borderRadius: 12,
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={av(m.color, 34)}>{m.ini}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {m.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#8a8d98",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {m.cargo}
                  </div>
                </div>
                {locked ? (
                  <div title="Atribuído a tarefas ou clientes" style={{ color: "#c2c3c9", padding: 2 }}>
                    <svg width="13" height="13" viewBox="0 0 13 13">
                      <rect x="2.5" y="6" width="8" height="5.5" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M4 6V4a2.5 2.5 0 015 0v2" fill="none" stroke="currentColor" strokeWidth="1.3" />
                    </svg>
                  </div>
                ) : members.length > 1 ? (
                  <form action={removeMember}>
                    <input type="hidden" name="id" value={m.id} />
                    <button
                      type="submit"
                      title="Remover"
                      className="hv-danger"
                      style={{ color: "#c2c3c9", cursor: "pointer", padding: 2, background: "none", border: "none" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 15 15">
                        <path
                          d="M2 3.5h11M6 3.5V2h3v1.5M3.5 3.5l.7 9.5h6.6l.7-9.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </form>
                ) : null}
              </div>
              <div style={{ height: 1, background: "#f0f0ed" }} />
              <div
                style={{
                  fontSize: 11.5,
                  color: "#6b6e78",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {m.email || "—"}
              </div>
              <div
                style={{
                  alignSelf: "flex-start",
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: "3px 9px",
                  borderRadius: 99,
                  background: isAdmin ? "#eef1ff" : "#f4f4f2",
                  color: isAdmin ? ACCENT : "#6b6e78",
                }}
              >
                {isAdmin ? "Admin" : "Membro"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
