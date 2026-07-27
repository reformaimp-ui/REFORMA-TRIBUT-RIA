"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ACCENT } from "@/lib/design";
import { TableSearch } from "@/components/app/TableSearch";
import { Spinner } from "@/components/app/Spinner";
import {
  createGroup, renameGroup, updateGroupNotes, deleteGroup,
  listGroupItems, searchItemsToLink, linkItem, unlinkItem, updateLinkNotes,
  type GroupKind, type GroupRow, type LinkedItem, type SearchItem,
} from "@/app/(app)/ibs/grupos-actions";

const ROOT = "__root__";

export function GroupsPanel({
  kind, initialGroups, canCreate, canDelete,
}: {
  kind: GroupKind; initialGroups: GroupRow[]; canCreate: boolean; canDelete: boolean;
}) {
  const [groups, setGroups] = useState(initialGroups);
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

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start" }}>
      <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, padding: 12 }}>
        <TreeToolbar canCreate={canCreate} onCreate={(name) => handleCreate(null, name)} />
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
  kind, group, canCreate, canDelete, onNotesChange,
}: {
  kind: GroupKind; group: GroupRow; canCreate: boolean; canDelete: boolean; onNotesChange: (notes: string) => void;
}) {
  const [notes, setNotes] = useState(group.notes ?? "");
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [items, setItems] = useState<LinkedItem[] | null>(null);
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    listGroupItems(kind, group.id).then((r) => {
      setItems(r);
      setLinkedIds(new Set(r.map((x) => x.itemId)));
    });
  }, [kind, group.id]);

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
      setQ("");
      setResults([]);
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ fontSize: 15, fontWeight: 700 }}>{group.name}</div>

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
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#33363f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</div>
                      <div style={{ fontSize: 11, color: "#8a8d98" }}>{r.sub}</div>
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
          <div style={{ border: "1px solid #e7e7e3", borderRadius: 8, overflow: "hidden" }}>
            {items.map((it) => (
              <LinkedItemRow key={it.linkId} item={it} canDelete={canDelete} kind={kind} onUnlink={() => handleUnlink(it.linkId)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LinkedItemRow({
  item, canDelete, kind, onUnlink,
}: {
  item: LinkedItem; canDelete: boolean; kind: GroupKind; onUnlink: () => void;
}) {
  const [notes, setNotes] = useState(item.notes ?? "");
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderBottom: "1px solid #f0f0ed" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#33363f" }}>{item.label}</div>
        <div style={{ fontSize: 11, color: "#8a8d98", marginBottom: 6 }}>{item.sub}</div>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => { if (notes !== (item.notes ?? "")) updateLinkNotes(kind, item.linkId, notes); }}
          placeholder="Observação sobre esta tributação neste grupo…"
          style={{ width: "100%", fontSize: 11.5, padding: "5px 8px", borderRadius: 6, border: "1px solid #e2e2de", outline: "none" }}
        />
      </div>
      {canDelete ? (
        <button type="button" title="Remover do grupo" onClick={onUnlink} className="hv-danger" style={{ color: "#c2c3c9", cursor: "pointer", padding: 4, background: "none", border: "none", marginTop: 2 }}>
          <svg width="14" height="14" viewBox="0 0 15 15">
            <path d="M2 3.5h11M6 3.5V2h3v1.5M3.5 3.5l.7 9.5h6.6l.7-9.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
