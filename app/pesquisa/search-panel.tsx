"use client";

import { useEffect, useState, useTransition } from "react";
import { friendlyTaxSummary } from "@/lib/taxSummary";
import { NcmTreeView } from "@/components/app/NcmTreeView";
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
  SectionLabel,
  SaveButton,
  SavedList,
} from "@/components/portal/search-ui";
import { listSavedSearches, saveSearch, unsaveSearch, type SavedSearch } from "./saved-actions";
import { searchProdutoPublic, type ProdutoResult } from "./actions";

/** Chave estável do resultado — o mesmo NCM pode ter mais de uma linha (CST/cClassTrib). */
const refOf = (r: ProdutoResult) => `${r.ncm}|${r.cst}|${r.cclass}`;

export function SearchPanel() {
  const [term, setTerm] = useState("");
  const [searched, setSearched] = useState("");
  const [results, setResults] = useState<ProdutoResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ProdutoResult | null>(null);
  const [saved, setSaved] = useState<SavedSearch[]>([]);
  const [savePending, startSave] = useTransition();
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    void listSavedSearches("produto").then(setSaved);
  }, []);

  const runSearch = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setSelected(null);
    setSearched(query);
    const r = await searchProdutoPublic(query);
    setResults(r);
    setLoading(false);
    if (r.length === 1) setSelected(r[0]);
  };

  const toggleSave = (result: ProdutoResult) => {
    const ref = refOf(result);
    const already = saved.find((s) => s.ref === ref);
    startSave(async () => {
      if (already) {
        setSaved((cur) => cur.filter((s) => s.ref !== ref));
        const res = await unsaveSearch(ref, "produto");
        if (res.error) setSaved(await listSavedSearches("produto"));
        return;
      }
      const res = await saveSearch({ kind: "produto", ref, code: result.ncm, title: result.descr });
      if (res.saved) setSaved((cur) => [res.saved!, ...cur.filter((s) => s.ref !== ref)]);
    });
  };

  const removeSaved = (id: string) => {
    const target = saved.find((s) => s.id === id);
    if (!target) return;
    setRemoving(id);
    void unsaveSearch(target.ref, "produto").then(async (res) => {
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
        placeholder='Ex.: 1006.30.11 ou "arroz beneficiado"'
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
            <EmptyResults term={searched} kind="produto" />
          ) : (
            <>
              <ResultsCount count={results.length} />
              <div className="flex flex-col gap-2">
                {results.map((r) => (
                  <ResultItem
                    key={`${r.ncm}-${r.cst}-${r.cclass}`}
                    code={r.ncm}
                    title={r.descr}
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
          emptyHint="Nada salvo ainda. Ao abrir um produto, use “Salvar” para deixá-lo à mão aqui."
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
  result: ProdutoResult;
  saved: boolean;
  savePending: boolean;
  onToggleSave: () => void;
}) {
  const headline = friendlyTaxSummary(result);
  const isento = headline.startsWith("Isento");

  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <CodeBadge code={result.ncm} tone="muted" />
        <div className="flex items-center gap-2">
          <StatusPill isento={isento} />
          <SaveButton saved={saved} pending={savePending} onToggle={onToggleSave} />
        </div>
      </div>
      <h2 className="mt-2 text-lg font-bold leading-snug text-ink" style={{ textWrap: "pretty" }}>
        {result.descr}
      </h2>

      <TaxHeadline headline={headline} isento={isento} cst={result.cst} cstDescr={result.cstDescr} />

      <div className="mt-5 grid grid-cols-2 gap-3">
        <RateBox label="Alíquota de referência — IBS" value={result.aliq_ibs} />
        <RateBox label="Alíquota de referência — CBS" value={result.aliq_cbs} />
        <RateBox label="Redução — IBS" value={result.red_ibs} accent />
        <RateBox label="Redução — CBS" value={result.red_cbs} accent />
      </div>

      {result.cclassDescr ? (
        <div className="mt-5">
          <DetailRow label={`Classificação tributária (${result.cclass}):`}>{result.cclassDescr}</DetailRow>
        </div>
      ) : null}

      <div className="mt-6 border-t border-[#f0f0ed] pt-5">
        <SectionLabel>Onde esse produto está na tabela de NCM</SectionLabel>
        <NcmTreeView code={result.ncm} />
      </div>
    </div>
  );
}
