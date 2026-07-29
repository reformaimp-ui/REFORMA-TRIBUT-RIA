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

const TABS: { key: string; label: string }[] = [
  { key: "fornecedores", label: "Fornecedores" },
  { key: "clientes", label: "Clientes" },
  { key: "produtos-comprados", label: "Produtos Comprados" },
  { key: "produtos-vendidos", label: "Produtos Vendidos" },
];

export function EmpresaDetailTabs({ empresaId, tab }: { empresaId: string; tab: string }) {
  const router = useRouter();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {TABS.map((t) => {
        const href = `/analise/empresas/${empresaId}?tab=${t.key}`;
        const active = tab === t.key;
        return (
          <a
            key={t.key}
            href={href}
            onClick={(e) => { e.preventDefault(); router.push(href); }}
            className={active ? undefined : "hv-light"}
            style={tabStyle(active)}
          >
            {t.label}
          </a>
        );
      })}
    </div>
  );
}
