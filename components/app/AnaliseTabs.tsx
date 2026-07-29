"use client";

import { useRouter } from "next/navigation";
import { ACCENT } from "@/lib/design";

function tabStyle(active: boolean): React.CSSProperties {
  return {
    fontSize: 12.5, fontWeight: 600, padding: "8px 16px", borderRadius: 8,
    color: active ? "#fff" : "#4b4e58", background: active ? ACCENT : "#fff",
    border: `1px solid ${active ? ACCENT : "#e2e2de"}`,
  };
}

const TABS: { key: string; href: string; label: string }[] = [
  { key: "empresas", href: "/analise?tab=empresas", label: "Empresas" },
  { key: "importar", href: "/analise?tab=importar", label: "Importar XML" },
  { key: "fornecedores", href: "/analise?tab=fornecedores", label: "Fornecedores" },
  { key: "clientes", href: "/analise?tab=clientes", label: "Clientes" },
];

export function AnaliseTabs({ tab }: { tab: string }) {
  const router = useRouter();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {TABS.map((t) => (
        <a
          key={t.key}
          href={t.href}
          onClick={(e) => { e.preventDefault(); router.push(t.href); }}
          className={tab === t.key ? undefined : "hv-light"}
          style={tabStyle(tab === t.key)}
        >
          {t.label}
        </a>
      ))}
    </div>
  );
}
