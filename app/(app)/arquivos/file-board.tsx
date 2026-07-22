"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { ACCENT } from "@/lib/design";
import { LiveMdEditor } from "@/components/app/LiveMdEditor";
import { mdToHtml } from "@/lib/markdown";
import {
  createFolder,
  createTextDoc,
  deleteDocument,
  getFileUrl,
  renameDocument,
  updateTextDoc,
  uploadFile,
} from "./actions";

export type DocRow = {
  id: string;
  parent_id: string | null;
  kind: "folder" | "text" | "file";
  name: string;
  content: string | null;
  storage_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type Perms = { create: boolean; edit: boolean; delete: boolean };

const BTN: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 8,
  padding: "8px 14px",
  cursor: "pointer",
  border: "none",
};

const EXT_COLORS: Record<string, { bg: string; fg: string }> = {
  PDF: { bg: "#fdecea", fg: "#c0392b" },
  XLS: { bg: "#e8f5ec", fg: "#1f9254" },
  XLSX: { bg: "#e8f5ec", fg: "#1f9254" },
  CSV: { bg: "#e8f5ec", fg: "#1f9254" },
  DOC: { bg: "#eef1ff", fg: ACCENT },
  DOCX: { bg: "#eef1ff", fg: ACCENT },
  PPT: { bg: "#fdf3e6", fg: "#b5750f" },
  PPTX: { bg: "#fdf3e6", fg: "#b5750f" },
  PNG: { bg: "#f1eafe", fg: "#7c3aed" },
  JPG: { bg: "#f1eafe", fg: "#7c3aed" },
  JPEG: { bg: "#f1eafe", fg: "#7c3aed" },
  GIF: { bg: "#f1eafe", fg: "#7c3aed" },
  WEBP: { bg: "#f1eafe", fg: "#7c3aed" },
};
const DEFAULT_EXT_COLOR = { bg: "#f4f4f2", fg: "#6b6e78" };

function extOf(name: string, mime: string | null): string {
  const m = name.match(/\.([a-zA-Z0-9]+)$/);
  if (m) return m[1].toUpperCase();
  if (mime?.includes("pdf")) return "PDF";
  if (mime?.startsWith("image/")) return "IMG";
  return "ARQ";
}

function fmtBytes(n: number | null): string {
  if (!n && n !== 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function FolderIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 20 20">
      <path
        d="M2 5.2A1.7 1.7 0 013.7 3.5h3.6l1.6 2h7.4A1.7 1.7 0 0118 7.2v8.1A1.7 1.7 0 0116.3 17H3.7A1.7 1.7 0 012 15.3z"
        fill="#f0b83c"
      />
    </svg>
  );
}

function TextIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 20 20">
      <path d="M5 2.5h7l4 4v11a1 1 0 01-1 1H5a1 1 0 01-1-1v-14a1 1 0 011-1z" fill="#eef1ff" stroke={ACCENT} strokeWidth="1.2" />
      <path d="M12 2.5v4h4" fill="none" stroke={ACCENT} strokeWidth="1.2" strokeLinejoin="round" />
      <line x1="6.3" y1="11" x2="13.7" y2="11" stroke={ACCENT} strokeWidth="1.1" />
      <line x1="6.3" y1="13.4" x2="13.7" y2="13.4" stroke={ACCENT} strokeWidth="1.1" />
      <line x1="6.3" y1="15.8" x2="11" y2="15.8" stroke={ACCENT} strokeWidth="1.1" />
    </svg>
  );
}

function FileBadge({ ext }: { ext: string }) {
  const c = EXT_COLORS[ext] ?? DEFAULT_EXT_COLOR;
  return (
    <svg width="22" height="22" viewBox="0 0 20 20">
      <path d="M5 2.5h7l4 4v11a1 1 0 01-1 1H5a1 1 0 01-1-1v-14a1 1 0 011-1z" fill={c.bg} stroke={c.fg} strokeWidth="1.1" opacity="0.9" />
      <path d="M12 2.5v4h4" fill="none" stroke={c.fg} strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}

/** Modal simples de texto (nova pasta / renomear). */
function PromptModal({
  title,
  initial,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  initial: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return createPortal(
    <>
      <div onClick={onCancel} className="overlay-in" style={{ position: "fixed", inset: 0, background: "rgba(20,20,30,.45)", zIndex: 60 }} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const v = value.trim();
          if (v) onConfirm(v);
        }}
        role="dialog"
        className="modal-in"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: 380,
          maxWidth: "94vw",
          background: "#fff",
          borderRadius: 14,
          padding: 20,
          zIndex: 61,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
        <input
          className="fc"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          style={{ font: "500 13px inherit", border: "1.5px solid #e2e2de", borderRadius: 9, padding: "8px 12px", outline: "none" }}
        />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={onCancel} className="hv-light" style={{ ...BTN, color: "#4b4e58", background: "#fff", border: "1.5px solid #e2e2de" }}>
            Cancelar
          </button>
          <button type="submit" disabled={!value.trim()} className={value.trim() ? "hv-btn" : undefined} style={{ ...BTN, color: "#fff", background: ACCENT, opacity: value.trim() ? 1 : 0.45 }}>
            {confirmLabel}
          </button>
        </div>
      </form>
    </>,
    document.body,
  );
}

export function FileBoard({ docs, perms }: { docs: DocRow[]; perms: Perms }) {
  const [path, setPath] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [modal, setModal] = useState<null | { kind: "folder" } | { kind: "rename"; id: string; name: string }>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const byId = useMemo(() => Object.fromEntries(docs.map((d) => [d.id, d])), [docs]);
  const currentFolderId = path.length ? path[path.length - 1] : null;
  const open = openId ? byId[openId] ?? null : null;

  const children = useMemo(() => {
    const list = docs.filter((d) => (d.parent_id ?? null) === currentFolderId);
    return list.sort((a, b) => {
      if ((a.kind === "folder") !== (b.kind === "folder")) return a.kind === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name, "pt-BR");
    });
  }, [docs, currentFolderId]);

  const crumbs = path.map((id) => byId[id]).filter(Boolean) as DocRow[];

  const enterFolder = (id: string) => setPath((p) => [...p, id]);
  const goToCrumb = (i: number) => setPath((p) => p.slice(0, i + 1));
  const goRoot = () => setPath([]);

  const openText = (doc: DocRow) => {
    setOpenId(doc.id);
    setDraftTitle(doc.name);
    setDraftContent(doc.content ?? "");
  };

  const saveText = () => {
    if (!open || pending) return;
    const fd = new FormData();
    fd.set("id", open.id);
    fd.set("content", draftContent);
    const fdName = new FormData();
    fdName.set("id", open.id);
    fdName.set("name", draftTitle.trim() || open.name);
    startTransition(async () => {
      await Promise.all([updateTextDoc(fd), renameDocument(fdName)]);
    });
  };

  const openItem = (doc: DocRow) => {
    if (doc.kind === "folder") return enterFolder(doc.id);
    if (doc.kind === "text") return openText(doc);
    startTransition(async () => {
      const url = await getFileUrl(doc.id);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    });
  };

  const removeDoc = (doc: DocRow, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pending) return;
    const label = doc.kind === "folder" ? `a pasta "${doc.name}" e todo o conteúdo dentro dela` : `"${doc.name}"`;
    if (!window.confirm(`Excluir ${label}?`)) return;
    const fd = new FormData();
    fd.set("id", doc.id);
    startTransition(async () => {
      await deleteDocument(fd);
    });
  };

  const handleNewFolder = (name: string) => {
    setModal(null);
    const fd = new FormData();
    fd.set("name", name);
    if (currentFolderId) fd.set("parentId", currentFolderId);
    startTransition(async () => {
      await createFolder(fd);
    });
  };

  const handleRename = (id: string, name: string) => {
    setModal(null);
    const fd = new FormData();
    fd.set("id", id);
    fd.set("name", name);
    startTransition(async () => {
      await renameDocument(fd);
      if (openId === id) setDraftTitle(name);
    });
  };

  const handleNewText = () => {
    const fd = new FormData();
    if (currentFolderId) fd.set("parentId", currentFolderId);
    startTransition(async () => {
      const id = await createTextDoc(fd);
      if (id) {
        setOpenId(id);
        setDraftTitle("Novo arquivo de texto");
        setDraftContent("");
      }
    });
  };

  const handleFiles = (files: FileList | File[]) => {
    setUploadError(null);
    const list = Array.from(files);
    if (!list.length) return;
    startTransition(async () => {
      for (const f of list) {
        const fd = new FormData();
        fd.set("file", f);
        if (currentFolderId) fd.set("parentId", currentFolderId);
        const err = await uploadFile(fd);
        if (err) setUploadError(err);
      }
    });
  };

  const editing = !!open && open.kind === "text";

  if (editing && open) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", minWidth: 0 }} className="animate-fadeup">
        <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 10, padding: "14px 22px", background: "#fff", borderBottom: "1px solid #e7e7e3" }}>
          <button onClick={() => setOpenId(null)} className="hv-light" style={{ ...BTN, flex: "none", color: "#4b4e58", background: "#fff", border: "1.5px solid #e2e2de" }}>
            ← Voltar
          </button>
          <input
            className="fc"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            disabled={!perms.edit}
            placeholder="Título…"
            style={{ flex: 1, font: "700 16px var(--font-instrument)", border: "1.5px solid #e2e2de", borderRadius: 9, padding: "8px 12px", outline: "none" }}
          />
          {perms.edit ? (
            <button onClick={saveText} disabled={pending} className="hv-btn" style={{ ...BTN, color: "#fff", background: ACCENT, opacity: pending ? 0.6 : 1 }}>
              {pending ? "Salvando…" : "Salvar"}
            </button>
          ) : null}
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "18px 26px 40px", maxWidth: 860, width: "100%", margin: "0 auto" }}>
          {perms.edit ? (
            <LiveMdEditor value={draftContent} onChange={setDraftContent} placeholder={"Escreva em markdown…\n\n# Título\n**negrito**, *itálico*\n- item de lista"} />
          ) : (
            <div className="md-preview" style={{ fontSize: 14 }} dangerouslySetInnerHTML={{ __html: mdToHtml(draftContent) }} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}
      onDragOver={(e) => {
        if (!perms.create) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (!perms.create) return;
        if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
      }}
    >
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 8, padding: "16px 22px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#6b6e78", flex: 1, minWidth: 0, overflow: "hidden" }}>
          <span onClick={goRoot} className="hv-light" style={{ cursor: "pointer", fontWeight: crumbs.length ? 500 : 700, color: crumbs.length ? "#6b6e78" : "#1c1e26", padding: "3px 6px", borderRadius: 6 }}>
            Arquivos
          </span>
          {crumbs.map((c, i) => (
            <span key={c.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ color: "#c2c3c9" }}>/</span>
              <span
                onClick={() => goToCrumb(i)}
                className="hv-light"
                style={{ cursor: "pointer", fontWeight: i === crumbs.length - 1 ? 700 : 500, color: i === crumbs.length - 1 ? "#1c1e26" : "#6b6e78", padding: "3px 6px", borderRadius: 6, whiteSpace: "nowrap" }}
              >
                {c.name}
              </span>
            </span>
          ))}
        </div>
        {perms.create ? (
          <>
            <button onClick={() => setModal({ kind: "folder" })} className="hv-light" style={{ ...BTN, color: "#4b4e58", background: "#fff", border: "1.5px solid #e2e2de" }}>
              + Nova pasta
            </button>
            <button onClick={handleNewText} className="hv-light" style={{ ...BTN, color: "#4b4e58", background: "#fff", border: "1.5px solid #e2e2de" }}>
              + Arquivo de texto
            </button>
            <button onClick={() => fileRef.current?.click()} className="hv-btn" style={{ ...BTN, color: "#fff", background: ACCENT }}>
              ⇧ Enviar arquivo
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files?.length) handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </>
        ) : null}
      </div>

      {uploadError ? (
        <div style={{ margin: "10px 22px 0", fontSize: 12, color: "#b3402e", background: "#fdf2f0", border: "1px solid #f0d5d0", borderRadius: 8, padding: "8px 12px" }}>
          {uploadError}
        </div>
      ) : null}

      <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "16px 22px 30px", position: "relative" }}>
        {dragOver ? (
          <div
            style={{
              position: "absolute",
              inset: 12,
              border: `2px dashed ${ACCENT}`,
              borderRadius: 14,
              background: "rgba(238,241,255,.85)",
              display: "grid",
              placeItems: "center",
              fontSize: 13,
              fontWeight: 600,
              color: ACCENT,
              zIndex: 5,
              pointerEvents: "none",
            }}
          >
            Solte para enviar
          </div>
        ) : null}

        <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))", gap: 10 }}>
          {children.map((d) => {
            const ext = d.kind === "file" ? extOf(d.name, d.mime_type) : "";
            return (
              <div
                key={d.id}
                onClick={() => openItem(d)}
                className="hv-card"
                style={{
                  position: "relative",
                  background: "#fff",
                  border: "1px solid #e7e7e3",
                  borderRadius: 12,
                  padding: "14px 12px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  minHeight: 88,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
                  {d.kind === "folder" ? <FolderIcon /> : d.kind === "text" ? <TextIcon /> : <FileBadge ext={ext} />}
                  {(perms.edit || perms.delete) ? (
                    <div style={{ display: "flex", gap: 3 }} onClick={(e) => e.stopPropagation()}>
                      {perms.edit ? (
                        <button
                          onClick={() => setModal({ kind: "rename", id: d.id, name: d.name })}
                          title="Renomear"
                          style={{ border: "none", background: "transparent", color: "#a0a3ad", cursor: "pointer", fontSize: 12, padding: 2 }}
                        >
                          ✎
                        </button>
                      ) : null}
                      {perms.delete ? (
                        <button
                          onClick={(e) => removeDoc(d, e)}
                          title="Excluir"
                          style={{ border: "none", background: "transparent", color: "#c9a3a3", cursor: "pointer", fontSize: 12, padding: 2 }}
                        >
                          ✕
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3, wordBreak: "break-word" }}>{d.name}</div>
                <div style={{ fontSize: 10.5, color: "#8a8d98", marginTop: "auto", fontFamily: "var(--font-jetbrains)" }}>
                  {d.kind === "folder" ? "Pasta" : d.kind === "text" ? `Nota · ${fmtDate(d.updated_at)}` : `${ext} · ${fmtBytes(d.size_bytes)}`}
                </div>
              </div>
            );
          })}
        </div>

        {children.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#a0a3ad", fontStyle: "italic", padding: "6px 4px" }}>
            Pasta vazia. {perms.create ? "Crie uma pasta, uma nota ou envie um arquivo." : ""}
          </div>
        ) : null}
      </div>

      {modal?.kind === "folder" ? (
        <PromptModal title="Nova pasta" initial="" confirmLabel="Criar" onCancel={() => setModal(null)} onConfirm={handleNewFolder} />
      ) : null}
      {modal?.kind === "rename" ? (
        <PromptModal title="Renomear" initial={modal.name} confirmLabel="Salvar" onCancel={() => setModal(null)} onConfirm={(v) => handleRename(modal.id, v)} />
      ) : null}
    </div>
  );
}
