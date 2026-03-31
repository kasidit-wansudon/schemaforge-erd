import { useState, useRef, useEffect, useCallback } from 'react';
import { TC } from '../constants';

const TW = 260, HDR = 36, ROW = 27.5;

function MiniCanvas({ tables: rawTables, relations: allRelations, height = 500 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  // Layout tables in grid
  const [nodes, setNodes] = useState(() => {
    const cols = Math.max(1, Math.ceil(Math.sqrt(rawTables.length)));
    return rawTables.map((t, i) => ({
      ...t,
      x: 60 + (i % cols) * 310,
      y: 60 + Math.floor(i / cols) * 300,
      collapsed: false,
    }));
  });

  // Re-layout when rawTables change
  useEffect(() => {
    const cols = Math.max(1, Math.ceil(Math.sqrt(rawTables.length)));
    setNodes(rawTables.map((t, i) => ({
      ...t,
      x: 60 + (i % cols) * 310,
      y: 60 + Math.floor(i / cols) * 300,
      collapsed: false,
    })));
  }, [rawTables.length]);

  // Filter relations to only visible tables
  const nameSet = new Set(nodes.map(t => t.name));
  const rels = allRelations.filter(r => nameSet.has(r.from) && nameSet.has(r.to));

  const [dragging, setDragging] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);

  // Lookup
  const nodeMap = new Map();
  nodes.forEach((t, i) => nodeMap.set(t.name, i));

  const fc = (tN, fN) => {
    const idx = nodeMap.get(tN);
    if (idx === undefined) return { x: 0, y: 0 };
    const t = nodes[idx];
    const fi = t.fields.findIndex(f => f.name === fN);
    return { x: t.x + TW / 2, y: t.y + HDR + (fi >= 0 ? fi : 0) * ROW + ROW / 2 };
  };

  const onDown = (e, idx) => {
    if (e.button === 2) return;
    e.stopPropagation();
    setDragging(idx);
    const r = canvasRef.current.getBoundingClientRect();
    setOffset({ x: (e.clientX - r.left) / zoom - pan.x - nodes[idx].x, y: (e.clientY - r.top) / zoom - pan.y - nodes[idx].y });
  };

  const onCvsDown = (e) => {
    if (!e.target.closest('[data-mini-tbl]')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x * zoom, y: e.clientY - pan.y * zoom });
    }
  };

  const onMM = useCallback(e => {
    const cx = e.clientX, cy = e.clientY;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const r = canvasRef.current?.getBoundingClientRect();
      if (!r) return;
      const z = zoomRef.current, p = panRef.current;
      if (dragging !== null) {
        const nx = (cx - r.left) / z - p.x - offset.x;
        const ny = (cy - r.top) / z - p.y - offset.y;
        setNodes(prev => prev.map((t, i) => i === dragging ? { ...t, x: nx, y: ny } : t));
      } else if (isPanning) {
        setPan({ x: (cx - panStart.x) / z, y: (cy - panStart.y) / z });
      }
    });
  }, [dragging, isPanning, offset, panStart]);

  const onMU = useCallback(() => {
    setDragging(null);
    setIsPanning(false);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMM);
    window.addEventListener("mouseup", onMU);
    return () => { window.removeEventListener("mousemove", onMM); window.removeEventListener("mouseup", onMU); };
  }, [onMM, onMU]);

  // Wheel zoom
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      const oldZ = zoomRef.current;
      const newZ = Math.max(0.3, Math.min(2, oldZ + (e.deltaY > 0 ? -0.06 : 0.06)));
      if (newZ === oldZ) return;
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      setZoom(newZ);
      setPan({ x: mx / newZ - mx / oldZ + panRef.current.x, y: my / newZ - my / oldZ + panRef.current.y });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  if (rawTables.length === 0) return <div style={{ padding: 24, color: "#475569", textAlign: "center", fontSize: 13 }}>No linked tables</div>;

  return (
    <div
      ref={canvasRef}
      onMouseDown={onCvsDown}
      style={{
        height, position: "relative", overflow: "hidden", cursor: isPanning ? "grabbing" : dragging !== null ? "grabbing" : "grab",
        backgroundImage: "radial-gradient(circle at 1px 1px,rgba(255,255,255,.03) 1px,transparent 0)",
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${pan.x * zoom}px ${pan.y * zoom}px`,
        borderRadius: 10, border: "1px solid rgba(255,255,255,.06)",
      }}
    >
      <div style={{ transform: `scale(${zoom}) translate(${pan.x}px,${pan.y}px)`, transformOrigin: "0 0", position: "absolute", top: 0, left: 0, width: 10000, height: 10000 }}>
        {/* SVG Relations */}
        <svg style={{ position: "absolute", top: 0, left: 0, width: 10000, height: 10000, pointerEvents: "none", zIndex: 0, overflow: "visible" }}>
          <defs><marker id="mc-arr" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0,10 3.5,0 7" fill="#f59e0b" opacity=".8" /></marker></defs>
          {rels.map((rel, i) => {
            const from = fc(rel.from, rel.fromField), to = fc(rel.to, rel.toField);
            const cp = Math.abs(from.x - to.x) * 0.35 + 50;
            const sX = from.x + (to.x > from.x ? TW / 2 + 4 : -TW / 2 - 4);
            const eX = to.x + (from.x > to.x ? TW / 2 + 4 : -TW / 2 - 4);
            const d = `M ${sX} ${from.y} C ${sX + (to.x > from.x ? cp : -cp)} ${from.y},${eX + (from.x > to.x ? cp : -cp)} ${to.y},${eX} ${to.y}`;
            return <path key={i} d={d} fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity=".55" markerEnd="url(#mc-arr)" strokeDasharray="6 3" />;
          })}
        </svg>

        {/* Table Nodes */}
        {nodes.map((table, idx) => (
          <div key={table.name} data-mini-tbl="true" onMouseDown={e => onDown(e, idx)}
            style={{ position: "absolute", left: table.x, top: table.y, width: TW, background: "rgba(10,16,30,.95)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, zIndex: 2, boxShadow: "0 4px 24px rgba(0,0,0,.3)", userSelect: "none", overflow: "hidden", cursor: "grab" }}>
            {/* Header */}
            <div style={{ padding: "9px 12px", background: "rgba(255,255,255,.03)", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "12px 12px 0 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: "#f59e0b", flexShrink: 0 }} />
                <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{table.name}</span>
              </div>
              <button onClick={e => { e.stopPropagation(); setNodes(p => p.map((t, i) => i === idx ? { ...t, collapsed: !t.collapsed } : t)); }} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13, padding: "0 3px" }}>{table.collapsed ? "▸" : "▾"}</button>
            </div>
            {/* Fields */}
            {!table.collapsed && table.fields?.map((f, fi) => {
              const tl = f.size ? `${f.type}(${f.size})` : f.type;
              return (
                <div key={f.id || fi} style={{ padding: "6px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: fi < table.fields.length - 1 ? "1px solid rgba(255,255,255,.03)" : "none", fontSize: 11, borderLeft: "3px solid transparent" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    {(f.isPrimary || f.name === "id") ? <span style={{ color: "#f59e0b", fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono'", width: 18 }}>PK</span> : f.isForeign ? <span style={{ color: "#a78bfa", fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono'", width: 18 }}>FK</span> : <span style={{ width: 18 }} />}
                    <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: f.isPrimary || f.name === "id" ? "#f59e0b" : f.isForeign ? "#a78bfa" : "#cbd5e1" }}>{f.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {f.nullable && <span style={{ fontSize: 7, color: "#475569" }}>null</span>}
                    <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 9, color: TC[f.type] || "#64748b", background: `${TC[f.type] || "#64748b"}12`, padding: "1px 6px", borderRadius: 4 }}>{tl}</span>
                  </div>
                </div>
              );
            })}
            {table.collapsed && <div style={{ padding: "7px 12px", fontSize: 10, color: "#475569", fontStyle: "italic" }}>{table.fields?.length || 0} fields</div>}
          </div>
        ))}
      </div>

      {/* Zoom indicator */}
      <div style={{ position: "absolute", bottom: 8, right: 8, fontSize: 10, fontFamily: "'JetBrains Mono'", color: "#475569", background: "rgba(10,16,30,.8)", padding: "2px 8px", borderRadius: 6 }}>{Math.round(zoom * 100)}%</div>
    </div>
  );
}

export default MiniCanvas;
