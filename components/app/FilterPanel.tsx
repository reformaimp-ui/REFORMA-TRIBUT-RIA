"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ACCENT } from "@/lib/design";
import { fetchCstOptions, fetchCclassOptions, fetchAliquotaOptions, type FilterState } from "@/app/(app)/relatorios/exportar/actions";

export type { FilterState };

export function FilterPanel({ initialFilters }: { initialFilters: FilterState }) {
  const router = useRouter();
  const [filters, setFilters] = useState(initialFilters);
  const [cstOptions, setCstOptions] = useState<{ code: string; descr: string }[]>([]);
  const [cclassOptions, setCclassOptions] = useState<{ code: string; descr: string }[]>([]);
  const [aliquotaOptions, setAliquotaOptions] = useState<{ aliqIbs: string[]; aliqCbs: string[]; redIbs: string[]; redCbs: string[] }>({
    aliqIbs: [],
    aliqCbs: [],
    redIbs: [],
    redCbs: [],
  });
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [cstSearch, setCstSearch] = useState("");
  const [cclassSearch, setCclassSearch] = useState("");

  // Load options on mount
  useEffect(() => {
    async function loadOptions() {
      const [cst, cclass, aliquota] = await Promise.all([fetchCstOptions(), fetchCclassOptions(), fetchAliquotaOptions()]);
      setCstOptions(cst);
      setCclassOptions(cclass);
      setAliquotaOptions(aliquota);
      setLoadingOptions(false);
    }
    loadOptions();
  }, []);

  const updateUrl = (newFilters: FilterState) => {
    const params = new URLSearchParams();
    if (newFilters.cst.length > 0) params.set("cst", newFilters.cst.join(","));
    if (newFilters.cclass.length > 0) params.set("cclass", newFilters.cclass.join(","));
    if (newFilters.aliqIbs.length > 0) params.set("aliqIbs", newFilters.aliqIbs.join(","));
    if (newFilters.aliqCbs.length > 0) params.set("aliqCbs", newFilters.aliqCbs.join(","));
    if (newFilters.redIbs.length > 0) params.set("redIbs", newFilters.redIbs.join(","));
    if (newFilters.redCbs.length > 0) params.set("redCbs", newFilters.redCbs.join(","));
    if (newFilters.types.length > 0 && newFilters.types.length < 2) params.set("types", newFilters.types.join(","));

    const queryString = params.toString();
    router.push(queryString ? `/relatorios/exportar?${queryString}` : "/relatorios/exportar");
  };

  const handleCstToggle = (code: string) => {
    const newCst = filters.cst.includes(code) ? filters.cst.filter((c) => c !== code) : [...filters.cst, code];
    const newFilters = { ...filters, cst: newCst };
    setFilters(newFilters);
    updateUrl(newFilters);
  };

  const handleCclassToggle = (code: string) => {
    const newCclass = filters.cclass.includes(code) ? filters.cclass.filter((c) => c !== code) : [...filters.cclass, code];
    const newFilters = { ...filters, cclass: newCclass };
    setFilters(newFilters);
    updateUrl(newFilters);
  };

  const handleAliquotaToggle = (field: "aliqIbs" | "aliqCbs" | "redIbs" | "redCbs", value: string) => {
    const current = filters[field];
    const newValue = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    const newFilters = { ...filters, [field]: newValue };
    setFilters(newFilters);
    updateUrl(newFilters);
  };

  const handleTypeToggle = (type: string) => {
    const newTypes = filters.types.includes(type) ? filters.types.filter((t) => t !== type) : [...filters.types, type];
    const newFilters = { ...filters, types: newTypes };
    setFilters(newFilters);
    updateUrl(newFilters);
  };

  const clearFilters = () => {
    const newFilters: FilterState = {
      cst: [],
      cclass: [],
      aliqIbs: [],
      aliqCbs: [],
      redIbs: [],
      redCbs: [],
      types: ["produtos", "servicos"],
    };
    setFilters(newFilters);
    setCstSearch("");
    setCclassSearch("");
    updateUrl(newFilters);
  };

  const filteredCstOptions = cstOptions.filter((opt) => opt.code.includes(cstSearch) || opt.descr.toLowerCase().includes(cstSearch.toLowerCase()));
  const filteredCclassOptions = cclassOptions.filter((opt) => opt.code.includes(cclassSearch) || opt.descr.toLowerCase().includes(cclassSearch.toLowerCase()));

  return (
    <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
          Tipos
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={filters.types.includes("produtos")}
              onChange={() => handleTypeToggle("produtos")}
              style={{ cursor: "pointer" }}
            />
            Produtos (NCM)
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={filters.types.includes("servicos")}
              onChange={() => handleTypeToggle("servicos")}
              style={{ cursor: "pointer" }}
            />
            Serviços (NBS)
          </label>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #e7e7e3", paddingTop: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
          CST
        </div>
        {loadingOptions ? (
          <div style={{ fontSize: 12, color: "#8a8d98" }}>Carregando...</div>
        ) : (
          <>
            <input
              type="text"
              placeholder="Pesquisar CST..."
              value={cstSearch}
              onChange={(e) => setCstSearch(e.target.value)}
              style={{
                width: "100%",
                fontSize: 11,
                padding: "6px 8px",
                border: "1px solid #e7e7e3",
                borderRadius: 6,
                marginBottom: 8,
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 150, overflow: "auto" }}>
              {filteredCstOptions.length === 0 ? (
                <div style={{ fontSize: 11, color: "#8a8d98" }}>Nenhum resultado</div>
              ) : (
                filteredCstOptions.map((opt) => (
                  <label key={opt.code} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={filters.cst.includes(opt.code)}
                      onChange={() => handleCstToggle(opt.code)}
                      style={{ cursor: "pointer" }}
                    />
                    <span>
                      {opt.code} — {opt.descr}
                    </span>
                  </label>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <div style={{ borderTop: "1px solid #e7e7e3", paddingTop: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
          cClassTrib
        </div>
        {loadingOptions ? (
          <div style={{ fontSize: 12, color: "#8a8d98" }}>Carregando...</div>
        ) : (
          <>
            <input
              type="text"
              placeholder="Pesquisar cClassTrib..."
              value={cclassSearch}
              onChange={(e) => setCclassSearch(e.target.value)}
              style={{
                width: "100%",
                fontSize: 11,
                padding: "6px 8px",
                border: "1px solid #e7e7e3",
                borderRadius: 6,
                marginBottom: 8,
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 150, overflow: "auto" }}>
              {filteredCclassOptions.length === 0 ? (
                <div style={{ fontSize: 11, color: "#8a8d98" }}>Nenhum resultado</div>
              ) : (
                filteredCclassOptions.map((opt) => (
                  <label key={opt.code} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={filters.cclass.includes(opt.code)}
                      onChange={() => handleCclassToggle(opt.code)}
                      style={{ cursor: "pointer" }}
                    />
                    <span>
                      {opt.code} — {opt.descr}
                    </span>
                  </label>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <div style={{ borderTop: "1px solid #e7e7e3", paddingTop: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
          Alíquota IBS (%)
        </div>
        {loadingOptions ? (
          <div style={{ fontSize: 12, color: "#8a8d98" }}>Carregando...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 150, overflow: "auto" }}>
            {aliquotaOptions.aliqIbs.length === 0 ? (
              <div style={{ fontSize: 11, color: "#8a8d98" }}>Nenhuma alíquota cadastrada</div>
            ) : (
              aliquotaOptions.aliqIbs.map((aliq) => (
                <label key={`aliq-ibs-${aliq}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={filters.aliqIbs.includes(aliq)}
                    onChange={() => handleAliquotaToggle("aliqIbs", aliq)}
                    style={{ cursor: "pointer" }}
                  />
                  <span>{aliq}%</span>
                </label>
              ))
            )}
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid #e7e7e3", paddingTop: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
          Alíquota CBS (%)
        </div>
        {loadingOptions ? (
          <div style={{ fontSize: 12, color: "#8a8d98" }}>Carregando...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 150, overflow: "auto" }}>
            {aliquotaOptions.aliqCbs.length === 0 ? (
              <div style={{ fontSize: 11, color: "#8a8d98" }}>Nenhuma alíquota cadastrada</div>
            ) : (
              aliquotaOptions.aliqCbs.map((aliq) => (
                <label key={`aliq-cbs-${aliq}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={filters.aliqCbs.includes(aliq)}
                    onChange={() => handleAliquotaToggle("aliqCbs", aliq)}
                    style={{ cursor: "pointer" }}
                  />
                  <span>{aliq}%</span>
                </label>
              ))
            )}
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid #e7e7e3", paddingTop: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
          Redução IBS (%)
        </div>
        {loadingOptions ? (
          <div style={{ fontSize: 12, color: "#8a8d98" }}>Carregando...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 150, overflow: "auto" }}>
            {aliquotaOptions.redIbs.length === 0 ? (
              <div style={{ fontSize: 11, color: "#8a8d98" }}>Nenhuma redução cadastrada</div>
            ) : (
              aliquotaOptions.redIbs.map((red) => (
                <label key={`red-ibs-${red}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={filters.redIbs.includes(red)}
                    onChange={() => handleAliquotaToggle("redIbs", red)}
                    style={{ cursor: "pointer" }}
                  />
                  <span>{red}%</span>
                </label>
              ))
            )}
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid #e7e7e3", paddingTop: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
          Redução CBS (%)
        </div>
        {loadingOptions ? (
          <div style={{ fontSize: 12, color: "#8a8d98" }}>Carregando...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 150, overflow: "auto" }}>
            {aliquotaOptions.redCbs.length === 0 ? (
              <div style={{ fontSize: 11, color: "#8a8d98" }}>Nenhuma redução cadastrada</div>
            ) : (
              aliquotaOptions.redCbs.map((red) => (
                <label key={`red-cbs-${red}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={filters.redCbs.includes(red)}
                    onChange={() => handleAliquotaToggle("redCbs", red)}
                    style={{ cursor: "pointer" }}
                  />
                  <span>{red}%</span>
                </label>
              ))
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={clearFilters}
        className="hv-light"
        style={{
          marginTop: 4,
          width: "100%",
          fontSize: 12,
          fontWeight: 600,
          color: "#4b4e58",
          background: "#fff",
          border: "1px solid #e2e2de",
          borderRadius: 8,
          padding: "7px 12px",
          cursor: "pointer",
        }}
      >
        Limpar Filtros
      </button>
    </div>
  );
}
