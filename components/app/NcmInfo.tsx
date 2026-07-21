"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ACCENT } from "@/lib/design";
import { NcmTreeView } from "@/components/app/NcmTreeView";

/**
 * Envolve o NCM de um produto e abre um modal com a árvore completa de
 * classificação (capítulo → posição → subposição → item), reaproveitando o
 * mesmo padrão de modal via portal do CclassInfo.
 */
export function NcmInfo({ code, children }: { code: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!code) return <>{children}</>;

  return (
    <>
      <div onClick={() => setOpen(true)} style={{ cursor: "pointer" }} title="Ver árvore do NCM">
        {children}
      </div>

      {open && mounted
        ? createPortal(
            <>
              <div
                onClick={() => setOpen(false)}
                className="overlay-in"
                style={{ position: "fixed", inset: 0, background: "rgba(20,20,30,.45)", zIndex: 60 }}
              />
              <div
                role="dialog"
                className="modal-in"
                style={{
                  position: "fixed",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%,-50%)",
                  width: 580,
                  maxWidth: "94vw",
                  maxHeight: "80vh",
                  overflow: "auto",
                  background: "#fff",
                  borderRadius: 16,
                  zIndex: 70,
                  padding: "24px 26px",
                  boxShadow: "0 24px 80px rgba(20,20,30,.3)",
                  cursor: "default",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".05em" }}>Árvore de NCM</div>
                  <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 15, fontWeight: 700, color: ACCENT }}>{code}</div>
                  <div onClick={() => setOpen(false)} className="hv-gray" style={{ marginLeft: "auto", fontSize: 16, color: "#8a8d98", cursor: "pointer", padding: 4, lineHeight: 1 }}>
                    ✕
                  </div>
                </div>
                <NcmTreeView code={code} />
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
