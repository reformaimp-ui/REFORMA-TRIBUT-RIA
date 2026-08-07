"use client";

import { useEffect, useState, useTransition } from "react";
import { friendlyTaxSummary } from "@/lib/taxSummary";
import {
  SearchField,
  CodeBadge,
  StatusPill,
  ResultsCount,
  ResultItem,
  EmptyResults,
  ResultsSkeleton,
  BackToResults,
  TaxHeadline,
  RateBox,
  DetailRow,
  SaveButton,
  SavedList,
} from "@/components/portal/search-ui";
import { listSavedSearches, saveSearch, unsaveSearch, type SavedSearch } from "../saved-actions";
import { searchServicoPublic, type ServicoResult } from "../actions";

/** Chave estável do resultado — o mesmo NBS pode ter mais de um item. */
const refOf = (r: ServicoResult) => `${r.nbs}|${r.cclass}|${r.item_code}`;
const titleOf = (r: ServicoResult) => `${r.item_code ? `${r.item_code} — ` : ""}${r.item}`;

export function ServicoSearchPanel() {
  const [term, setTerm] = useState("");
  const [searched, setSearched] = useState("");
  const [results, setResults] = useState<ServicoResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ServicoResult | null>(null);
  const [saved, setSaved] = useState<SavedSearch[]>([]);
  const [savePending, startSave] = useTransition();
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    void listSavedSearches("servico").then(setSaved);
  }, []);

  const runSearch = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setSelected(null);
    setSearched(query);
    const r = await searchServicoPublic(query);
    setResults(r);
    setLoading(false);
    if (r.length === 1) setSelected(r[0]);
  };

  const toggleSave = (result: ServicoResult) => {
    const ref = refOf(result);
    const already = saved.find((s) => s.ref === ref);
    startSave(async () => {
      if (already) {
        setSaved((cur) => cur.filter((s) => s.ref !== ref));
        const res = await unsaveSearch(ref, "servico");
        if (res.error) setSaved(await listSavedSearches("servico"));
        return;
      }
      const res = await saveSearch({ kind: "servico", ref, code: result.nbs, title: titleOf(result), subtitle: result.nbs_descr });
      if (res.saved) setSaved((cur) => [res.saved!, ...cur.filter((s) => s.ref !== ref)]);
    });
  };

  const removeSaved = (id: string) => {
    const target = saved.find((s) => s.id === id);
    if (!target) return;
    setRemoving(id);
    void unsaveSearch(target.ref, "servico").then((res) => {
      setRemoving(null);
      if (res.error) return;
      setSaved((cur) => cur.filter((s) => s.id !== id));
    });
  };

  const openSaved = (code: string) => {
    setTerm(code);
    void runSearch(code);
  };

  const isIdle = !loading && !results && !selected;

  return (
    <div>
      <SearchField
        value={term}
        onChange={setTerm}
        onSubmit={() => void runSearch(term)}
        placeholder='Ex.: 1.1502.10.00 ou "desenvolvimento de sistemas"'
        loading={loading}
        autoFocus
      />

      {loading ? (
        <div className="mt-5">
          <ResultsSkeleton />
        </div>
      ) : null}

      {!loading && results && !selected ? (
        <div className="stagger mt-5">
          {results.length === 0 ? (
            <EmptyResults term={searched} kind="serviço" />
          ) : (
            <>
              <ResultsCount count={results.length} />
              <div className="flex flex-col gap-2">
                {results.map((r, i) => (
                  <ResultItem
                    key={`${r.nbs}-${r.cclass}-${i}`}
                    code={r.nbs}
                    title={`${r.item_code ? `${r.item_code} — ` : ""}${r.item}`}
                    subtitle={r.nbs_descr}
                    onClick={() => setSelected(r)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}

      {!loading && selected ? (
        <div className="animate-fadeup mt-6">
          {results && results.length > 1 ? <BackToResults onClick={() => setSelected(null)} /> : null}
          <ResultCard
            result={selected}
            saved={saved.some((s) => s.ref === refOf(selected))}
            savePending={savePending}
            onToggleSave={() => toggleSave(selected)}
          />
        </div>
      ) : null}

      {isIdle ? (
        <SavedList
          items={saved}
          onOpen={openSaved}
          onRemove={removeSaved}
          removing={removing}
          emptyHint="Nada salvo ainda. Ao abrir um serviço, use “Salvar” para deixá-lo à mão aqui."
        />
      ) : null}
    </div>
  );
}

function ResultCard({
  result,
  saved,
  savePending,
  onToggleSave,
}: {
  result: ServicoResult;
  saved: boolean;
  savePending: boolean;
  onToggleSave: () => void;
}) {
  const headline = friendlyTaxSummary(result);
  const isento = headline.startsWith("Isento");

  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <CodeBadge code={result.nbs} tone="muted" />
        <div className="flex items-center gap-2">
          <StatusPill isento={isento} />
          <SaveButton saved={saved} pending={savePending} onToggle={onToggleSave} />
        </div>
      </div>
      <h2 className="mt-2 text-lg font-bold leading-snug text-ink" style={{ textWrap: "pretty" }}>
        {result.item_code ? `${result.item_code} — ` : ""}
        {result.item}
      </h2>
      <p className="mt-1 text-[13.5px] leading-relaxed text-[#6b6e78]" style={{ textWrap: "pretty" }}>
        {result.nbs_descr}
      </p>

      <TaxHeadline headline={headline} isento={isento} cst={result.cst} cstDescr={result.cstDescr} />

      <div className="mt-5 grid grid-cols-2 gap-3">
        <RateBox label="Redução — IBS" value={result.red_ibs} accent />
        <RateBox label="Redução — CBS" value={result.red_cbs} accent />
      </div>

      <div className="mt-5 flex flex-col gap-1.5">
        <DetailRow label="INDOP:">{result.indop || "—"}</DetailRow>
        <DetailRow label="Local de incidência do IBS:">{result.local_ibs || "—"}</DetailRow>
        {result.cclass_nome ? (
          <DetailRow label={`Classificação tributária (${result.cclass}):`}>{result.cclass_nome}</DetailRow>
        ) : null}
      </div>
    </div>
  );
}
