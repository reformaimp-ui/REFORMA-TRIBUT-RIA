"use client";

import * as React from "react";
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Search, SearchX, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/app/Spinner";

// Peças visuais compartilhadas pelas abas de pesquisa do portal do cliente
// (produtos e serviços). Mesma linguagem do campo do Assistente IA: card branco,
// borda #e7e7e3, cantos arredondados e accent do escritório na ação principal.

// ----------------------------------------------------------------------
// Campo de busca
// ----------------------------------------------------------------------
export function SearchField({
  value,
  onChange,
  onSubmit,
  placeholder,
  loading,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
  loading: boolean;
  autoFocus?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const canSearch = value.trim() !== "" && !loading;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSearch) onSubmit();
      }}
      className="relative flex items-center rounded-2xl border border-line bg-white shadow-sm transition-colors focus-within:border-accent/40"
    >
      <Search className="pointer-events-none absolute left-4 h-[18px] w-[18px] text-muted/70" />

      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus={autoFocus}
        className="w-full bg-transparent py-4 pl-12 pr-[150px] text-[14.5px] text-ink outline-none placeholder:text-muted/70"
      />

      <div className="absolute right-2 flex items-center gap-1">
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            aria-label="Limpar busca"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-paper hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}

        <button
          type="submit"
          disabled={!canSearch}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
            canSearch
              ? "cursor-pointer bg-accent text-white hover:bg-accent-hover"
              : "cursor-not-allowed bg-[#f0f0ed] text-muted",
          )}
        >
          {loading ? <Spinner size={13} color="#8a8d98" /> : null}
          {loading ? "Buscando…" : "Pesquisar"}
        </button>
      </div>
    </form>
  );
}

// ----------------------------------------------------------------------
// Etiquetas
// ----------------------------------------------------------------------
export function CodeBadge({ code, tone = "accent" }: { code: string; tone?: "accent" | "muted" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-[11.5px] font-bold",
        tone === "accent" ? "bg-[#eef1ff] text-accent" : "bg-paper text-[#6b6e78]",
      )}
      style={{ fontFamily: "var(--font-jetbrains), monospace" }}
    >
      {code}
    </span>
  );
}

export function StatusPill({ isento }: { isento: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
        isento ? "bg-[#e8f5f0] text-[#0e7a6f]" : "bg-[#eef1ff] text-accent",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", isento ? "bg-[#0e7a6f]" : "bg-accent")} />
      {isento ? "Isento" : "Tributado"}
    </span>
  );
}

// ----------------------------------------------------------------------
// Lista de resultados
// ----------------------------------------------------------------------
export function ResultsCount({ count }: { count: number }) {
  return (
    <div className="mb-2.5 text-[11px] font-bold uppercase tracking-[.06em] text-muted">
      {count} {count === 1 ? "resultado encontrado" : "resultados encontrados"}
    </div>
  );
}

export function ResultItem({
  code,
  title,
  subtitle,
  onClick,
}: {
  code: string;
  title: string;
  subtitle?: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hv-card group flex w-full items-center gap-4 rounded-xl border border-line bg-white px-4 py-3.5 text-left"
    >
      <span className="min-w-0 flex-1">
        <CodeBadge code={code} />
        <span className="mt-1.5 block text-[13.5px] font-semibold leading-snug text-ink" style={{ textWrap: "pretty" }}>
          {title}
        </span>
        {subtitle ? <span className="mt-0.5 block text-xs leading-snug text-muted">{subtitle}</span> : null}
      </span>
      <ChevronRight className="h-[18px] w-[18px] shrink-0 text-muted/60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent" />
    </button>
  );
}

export function EmptyResults({ term, kind }: { term: string; kind: "produto" | "serviço" }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-[#dcdcd8] bg-white/60 px-6 py-12 text-center">
      <SearchX className="h-7 w-7 text-muted/50" />
      <div className="mt-3 text-[13.5px] font-semibold text-ink">Nenhum {kind} encontrado para “{term}”</div>
      <div className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted">
        Revise o código ou tente uma descrição mais curta e genérica — só o material ou a finalidade principal, sem marca nem modelo.
      </div>
    </div>
  );
}

export function ResultsSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-line bg-white px-4 py-3.5"
          style={{ animation: "skeletonPulse 1.2s ease-in-out infinite", animationDelay: `${i * 0.12}s` }}
        >
          <div className="h-[22px] w-24 rounded-md bg-paper" />
          <div className="mt-2 h-[13px] w-3/5 rounded bg-paper" />
        </div>
      ))}
    </div>
  );
}

export function BackToResults({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-3.5 inline-flex items-center gap-1 rounded-full border border-line bg-white py-1.5 pl-2 pr-3.5 text-xs font-semibold text-[#4b4e58] transition-colors hover:border-[#d8d8d4] hover:bg-paper hover:text-ink"
    >
      <ChevronLeft className="h-4 w-4" />
      Voltar aos resultados
    </button>
  );
}

// ----------------------------------------------------------------------
// Cartão de detalhe
// ----------------------------------------------------------------------
export function TaxHeadline({
  headline,
  isento,
  cst,
  cstDescr,
}: {
  headline: string;
  isento: boolean;
  cst?: string | null;
  cstDescr?: string | null;
}) {
  return (
    <div
      className={cn(
        "mt-5 rounded-xl border px-5 py-4",
        isento ? "border-[#c9ebdf] bg-[#e8f5f0]" : "border-[#d9deff] bg-[#f7f8ff]",
      )}
    >
      <div className={cn("text-base font-bold", isento ? "text-[#0e7a6f]" : "text-accent")} style={{ textWrap: "pretty" }}>
        {headline}
      </div>
      {cstDescr ? (
        <div className="mt-1 text-xs text-[#6b6e78]">
          CST {cst} — {cstDescr}
        </div>
      ) : null}
    </div>
  );
}

export function RateBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  const empty = !value;
  return (
    <div className="rounded-xl border border-[#ececea] bg-[#fafaf8] px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-[.04em] text-muted">{label}</div>
      <div className={cn("mt-0.5 text-[17px] font-bold", empty ? "text-[#c2c3c9]" : accent ? "text-[#0e7a6f]" : "text-ink")}>
        {value || "—"}
      </div>
    </div>
  );
}

export function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[12.5px] leading-relaxed text-[#4b4e58]">
      <span className="font-bold text-ink">{label}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-2.5 text-[10.5px] font-bold uppercase tracking-[.05em] text-muted">{children}</div>;
}

// ----------------------------------------------------------------------
// Salvos
// ----------------------------------------------------------------------
export function SaveButton({
  saved,
  pending,
  onToggle,
}: {
  saved: boolean;
  pending: boolean;
  onToggle: () => void;
}) {
  const Icon = saved ? BookmarkCheck : Bookmark;
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={pending}
      aria-pressed={saved}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-bold transition-colors",
        "outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-60",
        saved
          ? "border-accent/30 bg-[#eef1ff] text-accent hover:bg-[#e4e8ff]"
          : "border-line bg-white text-[#4b4e58] hover:border-[#d8d8d4] hover:bg-paper hover:text-ink",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {saved ? "Salvo" : "Salvar"}
    </button>
  );
}

export function SavedList({
  items,
  onOpen,
  onRemove,
  removing,
  emptyHint,
}: {
  items: { id: string; code: string; title: string; subtitle?: string | null }[];
  onOpen: (code: string) => void;
  onRemove: (id: string) => void;
  removing: string | null;
  emptyHint: string;
}) {
  return (
    <section className="mt-8">
      <SectionLabel>Salvos</SectionLabel>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#dcdcd8] bg-white/60 px-5 py-7 text-center text-xs leading-relaxed text-muted">
          {emptyHint}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((s) => (
            <div
              key={s.id}
              className="hv-card group flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3"
            >
              <button type="button" onClick={() => onOpen(s.code)} className="min-w-0 flex-1 text-left">
                <CodeBadge code={s.code} />
                <span className="mt-1 block truncate text-[13px] font-semibold text-ink">{s.title}</span>
                {s.subtitle ? <span className="block truncate text-[11.5px] text-muted">{s.subtitle}</span> : null}
              </button>
              <button
                type="button"
                onClick={() => onRemove(s.id)}
                disabled={removing === s.id}
                aria-label={`Remover ${s.code} dos salvos`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-[#fdf2f0] hover:text-[#b3402e] disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
