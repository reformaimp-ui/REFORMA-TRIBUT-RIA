"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ACCENT } from "@/lib/design";

/**
 * Envolve o código do CST e abre um modal com os cClassTrib vinculados a ele.
 * Renderizado via portal em document.body — ver comentário em CclassInfo.tsx.
 */
export function CstLinksInfo({ cst, links, children }: { cst: string; links: { code: string; descr: string }[]; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const copy = async () => {
    const text = links.map((l) => (l.descr ? `${l.code} — ${l.descr}` : l.code)).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard indisponível */
    }
  };

  return (
    <>
      <div onClick={() => setOpen(true)} style={{ cursor: "pointer" }} title="Ver cClassTrib vinculados">
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
                  width: 480,
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
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".05em" }}>CST</div>
                  <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 15, fontWeight: 700, color: ACCENT }}>{cst}</div>
                  <div style={{ marginLeft: "auto", fontSize: 11, color: "#8a8d98" }}>{links.length} cClassTrib vinculado(s)</div>
                  <div onClick={() => setOpen(false)} className="hv-gray" style={{ fontSize: 16, color: "#8a8d98", cursor: "pointer", padding: 4, lineHeight: 1 }}>
                    ✕
                  </div>
                </div>

                {links.length ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
                    {links.map((l, i) => (
                      <div key={`${l.code}-${i}`} style={{ display: "flex", gap: 10, padding: "8px 10px", borderRadius: 8, background: "#fafaf8", border: "1px solid #f0f0ed" }}>
                        <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 700, color: "#7c3aed", flex: "none" }}>{l.code}</div>
                        <div style={{ fontSize: 12.5, color: "#33363f" }}>{l.descr || "—"}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "#a0a3ad", fontStyle: "italic", marginBottom: 22 }}>
                    Nenhum cClassTrib vinculado a este CST ainda.
                  </div>
                )}

                {links.length ? (
                  <button
                    type="button"
                    onClick={copy}
                    className="hv-btn"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#fff",
                      background: copied ? "#0e7a6f" : ACCENT,
                      padding: "9px 16px",
                      borderRadius: 8,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {copied ? "Copiado!" : "Copiar lista"}
                  </button>
                ) : null}
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
