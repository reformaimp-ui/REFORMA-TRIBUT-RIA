"use client";

import { useState } from "react";
import { ACCENT } from "@/lib/design";

/**
 * Envolve um gatilho (código ou linha de cClassTrib) e abre um modal com a
 * descrição completa + botão de copiar, já que a coluna não pode ser redimensionada.
 */
export function CclassInfo({ code, descr, children }: { code: string; descr: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(descr ? `${code} — ${descr}` : code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard indisponível */
    }
  };

  return (
    <>
      <div onClick={() => setOpen(true)} style={{ cursor: "pointer" }} title="Ver descrição completa">
        {children}
      </div>

      {open ? (
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
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".05em" }}>cClassTrib</div>
              <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 15, fontWeight: 700, color: "#7c3aed" }}>{code}</div>
              <div onClick={() => setOpen(false)} className="hv-gray" style={{ marginLeft: "auto", fontSize: 16, color: "#8a8d98", cursor: "pointer", padding: 4, lineHeight: 1 }}>
                ✕
              </div>
            </div>
            <div style={{ fontSize: 13.5, color: "#33363f", lineHeight: 1.65, marginBottom: 22, whiteSpace: "pre-wrap" }}>
              {descr || "Sem descrição cadastrada."}
            </div>
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
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}
