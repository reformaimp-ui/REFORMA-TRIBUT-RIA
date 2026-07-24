"use client";

import { useEffect, useState } from "react";
import { ACCENT } from "@/lib/design";
import { Spinner } from "@/components/app/Spinner";
import { getNcmTree, type NcmNode } from "@/app/(app)/ibs/actions";

export function NcmTreeView({ code }: { code: string }) {
  const [chain, setChain] = useState<NcmNode[]>([]);
  const [children, setChildren] = useState<NcmNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getNcmTree(code).then(({ chain, children }) => {
      if (!alive) return;
      setChain(chain);
      setChildren(children);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [code]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#8a8d98", padding: "8px 0" }}>
        <Spinner size={12} />
        Carregando árvore…
      </div>
    );
  }

  if (!chain.length) {
    return (
      <div style={{ fontSize: 12.5, color: "#a0a3ad", fontStyle: "italic", padding: "8px 0" }}>
        NCM não encontrado na base importada. Importe a tabela oficial em “+ Adicionar dado → Árvore de NCM”.
      </div>
    );
  }

  return (
    <div className="animate-fadeup">
      <div style={{ display: "flex", flexDirection: "column" }}>
        {chain.map((node, i) => {
          const isLast = i === chain.length - 1;
          return (
            <div
              key={node.digits}
              style={{ display: "flex", alignItems: "baseline", gap: 8, paddingLeft: i * 22, paddingTop: i === 0 ? 0 : 5 }}
            >
              {i > 0 ? <span style={{ color: "#c7c9d1", fontSize: 12, fontFamily: "var(--font-jetbrains)" }}>└──</span> : null}
              <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12.5, fontWeight: 700, color: isLast ? ACCENT : "#6b6e78", flex: "none" }}>
                {node.code}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: isLast ? 700 : 500, color: isLast ? "#1c1d22" : "#4b4e58" }}>{node.descr}</span>
            </div>
          );
        })}
      </div>

      {children.length ? (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f0f0ed" }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
            Subníveis diretos ({children.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 220, overflow: "auto" }}>
            {children.map((c) => (
              <div key={c.digits} style={{ display: "flex", gap: 8, fontSize: 12 }}>
                <span style={{ fontFamily: "var(--font-jetbrains)", color: ACCENT, fontWeight: 600, flex: "none" }}>{c.code}</span>
                <span style={{ color: "#4b4e58" }}>{c.descr}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
