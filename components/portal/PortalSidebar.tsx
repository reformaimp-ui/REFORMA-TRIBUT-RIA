"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { ACCENT } from "@/lib/design";
import { logout } from "@/app/(app)/actions";

const NAV = [
  { href: "/pesquisa", label: "Pesquisar produtos", icon: "search" },
  { href: "/pesquisa/servicos", label: "Pesquisar serviços", icon: "service" },
  { href: "/pesquisa/lote", label: "Pesquisa em lote", icon: "batch" },
  { href: "/pesquisa/assistente", label: "Assistente IA", icon: "ai" },
  { href: "/pesquisa/configuracoes", label: "Configurações", icon: "settings" },
];

function Icon({ name }: { name: string }) {
  switch (name) {
    case "search":
      return (
        <svg width="15" height="15" viewBox="0 0 15 15">
          <circle cx="6.5" cy="6.5" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "service":
      return (
        <svg width="15" height="15" viewBox="0 0 15 15">
          <path d="M2 12.5l3.2-3.2M9.3 6.7a2.6 2.6 0 10-3.6-3.6 2.6 2.6 0 003.6 3.6zM9.3 6.7L13 10.4a1.2 1.2 0 01-1.7 1.7L7.6 8.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "batch":
      return (
        <svg width="15" height="15" viewBox="0 0 15 15">
          <rect x="1" y="1.5" width="10" height="3" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <rect x="3" y="6" width="10" height="3" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <rect x="1" y="10.5" width="10" height="3" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
    case "ai":
      return (
        <svg width="15" height="15" viewBox="0 0 15 15">
          <path d="M7.5 1.5l1.3 3.7 3.7 1.3-3.7 1.3-1.3 3.7-1.3-3.7L2.5 6.5l3.7-1.3z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M12 10.5l.55 1.55L14.1 12.6l-1.55.55L12 14.7l-.55-1.55L9.9 12.6l1.55-.55z" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg width="15" height="15" viewBox="0 0 15 15">
          <circle cx="7.5" cy="7.5" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7.5 1.5v1.6M7.5 12.9v1.6M13.5 7.5h-1.6M3.6 7.5H2M11.6 3.4l-1.13 1.13M4.53 10.47L3.4 11.6M11.6 11.6l-1.13-1.13M4.53 4.53L3.4 3.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
  }
}

export function PortalSidebar({ officeName, clientName, aiEnabled }: { officeName: string; clientName: string; aiEnabled: boolean }) {
  const pathname = usePathname();
  const nav = aiEnabled ? NAV : NAV.filter((n) => n.href !== "/pesquisa/assistente");
  const navRef = useRef<HTMLElement>(null);
  const [pill, setPill] = useState<{ top: number; height: number; visible: boolean; animate: boolean }>({
    top: 0,
    height: 0,
    visible: false,
    animate: false,
  });

  // Move o pill deslizante até o item ativo a cada navegação — mesmo padrão de components/app/Sidebar.tsx.
  useLayoutEffect(() => {
    const navEl = navRef.current;
    if (!navEl) return;
    const active = navEl.querySelector<HTMLElement>('[data-active="true"]');
    if (!active) {
      setPill((p) => ({ ...p, visible: false }));
      return;
    }
    setPill((p) => ({
      top: active.offsetTop,
      height: active.offsetHeight,
      visible: true,
      animate: p.visible, // primeira renderização posiciona sem animar
    }));
  }, [pathname]);

  return (
    <aside
      style={{
        width: 232, flex: "none", background: "#fff", borderRight: "1px solid #e7e7e3",
        display: "flex", flexDirection: "column", padding: "18px 12px 14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 10px 18px" }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: ACCENT, display: "grid", placeItems: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>
          {officeName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13.5, letterSpacing: "-.01em" }}>{officeName}</div>
          <div style={{ fontSize: 10.5, color: "#8a8d98" }}>Pesquisa de tributação</div>
        </div>
      </div>
      <nav ref={navRef} style={{ display: "flex", flexDirection: "column", gap: 2, position: "relative" }}>
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: pill.top,
            height: pill.height,
            borderRadius: 8,
            background: "#eef1ff",
            boxShadow: `inset 2.5px 0 0 ${ACCENT}`,
            opacity: pill.visible ? 1 : 0,
            transition: pill.animate
              ? "top .28s cubic-bezier(.3,.9,.3,1), height .28s cubic-bezier(.3,.9,.3,1), opacity .15s ease"
              : "opacity .15s ease",
            pointerEvents: "none",
          }}
        />
        {nav.map((n) => {
          const active = pathname === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              data-active={active ? "true" : "false"}
              className={active ? undefined : "hv-nav"}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8,
                fontSize: 12.5, fontWeight: 600, cursor: "pointer", position: "relative",
                color: active ? ACCENT : "#4b4e58",
              }}
            >
              <Icon name={n.icon} />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div style={{ marginTop: "auto", padding: "12px 10px", background: "#f7f7f4", borderRadius: 10 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>
          Logado como
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clientName}</div>
      </div>
      <button
        onClick={() => logout()}
        className="hv-danger"
        style={{ marginTop: 10, fontSize: 11, fontWeight: 600, color: "#8a8d98", cursor: "pointer", padding: "4px 10px", background: "none", border: "none", textAlign: "left" }}
      >
        Sair da conta
      </button>
    </aside>
  );
}
