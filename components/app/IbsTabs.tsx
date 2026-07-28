"use client";

import { useRouter } from "next/navigation";
import { ACCENT } from "@/lib/design";
import { useIbsEditGuard } from "@/components/app/IbsEditGuard";

function tabStyle(active: boolean): React.CSSProperties {
  return {
    fontSize: 12.5, fontWeight: 600, padding: "8px 16px", borderRadius: 8,
    color: active ? "#fff" : "#4b4e58", background: active ? ACCENT : "#fff",
    border: `1px solid ${active ? ACCENT : "#e2e2de"}`,
  };
}

const TABS: { key: string; href: string; label: string }[] = [
  { key: "dados", href: "/ibs?tab=dados", label: "Dados do IBS e CBS" },
  { key: "produtos", href: "/ibs?tab=produtos", label: "Tributação dos produtos" },
  { key: "servicos", href: "/ibs?tab=servicos", label: "Tributação dos serviços" },
  { key: "arvore-ncm", href: "/ibs?tab=arvore-ncm", label: "Árvore de NCM" },
  { key: "grupos-produtos", href: "/ibs?tab=grupos-produtos", label: "Grupos de produtos" },
  { key: "grupos-servicos", href: "/ibs?tab=grupos-servicos", label: "Grupos de serviços" },
  { key: "assistente", href: "/ibs?tab=assistente", label: "Assistente IA" },
];

/**
 * Client Component porque precisa consultar o IbsEditGuard antes de navegar —
 * um Link comum do Server Component não tem como interceptar o clique.
 */
export function IbsTabs({ tab, addHref }: { tab: string; addHref: string | null }) {
  const router = useRouter();
  const { requestNav } = useIbsEditGuard();

  const go = (href: string) => {
    requestNav(() => router.push(href));
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {TABS.map((t) => (
        <a
          key={t.key}
          href={t.href}
          onClick={(e) => { e.preventDefault(); go(t.href); }}
          className={tab === t.key ? undefined : "hv-light"}
          style={tabStyle(tab === t.key)}
        >
          {t.label}
        </a>
      ))}
      {addHref ? (
        <a
          href={addHref}
          onClick={(e) => { e.preventDefault(); go(addHref); }}
          className="hv-btn"
          style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "#fff", background: ACCENT, borderRadius: 8, padding: "7px 14px" }}
        >
          + Adicionar dado
        </a>
      ) : null}
    </div>
  );
}
