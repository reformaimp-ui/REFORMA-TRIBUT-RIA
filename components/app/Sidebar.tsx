"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { ACCENT, currentPhase } from "@/lib/design";
import { logout } from "@/app/(app)/actions";
import type { Office } from "@/lib/data";

const NAV = [
  { seg: "dashboard", label: "Visão geral", icon: "dash" },
  { seg: "tarefas", label: "Tarefas", icon: "tasks" },
  { seg: "prazos", label: "Prazos", icon: "cal" },
  { seg: "fluxos", label: "Fluxos", icon: "flow" },
  { seg: "clientes", label: "Clientes", icon: "cli" },
  { seg: "equipe", label: "Equipe", icon: "team" },
  { seg: "ibs", label: "IBS e CBS", icon: "ibs" },
  { seg: "base-conhecimento", label: "Base de conhecimento", icon: "kb" },
  { seg: "configuracoes", label: "Configurações", icon: "settings" },
] as const;

function Icon({ name }: { name: string }) {
  switch (name) {
    case "dash":
      return (
        <svg width="15" height="15" viewBox="0 0 15 15">
          <rect x="1" y="1" width="5.5" height="5.5" rx="1.5" fill="currentColor" />
          <rect x="8.5" y="1" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity=".45" />
          <rect x="1" y="8.5" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity=".45" />
          <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.5" fill="currentColor" />
        </svg>
      );
    case "tasks":
      return (
        <svg width="15" height="15" viewBox="0 0 15 15">
          <rect x="1" y="1" width="13" height="13" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M4.5 7.5l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "cal":
      return (
        <svg width="15" height="15" viewBox="0 0 15 15">
          <rect x="1" y="2.5" width="13" height="11.5" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <line x1="1" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "flow":
      return (
        <svg width="15" height="15" viewBox="0 0 15 15">
          <circle cx="3" cy="3.5" r="2.2" fill="currentColor" />
          <circle cx="12" cy="7.5" r="2.2" fill="currentColor" opacity=".45" />
          <circle cx="4" cy="12" r="2.2" fill="currentColor" opacity=".7" />
          <path d="M5 4.5l5 2M5.5 10.8l4.5-2.5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case "cli":
      return (
        <svg width="15" height="15" viewBox="0 0 15 15">
          <circle cx="5.5" cy="5" r="2.6" fill="currentColor" />
          <path d="M1.5 13c.5-3 2.3-4.3 4-4.3s3.5 1.3 4 4.3z" fill="currentColor" />
          <circle cx="11" cy="5.5" r="2" fill="currentColor" opacity=".45" />
        </svg>
      );
    case "team":
      return (
        <svg width="15" height="15" viewBox="0 0 15 15">
          <circle cx="5.5" cy="4.2" r="2.3" fill="currentColor" />
          <circle cx="11" cy="5" r="1.8" fill="currentColor" opacity=".5" />
          <path d="M1.3 13c.4-2.8 2.1-4 4.2-4s3.8 1.2 4.2 4z" fill="currentColor" />
          <path d="M10 9.3c1.6.2 2.6 1.3 2.9 3.2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity=".6" />
        </svg>
      );
    case "ibs":
      return (
        <svg width="15" height="15" viewBox="0 0 15 15">
          <rect x="1" y="1" width="13" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <line x1="1" y1="5.3" x2="14" y2="5.3" stroke="currentColor" strokeWidth="1.3" />
          <line x1="5.3" y1="5.3" x2="5.3" y2="14" stroke="currentColor" strokeWidth="1.3" />
          <line x1="9.6" y1="5.3" x2="9.6" y2="14" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case "kb":
      return (
        <svg width="15" height="15" viewBox="0 0 15 15">
          <path d="M2 2.5A1.5 1.5 0 013.5 1H13v11.5H3.5A1.5 1.5 0 002 14z" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <line x1="2" y1="11.5" x2="13" y2="11.5" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    default:
      return (
        <svg width="15" height="15" viewBox="0 0 15 15">
          <circle cx="7.5" cy="7.5" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M7.5 1.5v1.6M7.5 12.9v1.6M13.5 7.5h-1.6M3.6 7.5H2M11.6 3.4l-1.13 1.13M4.53 10.47L3.4 11.6M11.6 11.6l-1.13-1.13M4.53 4.53L3.4 3.4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

export function Sidebar({ office }: { office: Office }) {
  const pathname = usePathname();
  const phase = currentPhase();
  const navRef = useRef<HTMLElement>(null);
  const [pill, setPill] = useState<{ top: number; height: number; visible: boolean; animate: boolean }>({
    top: 0,
    height: 0,
    visible: false,
    animate: false,
  });

  // Move o pill deslizante até o item ativo a cada navegação.
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const active = nav.querySelector<HTMLElement>('[data-active="true"]');
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
        width: 232,
        flex: "none",
        background: "#fff",
        borderRight: "1px solid #e7e7e3",
        display: "flex",
        flexDirection: "column",
        padding: "18px 12px 14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 10px 18px" }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: ACCENT,
            display: "grid",
            placeItems: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          R
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13.5, letterSpacing: "-.01em" }}>{office.name}</div>
          <div style={{ fontSize: 10.5, color: "#8a8d98" }}>Gestão da transição</div>
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
        {NAV.map((n) => {
          const active = pathname.startsWith("/" + n.seg);
          return (
            <Link
              key={n.seg}
              href={"/" + n.seg}
              data-active={active ? "true" : "false"}
              className={active ? undefined : "hv-nav"}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                color: active ? ACCENT : "#4b4e58",
                background: "transparent",
              }}
            >
              <Icon name={n.icon} />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div style={{ marginTop: "auto", padding: "12px 10px", background: "#f7f7f4", borderRadius: 10 }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: "#6b6e78",
            textTransform: "uppercase",
            letterSpacing: ".06em",
            marginBottom: 6,
          }}
        >
          Fase atual
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{phase.title}</div>
        <div style={{ fontSize: 11, color: "#8a8d98", marginTop: 2 }}>{phase.desc}</div>
        <div style={{ height: 5, background: "#e7e7e3", borderRadius: 99, marginTop: 8, overflow: "hidden" }}>
          <div style={{ width: `${phase.yearPct}%`, height: "100%", background: ACCENT, borderRadius: 99 }} />
        </div>
        <div style={{ fontSize: 10, color: "#8a8d98", marginTop: 4, fontFamily: "var(--font-jetbrains)" }}>
          {phase.yearPct}% do ano decorrido
        </div>
      </div>
      <button
        onClick={() => logout()}
        className="hv-danger"
        style={{
          marginTop: 10,
          fontSize: 11,
          fontWeight: 600,
          color: "#8a8d98",
          cursor: "pointer",
          padding: "4px 10px",
          background: "none",
          border: "none",
          textAlign: "left",
        }}
      >
        Sair da conta
      </button>
    </aside>
  );
}
