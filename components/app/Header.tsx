"use client";

import { usePathname } from "next/navigation";
import { headerDate } from "@/lib/design";
import { Avatar } from "@/components/app/Avatar";
import type { Member } from "@/lib/data";

const TITLES: Record<string, string> = {
  dashboard: "Visão geral",
  tarefas: "Tarefas",
  prazos: "Prazos",
  fluxos: "Fluxos",
  clientes: "Clientes",
  equipe: "Equipe",
  ibs: "IBS e CBS",
  "base-conhecimento": "Base de conhecimento",
  configuracoes: "Configurações",
};

export function Header({ members }: { members: Member[] }) {
  const pathname = usePathname();
  const seg = pathname.split("/")[1] || "dashboard";
  const title = TITLES[seg] ?? "Reforma 2033";

  return (
    <header
      style={{
        height: 56,
        flex: "none",
        background: "#fff",
        borderBottom: "1px solid #e7e7e3",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 22px",
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-.01em" }}>{title}</div>
      <div style={{ fontSize: 11, color: "#8a8d98", fontFamily: "var(--font-jetbrains)" }}>
        {headerDate()}
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex" }}>
          {members.map((p, i) => (
            <Avatar
              key={p.id}
              name={p.name}
              color={p.color}
              ini={p.ini}
              avatarUrl={p.avatar_url}
              size={28}
              extraStyle={{ border: "2px solid #fff", marginLeft: i ? -8 : 0 }}
            />
          ))}
        </div>
      </div>
    </header>
  );
}
