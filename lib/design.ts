/**
 * Design tokens and pure helpers ported from the validated prototype.
 * Data-driven colors (avatars, progress bars, badges) stay as inline styles for exact fidelity.
 */

export const ACCENT = "#4653d6";

export const PALETTE = [
  "#4653d6",
  "#0e7a6f",
  "#b3512e",
  "#5b5f6b",
  "#8a4fd3",
  "#1d6fb8",
  "#c9435a",
  "#2f8f6f",
];

export const CATEGORY_OPTIONS = [
  "Fiscal",
  "Sistemas",
  "Contratual",
  "Compliance",
  "Treinamento",
] as const;
export type Category = (typeof CATEGORY_OPTIONS)[number];

export const catMeta: Record<string, { bg: string; fg: string }> = {
  Fiscal: { bg: "#eef1ff", fg: ACCENT },
  Sistemas: { bg: "#f1eafe", fg: "#7c3aed" },
  Contratual: { bg: "#fdf3e6", fg: "#b5750f" },
  Compliance: { bg: "#e8f5ec", fg: "#1f9254" },
  Treinamento: { bg: "#fdecea", fg: "#c0392b" },
};

export const REGIME_OPTIONS = ["Simples Nacional", "Lucro Presumido", "Lucro Real"] as const;

export const STATUS_COLOR: Record<string, [string, string]> = {
  "Em dia": ["#e8f5f0", "#0e7a6f"],
  "Atenção": ["#fdf6ef", "#9a5b1f"],
  "Crítico": ["#fdf2f0", "#b3402e"],
};

export const sevMap: Record<string, { label: string; dot: string; tagBg: string; tagFg: string }> = {
  informativo: { label: "Informativo", dot: "#8a8d98", tagBg: "#ececea", tagFg: "#5b5f6b" },
  critico: { label: "Crítico", dot: "#d64545", tagBg: "#fdecea", tagFg: "#c0392b" },
  importante: { label: "Importante", dot: "#c98a2e", tagBg: "#fdf3e6", tagFg: "#b5750f" },
};

export const badgeMap: Record<string, { bg: string; fg: string }> = {
  SISTEMAS: { bg: "#f1eafe", fg: "#7c3aed" },
  NFS: { bg: "#e8f5ec", fg: "#1f9254" },
};

export const tipoColor: Record<string, string> = {
  acessoria: "#4653d6",
  pagamento: "#0e7a6f",
  reforma: "#b3512e",
  interno: "#8a8d98",
};
export const tipoLabel: Record<string, string> = {
  acessoria: "Acessória",
  pagamento: "Pagamento",
  reforma: "Reforma",
  interno: "Interno",
};

export const NODE_COLORS = ["#4653d6", "#0e7a6f", "#b3512e", "#5b5f6b"];

export function progColor(p: number): string {
  return p >= 100 ? "#0e7a6f" : p >= 50 ? ACCENT : p >= 1 ? "#c98a2e" : "#c2c3c9";
}

export function statusLabel(p: number): string {
  return p >= 100 ? "Concluída" : p === 0 ? "Não iniciada" : "Em andamento";
}

export function iniOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "??"
  );
}

/** Avatar circle style. */
export function av(color: string, size: number): React.CSSProperties {
  return {
    width: size,
    height: size,
    flex: "none",
    borderRadius: 99,
    background: color,
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontSize: size * 0.38,
    fontWeight: 700,
  };
}

export const toBRshort = (iso?: string | null) =>
  iso ? iso.slice(8, 10) + "/" + iso.slice(5, 7) : "—";
export const toBRfull = (iso?: string | null) =>
  iso ? iso.slice(8, 10) + "/" + iso.slice(5, 7) + "/" + iso.slice(0, 4) : "—";

export function isoDate(d = new Date()): string {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

const WD = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MO = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function headerDate(now = new Date()): string {
  return `${WD[now.getDay()]}, ${String(now.getDate()).padStart(2, "0")} ${MO[now.getMonth()]} ${now.getFullYear()}`;
}

/** Current transition phase + % of the year elapsed, for the sidebar. */
export function currentPhase(now = new Date()) {
  const yr = now.getFullYear();
  const yearStart = new Date(yr, 0, 1);
  const yearEnd = new Date(yr + 1, 0, 1);
  const yearPct = Math.round(((+now - +yearStart) / (+yearEnd - +yearStart)) * 100);
  const phase =
    yr <= 2026
      ? { title: `${yr} — Ano-teste`, desc: "CBS 0,9% + IBS 0,1% em destaque na NF-e" }
      : yr === 2027
        ? { title: "2027 — CBS integral", desc: "PIS/Cofins extintos; Imposto Seletivo em vigor" }
        : yr === 2028
          ? { title: "2028 — Consolidação", desc: "CBS e IS plenos; IBS em alíquota de teste" }
          : yr <= 2032
            ? { title: `${yr} — Transição IBS`, desc: "ICMS e ISS reduzidos gradualmente; IBS sobe" }
            : { title: `${yr} — Regime pleno`, desc: "IVA dual em vigência integral" };
  return { yr, yearPct, ...phase };
}
