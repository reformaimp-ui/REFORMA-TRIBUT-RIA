"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ACCENT, PALETTE } from "@/lib/design";
import { TableSearch } from "@/components/app/TableSearch";
import { Spinner } from "@/components/app/Spinner";
import { CstLinksInfo } from "@/components/app/CstLinksInfo";
import { CclassInfo } from "@/components/app/CclassInfo";
import {
  createGroup, renameGroup, updateGroupNotes, deleteGroup,
  listGroupItems, searchItemsToLink, linkItem, unlinkItem, updateLinkNotes, getGroupExportData,
  createCategory, renameCategory, updateCategoryColor, deleteCategory, addCategoryToLink, removeCategoryFromLink,
  type GroupKind, type GroupRow, type LinkedItem, type SearchItem, type ItemDetails, type Category,
} from "@/app/(app)/ibs/grupos-actions";
import { getNcmChainsForCodes, type NcmNode } from "@/app/(app)/ibs/actions";
import { exportGroupPdf } from "@/lib/groupPdf";

const ROOT = "__root__";

/** Exibição — não altera o dado salvo. Formata só quando há os 8 dígitos padrão. */
function formatNcm(raw: string): string {
  const d = raw.replace(/\D/g, "");
  return d.length === 8 ? `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}` : raw;
}

function itemLabel(kind: GroupKind, it: { code: string; descr: string }): string {
  const code = kind === "produto" ? formatNcm(it.code) : it.code;
  return `${kind === "servico" ? "NBS " : ""}${code} — ${it.descr}`;
}

export function GroupsPanel({
  kind, initialGroups, initialCategories, canCreate, canDelete, cclassDescr, linksByCst,
}: {
  kind: GroupKind; initialGroups: GroupRow[]; initialCategories: Category[]; canCreate: boolean; canDelete: boolean;
  cclassDescr: Record<string, string>; linksByCst: Record<string, { code: string; descr: string }[]>;
}) {
  const [groups, setGroups] = useState(initialGroups);
  const [categories, setCategories] = useState(initialCategories);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const childrenOf = useMemo(() => {
    const map = new Map<string, GroupRow[]>();
    for (const g of groups) {
      const key = g.parent_id ?? ROOT;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(g);
    }
    for (const list of map.values()) list.sort((a, b) => a.position - b.position);
    return map;
  }, [groups]);

  const selected = groups.find((g) => g.id === selectedId) ?? null;

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreate(parentId: string | null, name: string) {
    const res = await createGroup(kind, parentId, name);
    if (res.group) {
      setGroups((g) => [...g, res.group!]);
      if (parentId) setExpanded((prev) => new Set(prev).add(parentId));
    }
    return res.error;
  }

  async function handleRename(id: string, name: string) {
    const res = await renameGroup(id, name);
    if (!res.error) setGroups((g) => g.map((x) => (x.id === id ? { ...x, name: name.trim() } : x)));
    return res.error;
  }

  async function handleDelete(id: string) {
    const res = await deleteGroup(id);
    if (!res.error) {
      const toRemove = new Set([id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const g of groups) {
          if (g.parent_id && toRemove.has(g.parent_id) && !toRemove.has(g.id)) {
            toRemove.add(g.id);
            changed = true;
          }
        }
      }
      setGroups((g) => g.filter((x) => !toRemove.has(x.id)));
      setSelectedId((cur) => (cur && toRemove.has(cur) ? null : cur));
    }
    return res.error;
  }

  async function handleCreateCategory(name: string, color: string) {
    const res = await createCategory(kind, name, color);
    if (res.category) setCategories((c) => [...c, res.category!]);
    return res.error;
  }

  async function handleRenameCategory(id: string, name: string) {
    const res = await renameCategory(id, name);
    if (!res.error) setCategories((c) => c.map((x) => (x.id === id ? { ...x, name: name.trim() } : x)));
    return res.error;
  }

  function handleRecolorCategory(id: string, color: string) {
    setCategories((c) => c.map((x) => (x.id === id ? { ...x, color } : x)));
    updateCategoryColor(id, color);
  }

  function handleDeleteCategory(id: string) {
    setCategories((c) => c.filter((x) => x.id !== id));
    deleteCategory(id);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start" }}>
      <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, padding: 12 }}>
        <TreeToolbar canCreate={canCreate} onCreate={(name) => handleCreate(null, name)} />
        <button
          type="button"
          onClick={() => setCategoriesModalOpen(true)}
          className="hv-light"
          style={{ width: "100%", marginTop: 8, fontSize: 12, fontWeight: 600, color: "#4b4e58", background: "#fff", border: "1px solid #e2e2de", borderRadius: 8, padding: "7px 12px", cursor: "pointer" }}
        >
          Categorias{categories.length ? ` (${categories.length})` : ""}
        </button>
        {categoriesModalOpen ? (
          <CategoriesModal
            kind={kind}
            categories={categories}
            canManage={canCreate}
            onClose={() => setCategoriesModalOpen(false)}
            onCreate={handleCreateCategory}
            onRename={handleRenameCategory}
            onRecolor={handleRecolorCategory}
            onDelete={handleDeleteCategory}
          />
        ) : null}
        <div style={{ marginTop: 8 }}>
          {(childrenOf.get(ROOT) ?? []).map((g) => (
            <GroupNode
              key={g.id}
              node={g}
              depth={0}
              childrenOf={childrenOf}
              expanded={expanded}
              onToggle={toggle}
              selectedId={selectedId}
              onSelect={setSelectedId}
              canCreate={canCreate}
              canDelete={canDelete}
              onCreateChild={handleCreate}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          ))}
          {groups.length === 0 ? (
            <div style={{ padding: 14, fontSize: 12, color: "#a0a3ad", fontStyle: "italic" }}>Nenhum grupo criado ainda.</div>
          ) : null}
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, padding: 18, minHeight: 300 }}>
        {selected ? (
          <GroupDetail
            key={selected.id}
            kind={kind}
            group={selected}
            canCreate={canCreate}
            canDelete={canDelete}
            categories={categories}
            cclassDescr={cclassDescr}
            linksByCst={linksByCst}
            onNotesChange={(notes) => setGroups((g) => g.map((x) => (x.id === selected.id ? { ...x, notes } : x)))}
          />
        ) : (
          <div style={{ fontSize: 12.5, color: "#a0a3ad", fontStyle: "italic" }}>
            Selecione ou crie um grupo para ver os detalhes e as tributações vinculadas.
          </div>
        )}
      </div>
    </div>
  );
}

function TreeToolbar({ canCreate, onCreate }: { canCreate: boolean; onCreate: (name: string) => Promise<string | undefined> }) {
  const [adding, setAdding] = useState(false);
  if (!canCreate) {
    return <div style={{ fontSize: 11, fontWeight: 700, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".05em" }}>Grupos</div>;
  }
  return adding ? (
    <InlineNameForm
      placeholder="Nome do grupo…"
      onCancel={() => setAdding(false)}
      onSubmit={async (name) => {
        const err = await onCreate(name);
        if (!err) setAdding(false);
        return err;
      }}
    />
  ) : (
    <button
      type="button"
      onClick={() => setAdding(true)}
      className="hv-btn"
      style={{ width: "100%", fontSize: 12, fontWeight: 600, color: "#fff", background: ACCENT, border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}
    >
      + Novo grupo
    </button>
  );
}

function InlineNameForm({
  initial = "", placeholder, onCancel, onSubmit,
}: {
  initial?: string; placeholder?: string; onCancel: () => void; onSubmit: (name: string) => Promise<string | undefined>;
}) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const err = await onSubmit(value);
    setBusy(false);
    setError(err);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          autoFocus
          className="fc"
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") onCancel();
          }}
          style={{ flex: 1, fontSize: 12, padding: "6px 8px", borderRadius: 6, border: "1px solid #e2e2de", outline: "none" }}
        />
        {busy ? (
          <Spinner size={11} />
        ) : (
          <>
            <button type="button" onClick={submit} className="hv-light" style={{ fontSize: 12, fontWeight: 700, color: ACCENT, background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}>✓</button>
            <button type="button" onClick={onCancel} className="hv-light" style={{ fontSize: 12, color: "#a0a3ad", background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}>✕</button>
          </>
        )}
      </div>
      {error ? <div style={{ fontSize: 10.5, color: "#b3402e" }}>{error}</div> : null}
    </div>
  );
}

function GroupNode({
  node, depth, childrenOf, expanded, onToggle, selectedId, onSelect, canCreate, canDelete, onCreateChild, onRename, onDelete,
}: {
  node: GroupRow;
  depth: number;
  childrenOf: Map<string, GroupRow[]>;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  canCreate: boolean;
  canDelete: boolean;
  onCreateChild: (parentId: string, name: string) => Promise<string | undefined>;
  onRename: (id: string, name: string) => Promise<string | undefined>;
  onDelete: (id: string) => Promise<string | undefined>;
}) {
  const kids = childrenOf.get(node.id) ?? [];
  const isOpen = expanded.has(node.id);
  const isSelected = selectedId === node.id;
  const [renaming, setRenaming] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <div>
      <div
        className="hv-row"
        onClick={() => onSelect(node.id)}
        style={{
          display: "flex", alignItems: "center", gap: 2, padding: "6px 6px", paddingLeft: 6 + depth * 16,
          borderRadius: 8, background: isSelected ? "#f7f8ff" : undefined, cursor: "pointer",
        }}
      >
        <span
          onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
          style={{ width: 14, textAlign: "center", color: "#a0a3ad", fontSize: 10, visibility: kids.length ? "visible" : "hidden" }}
        >
          {isOpen ? "▾" : "▸"}
        </span>
        {renaming ? (
          <InlineNameForm
            initial={node.name}
            onCancel={() => setRenaming(false)}
            onSubmit={async (name) => {
              setBusy(true);
              const err = await onRename(node.id, name);
              setBusy(false);
              if (!err) setRenaming(false);
              return err;
            }}
          />
        ) : (
          <div
            onDoubleClick={(e) => { e.stopPropagation(); if (canCreate) setRenaming(true); }}
            title="Duplo clique para renomear"
            style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: isSelected ? 700 : 500, color: isSelected ? ACCENT : "#33363f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {node.name}
          </div>
        )}
        {!renaming && canCreate ? (
          <button
            type="button"
            title="Novo subgrupo"
            onClick={(e) => { e.stopPropagation(); if (!isOpen) onToggle(node.id); setAddingChild(true); }}
            className="hv-light"
            style={{ background: "none", border: "none", color: "#a0a3ad", cursor: "pointer", fontSize: 14, padding: "0 4px", lineHeight: 1 }}
          >
            +
          </button>
        ) : null}
        {!renaming && canDelete ? (
          <button
            type="button"
            title="Excluir grupo"
            onClick={async (e) => {
              e.stopPropagation();
              if (!window.confirm(`Excluir o grupo "${node.name}" e todos os subgrupos e vínculos dentro dele?`)) return;
              setBusy(true);
              await onDelete(node.id);
              setBusy(false);
            }}
            className="hv-danger"
            style={{ background: "none", border: "none", color: "#c2c3c9", cursor: "pointer", fontSize: 12, padding: "0 4px", lineHeight: 1 }}
          >
            ✕
          </button>
        ) : null}
        {busy ? <Spinner size={11} /> : null}
      </div>
      {addingChild ? (
        <div style={{ paddingLeft: 6 + (depth + 1) * 16, padding: "2px 6px 4px" }}>
          <InlineNameForm
            placeholder="Nome do subgrupo…"
            onCancel={() => setAddingChild(false)}
            onSubmit={async (name) => {
              const err = await onCreateChild(node.id, name);
              if (!err) setAddingChild(false);
              return err;
            }}
          />
        </div>
      ) : null}
      {isOpen
        ? kids.map((child) => (
            <GroupNode
              key={child.id}
              node={child}
              depth={depth + 1}
              childrenOf={childrenOf}
              expanded={expanded}
              onToggle={onToggle}
              selectedId={selectedId}
              onSelect={onSelect}
              canCreate={canCreate}
              canDelete={canDelete}
              onCreateChild={onCreateChild}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))
        : null}
    </div>
  );
}

function GroupDetail({
  kind, group, canCreate, canDelete, categories, cclassDescr, linksByCst, onNotesChange,
}: {
  kind: GroupKind; group: GroupRow; canCreate: boolean; canDelete: boolean; categories: Category[];
  cclassDescr: Record<string, string>; linksByCst: Record<string, { code: string; descr: string }[]>;
  onNotesChange: (notes: string) => void;
}) {
  const [notes, setNotes] = useState(group.notes ?? "");
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [items, setItems] = useState<LinkedItem[] | null>(null);
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [ncmChains, setNcmChains] = useState<Record<string, NcmNode[]>>({});

  useEffect(() => {
    listGroupItems(kind, group.id).then((r) => {
      setItems(r);
      setLinkedIds(new Set(r.map((x) => x.itemId)));
    });
  }, [kind, group.id]);

  // Árvore de NCM (capítulo → posição → subposição → item) de cada tributação vinculada.
  useEffect(() => {
    if (kind !== "produto" || !items || !items.length) {
      setNcmChains({});
      return;
    }
    let alive = true;
    getNcmChainsForCodes(items.map((it) => it.code)).then((m) => {
      if (alive) setNcmChains(m);
    });
    return () => {
      alive = false;
    };
  }, [kind, items]);

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      searchItemsToLink(kind, term).then((r) => {
        setResults(r);
        setSearching(false);
      });
    }, 250);
    return () => clearTimeout(t);
  }, [q, kind]);

  function handleNotesChange(value: string) {
    setNotes(value);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => {
      updateGroupNotes(group.id, value);
      onNotesChange(value);
    }, 600);
  }

  async function handleLink(itemId: string) {
    const res = await linkItem(kind, group.id, itemId);
    if (!res.error) {
      const refreshed = await listGroupItems(kind, group.id);
      setItems(refreshed);
      setLinkedIds(new Set(refreshed.map((x) => x.itemId)));
      // Mantém a busca e os resultados visíveis — o item vinculado passa a
      // aparecer como "Já vinculado" na própria lista, sem precisar buscar de
      // novo. Só o "✕" do campo de busca (TableSearch) limpa a lista.
    }
  }

  async function handleUnlink(linkId: string) {
    const removed = items?.find((x) => x.linkId === linkId);
    const res = await unlinkItem(kind, linkId);
    if (!res.error) {
      setItems((prev) => (prev ?? []).filter((x) => x.linkId !== linkId));
      if (removed) setLinkedIds((prev) => { const next = new Set(prev); next.delete(removed.itemId); return next; });
    }
  }

  async function handleExportPdf() {
    setExporting(true);
    try {
      const data = await getGroupExportData(kind, group.id);
      await exportGroupPdf(data);
    } finally {
      setExporting(false);
    }
  }

  function handleAddCategory(linkId: string, category: Category) {
    setItems((prev) => (prev ?? []).map((x) => (x.linkId === linkId ? { ...x, categories: [...x.categories, category] } : x)));
    addCategoryToLink(kind, linkId, category.id);
  }

  function handleRemoveCategory(linkId: string, categoryId: string) {
    setItems((prev) => (prev ?? []).map((x) => (x.linkId === linkId ? { ...x, categories: x.categories.filter((c) => c.id !== categoryId) } : x)));
    removeCategoryFromLink(kind, linkId, categoryId);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{group.name}</div>
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={exporting}
          className="hv-light"
          style={{
            display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#4b4e58",
            background: "#fff", border: "1px solid #e2e2de", borderRadius: 8, padding: "7px 12px",
            cursor: exporting ? "default" : "pointer", opacity: exporting ? 0.7 : 1,
          }}
        >
          {exporting ? (
            <Spinner size={12} />
          ) : (
            <svg width="13" height="13" viewBox="0 0 15 15">
              <path d="M7.5 1.5v8m0 0L4.5 6.5m3 3l3-3M2 11.5v1.5a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-1.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {exporting ? "Gerando…" : "Exportar PDF"}
        </button>
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Observações</div>
        <textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          disabled={!canCreate}
          placeholder="Anotações sobre este grupo…"
          rows={3}
          style={{ width: "100%", fontSize: 12.5, padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e2de", outline: "none", resize: "vertical", fontFamily: "inherit" }}
        />
      </div>

      {canCreate ? (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>
            Adicionar tributação {kind === "produto" ? "(NCM)" : "(NBS)"}
          </div>
          <TableSearch value={q} onChange={setQ} placeholder={kind === "produto" ? "Pesquisar NCM ou descrição…" : "Pesquisar NBS ou descrição…"} />
          {q.trim() ? (
            <div style={{ marginTop: 6, background: "#fafaf8", border: "1px solid #e7e7e3", borderRadius: 8, maxHeight: 220, overflow: "auto" }}>
              {searching ? (
                <div style={{ padding: 10, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#8a8d98" }}>
                  <Spinner size={11} /> Buscando…
                </div>
              ) : results.length === 0 ? (
                <div style={{ padding: 10, fontSize: 12, color: "#a0a3ad", fontStyle: "italic" }}>Nada encontrado.</div>
              ) : (
                results.map((r) => (
                  <div key={r.itemId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderBottom: "1px solid #f0f0ed" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#33363f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{itemLabel(kind, r)}</div>
                      <div style={{ fontSize: 11, color: "#8a8d98" }}>{detailsLine(r)}</div>
                    </div>
                    {linkedIds.has(r.itemId) ? (
                      <div style={{ fontSize: 11, color: "#0e7a6f", fontWeight: 600 }}>Já vinculado</div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleLink(r.itemId)}
                        className="hv-light"
                        style={{ fontSize: 11.5, fontWeight: 700, color: ACCENT, background: "none", border: `1px solid ${ACCENT}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}
                      >
                        + Adicionar
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>
          Tributações vinculadas {items ? `(${items.length})` : ""}
        </div>
        {items === null ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#8a8d98", padding: 10 }}>
            <Spinner size={11} /> Carregando…
          </div>
        ) : items.length === 0 ? (
          <div style={{ fontSize: 12, color: "#a0a3ad", fontStyle: "italic", padding: 10 }}>Nenhuma tributação vinculada a este grupo ainda.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((it) => (
              <LinkedItemRow
                key={it.linkId}
                item={it}
                canDelete={canDelete}
                canCreate={canCreate}
                kind={kind}
                chain={kind === "produto" ? ncmChains[it.code] : undefined}
                allCategories={categories}
                cclassDescr={cclassDescr}
                linksByCst={linksByCst}
                onUnlink={() => handleUnlink(it.linkId)}
                onAddCategory={(cat) => handleAddCategory(it.linkId, cat)}
                onRemoveCategory={(catId) => handleRemoveCategory(it.linkId, catId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Compacto, usado na lista de resultados de busca (antes de vincular). */
function detailsLine(it: ItemDetails): string {
  const parts = [`CST ${it.cst || "—"}`, `cClassTrib ${it.cclass || "—"}`];
  if (it.aliqIbs || it.aliqCbs) parts.push(`Alíq. IBS ${it.aliqIbs || "—"}`, `Alíq. CBS ${it.aliqCbs || "—"}`);
  parts.push(`Red. IBS ${it.redIbs || "—"}`, `Red. CBS ${it.redCbs || "—"}`);
  return parts.join(" · ");
}

function Chip({ label, value, color }: { label: string; value: string; color?: string }) {
  if (!value) return null;
  return (
    <div style={{ fontSize: 10.5, background: "#f5f5f3", borderRadius: 6, padding: "3px 8px", display: "flex", gap: 4, alignItems: "baseline" }}>
      <span style={{ color: "#8a8d98", fontWeight: 600 }}>{label}</span>
      <span style={{ fontFamily: "var(--font-jetbrains)", fontWeight: 700, color: color || "#33363f" }}>{value}</span>
    </div>
  );
}

function LinkedItemRow({
  item, canDelete, canCreate, kind, chain, allCategories, cclassDescr, linksByCst, onUnlink, onAddCategory, onRemoveCategory,
}: {
  item: LinkedItem; canDelete: boolean; canCreate: boolean; kind: GroupKind; chain?: NcmNode[];
  allCategories: Category[]; cclassDescr: Record<string, string>; linksByCst: Record<string, { code: string; descr: string }[]>;
  onUnlink: () => void; onAddCategory: (category: Category) => void; onRemoveCategory: (categoryId: string) => void;
}) {
  const [notes, setNotes] = useState(item.notes ?? "");
  return (
    <div style={{ background: "#fafaf8", border: "1px solid #e7e7e3", borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#33363f", flex: 1, minWidth: 0 }}>{itemLabel(kind, item)}</div>
        {canDelete ? (
          <button type="button" title="Remover do grupo" onClick={onUnlink} className="hv-danger" style={{ color: "#c2c3c9", cursor: "pointer", padding: 2, background: "none", border: "none" }}>
            <svg width="14" height="14" viewBox="0 0 15 15">
              <path d="M2 3.5h11M6 3.5V2h3v1.5M3.5 3.5l.7 9.5h6.6l.7-9.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {item.cst ? (
          <CstLinksInfo cst={item.cst} links={linksByCst[item.cst] ?? []}>
            <Chip label="CST" value={item.cst} color={ACCENT} />
          </CstLinksInfo>
        ) : null}
        {item.cclass ? (
          <CclassInfo code={item.cclass} descr={cclassDescr[item.cclass] || ""}>
            <Chip label="cClassTrib" value={item.cclass} color="#7c3aed" />
          </CclassInfo>
        ) : null}
        <Chip label="Alíq. IBS" value={item.aliqIbs} />
        <Chip label="Alíq. CBS" value={item.aliqCbs} />
        <Chip label="Red. IBS" value={item.redIbs} color="#0e7a6f" />
        <Chip label="Red. CBS" value={item.redCbs} color="#0e7a6f" />
      </div>

      <CategoryChips
        assigned={item.categories}
        allCategories={allCategories}
        canEdit={canCreate}
        onAdd={onAddCategory}
        onRemove={onRemoveCategory}
      />

      {chain?.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 5 }}>
          {chain.map((node, j) => (
            <span key={node.digits} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {j > 0 ? <span style={{ color: "#c7c9d1", fontSize: 11 }}>›</span> : null}
              <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 11, fontWeight: 700, color: j === chain.length - 1 ? ACCENT : "#8a8d98" }}>
                {node.code}
              </span>
              <span style={{ fontSize: 11, color: "#6b6e78" }}>{node.descr}</span>
            </span>
          ))}
        </div>
      ) : null}

      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => { if (notes !== (item.notes ?? "")) updateLinkNotes(kind, item.linkId, notes); }}
        placeholder="Observação sobre esta tributação neste grupo…"
        style={{ width: "100%", fontSize: 11.5, padding: "6px 9px", borderRadius: 6, border: "1px solid #e2e2de", outline: "none", background: "#fff" }}
      />
    </div>
  );
}

/** Categorias marcadas + botão para marcar mais uma, direto no card da tributação vinculada. */
function CategoryChips({
  assigned, allCategories, canEdit, onAdd, onRemove,
}: {
  assigned: Category[]; allCategories: Category[]; canEdit: boolean;
  onAdd: (category: Category) => void; onRemove: (categoryId: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const available = allCategories.filter((c) => !assigned.some((a) => a.id === c.id));

  if (!canEdit && !assigned.length) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
      {assigned.map((c) => (
        <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, fontWeight: 600, padding: "3px 8px", borderRadius: 99, background: `${c.color}1f`, color: c.color }}>
          <span style={{ width: 7, height: 7, borderRadius: 99, background: c.color, flex: "none" }} />
          {c.name}
          {canEdit ? (
            <span onClick={() => onRemove(c.id)} title="Remover categoria" style={{ cursor: "pointer", marginLeft: 1, lineHeight: 1 }}>✕</span>
          ) : null}
        </div>
      ))}
      {canEdit ? (
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="hv-light"
            style={{ fontSize: 10.5, fontWeight: 600, color: "#8a8d98", background: "#fff", border: "1px dashed #d5d5d0", borderRadius: 99, padding: "3px 8px", cursor: "pointer" }}
          >
            + Categoria
          </button>
          {pickerOpen ? (
            <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, background: "#fff", border: "1px solid #e7e7e3", borderRadius: 8, boxShadow: "0 8px 24px rgba(20,20,30,.12)", zIndex: 5, minWidth: 170, maxHeight: 220, overflow: "auto", padding: 6 }}>
              {available.length === 0 ? (
                <div style={{ fontSize: 11.5, color: "#a0a3ad", fontStyle: "italic", padding: "5px 8px" }}>
                  {allCategories.length === 0 ? "Nenhuma categoria criada ainda." : "Todas já marcadas."}
                </div>
              ) : (
                available.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => { onAdd(c); setPickerOpen(false); }}
                    className="hv-row"
                    style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "5px 8px", borderRadius: 6, cursor: "pointer" }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: 99, background: c.color, flex: "none" }} />
                    {c.name}
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CategoriesModal({
  kind, categories, canManage, onClose, onCreate, onRename, onRecolor, onDelete,
}: {
  kind: GroupKind; categories: Category[]; canManage: boolean; onClose: () => void;
  onCreate: (name: string, color: string) => Promise<string | undefined>;
  onRename: (id: string, name: string) => Promise<string | undefined>;
  onRecolor: (id: string, color: string) => void;
  onDelete: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [adding, setAdding] = useState(false);

  if (!mounted) return null;

  return createPortal(
    <>
      <div onClick={onClose} className="overlay-in" style={{ position: "fixed", inset: 0, background: "rgba(20,20,30,.45)", zIndex: 60 }} />
      <div
        role="dialog"
        className="modal-in"
        style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: 420, maxWidth: "94vw", maxHeight: "80vh", overflow: "auto",
          background: "#fff", borderRadius: 16, zIndex: 70, padding: "24px 26px",
          boxShadow: "0 24px 80px rgba(20,20,30,.3)", cursor: "default",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Categorias de {kind === "produto" ? "produtos" : "serviços"}</div>
          <div onClick={onClose} className="hv-gray" style={{ marginLeft: "auto", fontSize: 16, color: "#8a8d98", cursor: "pointer", padding: 4, lineHeight: 1 }}>✕</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {categories.map((c) => (
            <CategoryManageRow key={c.id} category={c} canManage={canManage} onRename={onRename} onRecolor={onRecolor} onDelete={onDelete} />
          ))}
          {categories.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "#a0a3ad", fontStyle: "italic" }}>Nenhuma categoria criada ainda.</div>
          ) : null}
        </div>

        {canManage ? (
          adding ? (
            <NewCategoryForm
              onCancel={() => setAdding(false)}
              onSubmit={async (name, color) => {
                const err = await onCreate(name, color);
                if (!err) setAdding(false);
                return err;
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="hv-btn"
              style={{ width: "100%", fontSize: 12, fontWeight: 600, color: "#fff", background: ACCENT, border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}
            >
              + Nova categoria
            </button>
          )
        ) : null}
      </div>
    </>,
    document.body,
  );
}

function CategoryManageRow({
  category, canManage, onRename, onRecolor, onDelete,
}: {
  category: Category; canManage: boolean;
  onRename: (id: string, name: string) => Promise<string | undefined>;
  onRecolor: (id: string, color: string) => void;
  onDelete: (id: string) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [pickingColor, setPickingColor] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "6px 8px", borderRadius: 8, background: "#fafaf8" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          onClick={() => canManage && setPickingColor((v) => !v)}
          title="Cor da categoria"
          style={{ width: 14, height: 14, borderRadius: 99, background: category.color, border: "none", cursor: canManage ? "pointer" : "default", flex: "none", padding: 0 }}
        />
        {renaming ? (
          <InlineNameForm
            initial={category.name}
            onCancel={() => setRenaming(false)}
            onSubmit={async (name) => {
              const err = await onRename(category.id, name);
              if (!err) setRenaming(false);
              return err;
            }}
          />
        ) : (
          <div
            onDoubleClick={() => canManage && setRenaming(true)}
            title={canManage ? "Duplo clique para renomear" : undefined}
            style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, color: "#33363f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {category.name}
          </div>
        )}
        {canManage && !renaming ? (
          <button
            type="button"
            onClick={() => { if (window.confirm(`Excluir a categoria "${category.name}"? Ela será removida de todas as tributações que a usam.`)) onDelete(category.id); }}
            className="hv-danger"
            style={{ background: "none", border: "none", color: "#c2c3c9", cursor: "pointer", padding: 2, flex: "none" }}
          >
            <svg width="13" height="13" viewBox="0 0 15 15">
              <path d="M2 3.5h11M6 3.5V2h3v1.5M3.5 3.5l.7 9.5h6.6l.7-9.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}
      </div>
      {pickingColor ? (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { onRecolor(category.id, c); setPickingColor(false); }}
              style={{ width: 18, height: 18, borderRadius: 99, background: c, border: c === category.color ? "2px solid #33363f" : "1px solid #e2e2de", cursor: "pointer", padding: 0 }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function NewCategoryForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (name: string, color: string) => Promise<string | undefined> }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    const err = await onSubmit(name, color);
    setBusy(false);
    setError(err);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <input
        autoFocus
        className="fc"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome da categoria…"
        style={{ fontSize: 12.5, padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e2de", outline: "none" }}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            style={{ width: 20, height: 20, borderRadius: 99, background: c, border: c === color ? "2px solid #33363f" : "1px solid #e2e2de", cursor: "pointer", padding: 0 }}
          />
        ))}
      </div>
      {error ? <div style={{ fontSize: 10.5, color: "#b3402e" }}>{error}</div> : null}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="hv-btn"
          style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#fff", background: ACCENT, border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", opacity: busy ? 0.7 : 1 }}
        >
          {busy ? "Criando…" : "Criar"}
        </button>
        <button type="button" onClick={onCancel} className="hv-light" style={{ fontSize: 12, color: "#8a8d98", background: "#fff", border: "1px solid #e2e2de", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
