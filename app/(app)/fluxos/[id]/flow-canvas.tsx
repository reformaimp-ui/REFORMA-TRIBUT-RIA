"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ACCENT, NODE_COLORS } from "@/lib/design";
import { ConfirmForm } from "@/components/app/ConfirmForm";
import { addEdge, addNode, deleteEdge, deleteFlow, deleteNode, moveNode, renameFlow, updateNode } from "../actions";

type Node = { key: string; x: number; y: number; title: string; desc: string; color: string };
type Edge = { source: string; target: string };

const NW = 220;
const NH = 78;

function fd(fields: Record<string, string | number>) {
  const f = new FormData();
  Object.entries(fields).forEach(([k, v]) => f.set(k, String(v)));
  return f;
}

export function FlowCanvas({
  flowId,
  name,
  initialNodes,
  initialEdges,
}: {
  flowId: string;
  name: string;
  initialNodes: Node[];
  initialEdges: Edge[];
}) {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [pan, setPan] = useState({ x: 30, y: 40 });
  const [zoom, setZoom] = useState(1);
  const [drag, setDrag] = useState<{ key: string; dx: number; dy: number } | null>(null);
  const [panning, setPanning] = useState<{ sx: number; sy: number } | null>(null);
  const [connect, setConnect] = useState<{ from: string; mx: number; my: number } | null>(null);
  const [selKey, setSelKey] = useState<string | null>(null);

  const pos = Object.fromEntries(nodes.map((n) => [n.key, n]));
  const sel = nodes.find((n) => n.key === selKey) || null;

  const cvPoint = (e: React.MouseEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left - pan.x) / zoom, y: (e.clientY - r.top - pan.y) / zoom };
  };

  const persistMove = (n: Node) => void moveNode(fd({ flowId, nodeKey: n.key, x: Math.round(n.x), y: Math.round(n.y) }));

  const onCanvasDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setPanning({ sx: e.clientX - pan.x, sy: e.clientY - pan.y });
      setSelKey(null);
    }
  };
  const onCanvasMove = (e: React.MouseEvent) => {
    if (drag) {
      const pt = cvPoint(e);
      setNodes((ns) => ns.map((n) => (n.key === drag.key ? { ...n, x: pt.x - drag.dx, y: pt.y - drag.dy } : n)));
    } else if (connect) {
      const pt = cvPoint(e);
      setConnect({ ...connect, mx: pt.x, my: pt.y });
    } else if (panning) {
      setPan({ x: e.clientX - panning.sx, y: e.clientY - panning.sy });
    }
  };
  const onCanvasUp = () => {
    if (drag) {
      const n = nodes.find((x) => x.key === drag.key);
      if (n) persistMove(n);
    }
    setDrag(null);
    setPanning(null);
    setConnect(null);
  };
  const onCanvasDbl = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    const pt = cvPoint(e);
    const key = "n" + Date.now();
    const node: Node = { key, x: pt.x - NW / 2, y: pt.y - NH / 2, title: "Nova etapa", desc: "Descreva esta etapa do fluxo", color: "#5b5f6b" };
    setNodes([...nodes, node]);
    setSelKey(key);
    void addNode(fd({ flowId, nodeKey: key, x: Math.round(node.x), y: Math.round(node.y) }));
  };

  const addNodeBtn = () => {
    const key = "n" + Date.now();
    const node: Node = { key, x: (80 - pan.x) / zoom, y: (80 - pan.y) / zoom, title: "Nova etapa", desc: "Descreva esta etapa do fluxo", color: "#5b5f6b" };
    setNodes([...nodes, node]);
    setSelKey(key);
    void addNode(fd({ flowId, nodeKey: key, x: Math.round(node.x), y: Math.round(node.y) }));
  };

  const makeEdge = (source: string, target: string) => {
    if (source === target || edges.some((e) => e.source === source && e.target === target)) return;
    setEdges([...edges, { source, target }]);
    void addEdge(fd({ flowId, source, target }));
  };
  const removeEdge = (e: Edge) => {
    setEdges((es) => es.filter((x) => !(x.source === e.source && x.target === e.target)));
    void deleteEdge(fd({ flowId, source: e.source, target: e.target }));
  };
  const removeNode = (key: string) => {
    if (!window.confirm("Excluir esta etapa e suas conexões?")) return;
    setNodes((ns) => ns.filter((n) => n.key !== key));
    setEdges((es) => es.filter((e) => e.source !== key && e.target !== key));
    setSelKey(null);
    void deleteNode(fd({ flowId, nodeKey: key }));
  };
  const editNode = (key: string, patch: Partial<Node>) => {
    const next = nodes.map((n) => (n.key === key ? { ...n, ...patch } : n));
    setNodes(next);
    const n = next.find((x) => x.key === key)!;
    void updateNode(fd({ flowId, nodeKey: key, title: n.title, descr: n.desc, color: n.color }));
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 10, padding: "10px 22px", background: "#fff", borderBottom: "1px solid #e7e7e3" }}>
        <button onClick={() => router.push("/fluxos")} className="hv-light" style={{ width: 28, height: 28, flex: "none", borderRadius: 8, display: "grid", placeItems: "center", cursor: "pointer", color: "#4b4e58", background: "none", border: "none" }}>
          <svg width="15" height="15" viewBox="0 0 16 16"><path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <input
          defaultValue={name}
          onBlur={(e) => void renameFlow(fd({ id: flowId, name: e.target.value }))}
          className="fc hv-inbdr"
          style={{ width: 320, flex: "none", fontSize: 12.5, fontWeight: 700, border: "1px solid transparent", borderRadius: 6, padding: "5px 7px", outline: "none" }}
        />
        <button onClick={addNodeBtn} className="hv-btn" style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: ACCENT, borderRadius: 8, padding: "6px 12px", border: "none", cursor: "pointer" }}>+ Nó</button>
        <div style={{ display: "flex", gap: 4 }}>
          <div onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.15).toFixed(2)))} className="hv-light" style={{ width: 26, height: 26, border: "1px solid #e2e2de", borderRadius: 7, display: "grid", placeItems: "center", cursor: "pointer", color: "#6b6e78" }}>−</div>
          <div onClick={() => { setZoom(1); setPan({ x: 30, y: 40 }); }} className="hv-light" style={{ height: 26, padding: "0 8px", border: "1px solid #e2e2de", borderRadius: 7, display: "grid", placeItems: "center", cursor: "pointer", fontSize: 11, color: "#6b6e78", fontFamily: "var(--font-jetbrains)" }}>{Math.round(zoom * 100)}%</div>
          <div onClick={() => setZoom((z) => Math.min(2, +(z + 0.15).toFixed(2)))} className="hv-light" style={{ width: 26, height: 26, border: "1px solid #e2e2de", borderRadius: 7, display: "grid", placeItems: "center", cursor: "pointer", color: "#6b6e78" }}>+</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 11.5, color: "#8a8d98" }}>Arraste nós · puxe do ponto <span style={{ color: ACCENT, fontWeight: 700 }}>●</span> para conectar · 2× clique cria nó · clique na linha remove</div>
        <ConfirmForm action={deleteFlow} message={`Excluir o fluxo "${name}"? Isso remove todas as etapas e conexões.`}>
          <input type="hidden" name="id" value={flowId} />
          <button type="submit" title="Excluir fluxo" className="hv-danger" style={{ color: "#c2c3c9", cursor: "pointer", padding: 4, background: "none", border: "none" }}>
            <svg width="15" height="15" viewBox="0 0 15 15"><path d="M2 3.5h11M6 3.5V2h3v1.5M3.5 3.5l.7 9.5h6.6l.7-9.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </ConfirmForm>
      </div>

      <div
        ref={canvasRef}
        onMouseDown={onCanvasDown}
        onMouseMove={onCanvasMove}
        onMouseUp={onCanvasUp}
        onMouseLeave={onCanvasUp}
        onDoubleClick={onCanvasDbl}
        style={{ flex: 1, position: "relative", overflow: "hidden", background: "#f7f7f4", backgroundImage: "radial-gradient(#dcdcd7 1.1px, transparent 1.1px)", backgroundSize: "22px 22px", cursor: panning ? "grabbing" : "default" }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}>
          <svg width="1" height="1" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            {edges.map((e, i) => {
              const A = pos[e.source], B = pos[e.target];
              if (!A || !B) return null;
              const fx = A.x + NW, fy = A.y + NH / 2, tx = B.x, ty = B.y + NH / 2;
              return <path key={i} d={`M ${fx} ${fy} C ${fx + 60} ${fy}, ${tx - 60} ${ty}, ${tx} ${ty}`} fill="none" stroke="#b9bcc8" strokeWidth="2" className="edge" onClick={() => removeEdge(e)} />;
            })}
            {connect && pos[connect.from] ? (
              (() => {
                const A = pos[connect.from];
                const fx = A.x + NW, fy = A.y + NH / 2;
                return <path d={`M ${fx} ${fy} C ${fx + 50} ${fy}, ${connect.mx - 50} ${connect.my}, ${connect.mx} ${connect.my}`} fill="none" stroke={ACCENT} strokeWidth="2" strokeDasharray="5 4" />;
              })()
            ) : null}
          </svg>
          {nodes.map((n) => (
            <div
              key={n.key}
              onMouseDown={(e) => { e.stopPropagation(); const pt = cvPoint(e); setDrag({ key: n.key, dx: pt.x - n.x, dy: pt.y - n.y }); setSelKey(n.key); }}
              onMouseUp={(e) => { if (connect && connect.from !== n.key) { e.stopPropagation(); makeEdge(connect.from, n.key); setConnect(null); } }}
              style={{ position: "absolute", left: n.x, top: n.y, width: NW, minHeight: NH, background: "#fff", border: `1.5px solid ${selKey === n.key ? ACCENT : "#e2e2de"}`, borderRadius: 11, padding: "10px 12px", cursor: "grab", boxShadow: selKey === n.key ? "0 6px 18px rgba(70,83,214,.18)" : "0 2px 6px rgba(20,20,30,.06)", userSelect: "none" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                <div style={{ width: 9, height: 9, flex: "none", borderRadius: 3, background: n.color }} />
                <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3, flex: 1 }}>{n.title}</div>
              </div>
              <div style={{ fontSize: 10.5, color: "#7c7f89", lineHeight: 1.45, textWrap: "pretty" }}>{n.desc}</div>
              <div
                onMouseDown={(e) => { e.stopPropagation(); const pt = cvPoint(e); setConnect({ from: n.key, mx: pt.x, my: pt.y }); setDrag(null); }}
                title="Conectar"
                className="hv-port"
                style={{ position: "absolute", right: -7, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, borderRadius: 99, background: ACCENT, border: "2.5px solid #fff", cursor: "crosshair", boxShadow: "0 1px 3px rgba(20,20,30,.25)", transition: "transform .12s" }}
              />
            </div>
          ))}
        </div>

        {sel ? (
          <div style={{ position: "absolute", top: 14, right: 14, width: 250, background: "#fff", border: "1px solid #e2e2de", borderRadius: 12, padding: 14, boxShadow: "0 8px 24px rgba(20,20,30,.1)", display: "flex", flexDirection: "column", gap: 8, zIndex: 20 }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: "#6b6e78", textTransform: "uppercase", letterSpacing: ".05em" }}>Editar nó</div>
            <input value={sel.title} onChange={(e) => editNode(sel.key, { title: e.target.value })} style={{ border: "1px solid #e2e2de", borderRadius: 8, padding: "8px 10px", font: "600 12.5px var(--font-instrument)", outline: "none" }} />
            <textarea value={sel.desc} onChange={(e) => editNode(sel.key, { desc: e.target.value })} rows={3} style={{ border: "1px solid #e2e2de", borderRadius: 8, padding: "8px 10px", font: "400 11.5px var(--font-instrument)", outline: "none", resize: "none" }} />
            <div style={{ display: "flex", gap: 6 }}>
              {NODE_COLORS.map((c) => (
                <div key={c} onClick={() => editNode(sel.key, { color: c })} style={{ width: 22, height: 22, borderRadius: 7, cursor: "pointer", background: c, border: `2px solid ${sel.color === c ? "#1c1e26" : "transparent"}` }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
              <div onClick={() => removeNode(sel.key)} className="hv-redbg" style={{ fontSize: 11.5, fontWeight: 600, color: "#b3402e", cursor: "pointer", padding: "6px 10px", borderRadius: 7, border: "1px solid #f0d5d0" }}>Excluir</div>
              <div onClick={() => setSelKey(null)} className="hv-light" style={{ fontSize: 11.5, fontWeight: 600, color: "#6b6e78", cursor: "pointer", padding: "6px 10px", borderRadius: 7, border: "1px solid #e2e2de", marginLeft: "auto" }}>Fechar</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
