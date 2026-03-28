import { useState, useRef, useEffect, useCallback } from 'react';
import Btn from '../components/ui/Btn';
import AddTableModal from '../components/modals/AddTableModal';
import EditTableModal from '../components/modals/EditTableModal';
import RelationsModal from '../components/modals/RelationsModal';
import ExportModal from '../components/modals/ExportModal';
import ExportImageModal from '../components/modals/ExportImageModal';
import OptimizeModal from '../components/modals/OptimizeModal';
import EventModal from '../components/modals/EventModal';
import ControllerModal from '../components/modals/ControllerModal';
import ViewModal from '../components/modals/ViewModal';
import { TC } from '../constants';
import { uid } from '../utils/uid';
import { detectRelations } from '../utils/detectRelations';

const EVT_COLORS = { trigger: '#f59e0b', function: '#a78bfa', procedure: '#38bdf8', event: '#fb923c' };
const EVT_ICONS = { trigger: '⚡', function: 'ƒ', procedure: '⚙', event: '⏱' };
const HTTP_COL = { GET: '#34d399', POST: '#38bdf8', PUT: '#f59e0b', PATCH: '#fb923c', DELETE: '#ef4444' };
const VIEW_COL = { page: '#22d3ee', component: '#a78bfa', api: '#34d399', email: '#fb923c' };
const VIEW_ICON = { page: '📄', component: '🧩', api: '{ }', email: '✉' };

function CanvasPage({ schema, onBack }) {
  const canvasRef = useRef(null);
  const [tables, setTables] = useState([]);
  const [relations, setRelations] = useState([]);
  const [events, setEvents] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [draggingEvent, setDraggingEvent] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [showExportImage, setShowExportImage] = useState(false);
  const [showAddTable, setShowAddTable] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [showRelations, setShowRelations] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showOptimize, setShowOptimize] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [controllers, setControllers] = useState([]);
  const [views, setViews] = useState([]);
  const [showControllerModal, setShowControllerModal] = useState(false);
  const [editingController, setEditingController] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingView, setEditingView] = useState(null);
  const [draggingController, setDraggingController] = useState(null);
  const [draggingView, setDraggingView] = useState(null);
  const [toast, setToast] = useState(null);
  const [linkMode, setLinkMode] = useState(false);
  const [linkFrom, setLinkFrom] = useState(null);
  const [linkMouse, setLinkMouse] = useState(null);
  const [hoveredField, setHoveredField] = useState(null);
  const [spacePressed, setSpacePressed] = useState(false);
  const [hoveredTable, setHoveredTable] = useState(null);
  // Drag-to-link from connector dots (works without Link Mode)
  const [dotDrag, setDotDrag] = useState(null); // {tableIdx, fieldIdx, table, field}
  const [dotMouse, setDotMouse] = useState(null);
  const [minimapDragging, setMinimapDragging] = useState(false);
  const minimapRef = useRef(null);
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);

  const flash = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    if (!schema) return;
    const vw = window.innerWidth - 24, vh = window.innerHeight - 100;
    const cols = Math.ceil(Math.sqrt(schema.tables.length));
    const gridW = cols * 320, gridH = Math.ceil(schema.tables.length / cols) * 340;
    const startX = Math.max(80, (vw - gridW) / 2), startY = Math.max(80, (vh - gridH) / 2);
    setTables(schema.tables.map((t, i) => ({ ...t, x: startX + (i % cols) * 320, y: startY + Math.floor(i / cols) * 340, collapsed: false })));
    setRelations(schema.relations);
    setZoom(.85);
    setPan({ x: 0, y: 0 });
  }, [schema]);

  const TW = 260, HDR = 36, ROW = 27.5;

  const onTblDown = (e, idx) => {
    if (e.button === 2 || linkMode) return;
    if (e.target.closest('[data-connector]')) return;
    e.stopPropagation();
    setDragging(idx);
    setSelected(idx);
    const r = canvasRef.current.getBoundingClientRect();
    setOffset({ x: (e.clientX - r.left) / zoom - pan.x - tables[idx].x, y: (e.clientY - r.top) / zoom - pan.y - tables[idx].y });
  };

  const onEvtDown = (e, idx) => {
    if (e.button === 2) return;
    e.stopPropagation();
    setDraggingEvent(idx);
    const r = canvasRef.current.getBoundingClientRect();
    setOffset({ x: (e.clientX - r.left) / zoom - pan.x - events[idx].x, y: (e.clientY - r.top) / zoom - pan.y - events[idx].y });
  };

  const onCtrlDown = (e, idx) => {
    if (e.button === 2) return;
    e.stopPropagation();
    setDraggingController(idx);
    const r = canvasRef.current.getBoundingClientRect();
    setOffset({ x: (e.clientX - r.left) / zoom - pan.x - controllers[idx].x, y: (e.clientY - r.top) / zoom - pan.y - controllers[idx].y });
  };

  const onViewDown = (e, idx) => {
    if (e.button === 2) return;
    e.stopPropagation();
    setDraggingView(idx);
    const r = canvasRef.current.getBoundingClientRect();
    setOffset({ x: (e.clientX - r.left) / zoom - pan.x - views[idx].x, y: (e.clientY - r.top) / zoom - pan.y - views[idx].y });
  };

  const onCvsDown = e => {
    if (linkMode) return;
    if (spacePressed || !e.target.closest('[data-table]') && !e.target.closest('[data-event]') && !e.target.closest('[data-ctrl]') && !e.target.closest('[data-view]')) {
      setSelected(null);
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x * zoom, y: e.clientY - pan.y * zoom });
    }
  };

  // Connector dot mousedown → start drag-to-link
  const onDotDown = (e, tableIdx, fieldIdx) => {
    e.stopPropagation();
    e.preventDefault();
    const t = tables[tableIdx], f = t.fields[fieldIdx];
    setDotDrag({ tableIdx, fieldIdx, table: t.name, field: f.name });
    const r = canvasRef.current.getBoundingClientRect();
    setDotMouse({ x: (e.clientX - r.left) / zoom - pan.x, y: (e.clientY - r.top) / zoom - pan.y });
  };

  const onMM = useCallback(e => {
    // Link mode mouse tracking
    if (linkMode && linkFrom) {
      const r = canvasRef.current.getBoundingClientRect();
      setLinkMouse({ x: (e.clientX - r.left) / zoom - pan.x, y: (e.clientY - r.top) / zoom - pan.y });
    }
    // Dot drag mouse tracking
    if (dotDrag) {
      const r = canvasRef.current.getBoundingClientRect();
      setDotMouse({ x: (e.clientX - r.left) / zoom - pan.x, y: (e.clientY - r.top) / zoom - pan.y });
    }
    // Table dragging
    if (dragging !== null) {
      const r = canvasRef.current.getBoundingClientRect();
      setTables(p => p.map((t, i) => i === dragging ? { ...t, x: (e.clientX - r.left) / zoom - pan.x - offset.x, y: (e.clientY - r.top) / zoom - pan.y - offset.y } : t));
    }
    // Event dragging
    else if (draggingEvent !== null) {
      const r = canvasRef.current.getBoundingClientRect();
      setEvents(p => p.map((ev, i) => i === draggingEvent ? { ...ev, x: (e.clientX - r.left) / zoom - pan.x - offset.x, y: (e.clientY - r.top) / zoom - pan.y - offset.y } : ev));
    }
    // Controller dragging
    else if (draggingController !== null) {
      const r = canvasRef.current.getBoundingClientRect();
      setControllers(p => p.map((c, i) => i === draggingController ? { ...c, x: (e.clientX - r.left) / zoom - pan.x - offset.x, y: (e.clientY - r.top) / zoom - pan.y - offset.y } : c));
    }
    // View dragging
    else if (draggingView !== null) {
      const r = canvasRef.current.getBoundingClientRect();
      setViews(p => p.map((v, i) => i === draggingView ? { ...v, x: (e.clientX - r.left) / zoom - pan.x - offset.x, y: (e.clientY - r.top) / zoom - pan.y - offset.y } : v));
    }
    // Canvas panning
    else if (isPanning) {
      setPan({ x: (e.clientX - panStart.x) / zoom, y: (e.clientY - panStart.y) / zoom });
    }
  }, [dragging, draggingEvent, draggingController, draggingView, isPanning, offset, pan, panStart, zoom, linkMode, linkFrom, dotDrag]);

  const onMU = useCallback((e) => {
    // Dot drag release → check if over a field target
    if (dotDrag) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const targetRow = el?.closest('[data-field-target]');
      if (targetRow) {
        const [ti, fi] = targetRow.dataset.fieldTarget.split('-').map(Number);
        const t = tables[ti], f = t?.fields[fi];
        if (t && f && !(dotDrag.table === t.name && dotDrag.field === f.name)) {
          const exists = relations.some(r =>
            (r.from === dotDrag.table && r.fromField === dotDrag.field && r.to === t.name && r.toField === f.name) ||
            (r.from === t.name && r.fromField === f.name && r.to === dotDrag.table && r.toField === dotDrag.field)
          );
          if (!exists) {
            setRelations(p => [...p, { id: uid(), from: dotDrag.table, fromField: dotDrag.field, to: t.name, toField: f.name }]);
            flash(`Linked: ${dotDrag.table}.${dotDrag.field} → ${t.name}.${f.name}`);
          } else {
            flash("Relation already exists", "danger");
          }
        }
      }
      setDotDrag(null);
      setDotMouse(null);
    }
    setDragging(null);
    setDraggingEvent(null);
    setDraggingController(null);
    setDraggingView(null);
    setIsPanning(false);
  }, [dotDrag, tables, relations]);

  useEffect(() => { window.addEventListener("mousemove", onMM); window.addEventListener("mouseup", onMU); return () => { window.removeEventListener("mousemove", onMM); window.removeEventListener("mouseup", onMU); }; }, [onMM, onMU]);

  useEffect(() => {
    const esc = e => { if (e.key === "Escape") { setLinkMode(false); setLinkFrom(null); setLinkMouse(null); setDotDrag(null); setDotMouse(null); } };
    const kd = e => { if (e.code === "Space" && !linkMode) { e.preventDefault(); setSpacePressed(true); canvasRef.current?.focus(); } };
    const ku = e => { if (e.code === "Space") { e.preventDefault(); setSpacePressed(false); setIsPanning(false); } };
    window.addEventListener("keydown", esc); window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", esc); window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, [linkMode]);

  useEffect(() => {
    const el = canvasRef.current; if (!el) return;
    const handler = e => {
      e.preventDefault();
      const oldZoom = zoomRef.current;
      const newZoom = Math.max(.25, Math.min(2.5, oldZoom + (e.deltaY > 0 ? -.06 : .06)));
      if (newZoom === oldZoom) return;
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left, mouseY = e.clientY - rect.top;
      const oldPan = panRef.current;
      setZoom(newZoom);
      setPan({ x: mouseX / newZoom - mouseX / oldZoom + oldPan.x, y: mouseY / newZoom - mouseY / oldZoom + oldPan.y });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const fc = (tN, fN) => { const t = tables.find(tb => tb.name === tN); if (!t) return { x: 0, y: 0 }; const fi = t.fields.findIndex(f => f.name === fN); return { x: t.x + TW / 2, y: t.y + HDR + (fi >= 0 ? fi : 0) * ROW + ROW / 2 }; };
  const fp = (ti, fi) => { const t = tables[ti]; if (!t) return { x: 0, y: 0 }; return { x: t.x + TW / 2, y: t.y + HDR + fi * ROW + ROW / 2 }; };

  const onFC = (ti, fi) => {
    if (!linkMode) return;
    const t = tables[ti], f = t.fields[fi];
    if (!linkFrom) { setLinkFrom({ table: t.name, field: f.name, tableIdx: ti, fieldIdx: fi }); flash(`From: ${t.name}.${f.name} → click target`, "info"); }
    else {
      if (linkFrom.table === t.name && linkFrom.field === f.name) { setLinkFrom(null); setLinkMouse(null); return; }
      if (relations.some(r => (r.from === linkFrom.table && r.fromField === linkFrom.field && r.to === t.name && r.toField === f.name) || (r.from === t.name && r.fromField === f.name && r.to === linkFrom.table && r.toField === linkFrom.field))) { flash("Relation already exists", "danger"); setLinkFrom(null); setLinkMouse(null); return; }
      setRelations(p => [...p, { id: uid(), from: linkFrom.table, fromField: linkFrom.field, to: t.name, toField: f.name }]);
      flash(`Linked: ${linkFrom.table}.${linkFrom.field} → ${t.name}.${f.name}`);
      setLinkFrom(null); setLinkMouse(null);
    }
  };

  const refreshRels = tbls => { setRelations(detectRelations(tbls.map(({ x, y, collapsed, ...r }) => r))); };
  const handleAdd = nt => { const mx = tables.length > 0 ? Math.max(...tables.map(t => t.x)) : 0; const u = [...tables, { ...nt, x: mx + 350, y: 80, collapsed: false }]; setTables(u); refreshRels(u); flash(`"${nt.name}" created`); };
  const handleSave = upd => { const u = tables.map(t => t.id === upd.id ? { ...t, ...upd } : t); setTables(u); refreshRels(u); flash(`"${upd.name}" saved`); };
  const handleDel = id => { const t = tables.find(tb => tb.id === id); setTables(tables.filter(tb => tb.id !== id)); setRelations(p => p.filter(r => r.from !== t?.name && r.to !== t?.name)); setSelected(null); flash(`"${t?.name}" deleted`, "danger"); };
  const fitToView = () => { if (tables.length === 0) return; const xs = tables.map(t => t.x), ys = tables.map(t => t.y); const minX = Math.min(...xs), minY = Math.min(...ys), maxX = Math.max(...xs), maxY = Math.max(...ys); const contentW = maxX - minX + TW + 80, contentH = maxY - minY + Math.max(...tables.map(t => HDR + t.fields.length * ROW)) + 80; const vw = window.innerWidth - 24, vh = window.innerHeight - 100; const newZoom = Math.min(vw / contentW, vh / contentH, 1.5); const newX = -minX * newZoom + (vw - contentW * newZoom) / 2, newY = -minY * newZoom + (vh - contentH * newZoom) / 2; setZoom(newZoom); setPan({ x: newX / newZoom, y: newY / newZoom }); };
  const delRel = id => { setRelations(p => p.filter(r => r.id !== id)); flash("Relation removed", "danger"); };

  // Event handlers
  const handleEventSave = (ev) => {
    setEvents(p => { const idx = p.findIndex(e => e.id === ev.id); if (idx >= 0) return p.map((e, i) => i === idx ? ev : e); return [...p, ev]; });
    flash(`${ev.type} "${ev.name}" saved`);
  };
  const handleEventDel = (id) => { setEvents(p => p.filter(e => e.id !== id)); flash("Removed", "danger"); };

  // Controller handlers
  const handleCtrlSave = (c) => {
    setControllers(p => { const idx = p.findIndex(e => e.id === c.id); if (idx >= 0) return p.map((e, i) => i === idx ? c : e); return [...p, c]; });
    flash(`Controller "${c.name}" saved`);
  };
  const handleCtrlDel = (id) => { setControllers(p => p.filter(c => c.id !== id)); flash("Controller removed", "danger"); };

  // View handlers
  const handleViewSave = (v) => {
    setViews(p => { const idx = p.findIndex(e => e.id === v.id); if (idx >= 0) return p.map((e, i) => i === idx ? v : e); return [...p, v]; });
    flash(`View "${v.name}" saved`);
  };
  const handleViewDel = (id) => { setViews(p => p.filter(v => v.id !== id)); flash("View removed", "danger"); };

  // Minimap
  const MM_W = 190, MM_H = 130, MM_VB_W = 2400, MM_VB_H = 1600;
  const minimapSetPanFromEvent = useCallback((e) => {
    const mmEl = minimapRef.current; if (!mmEl) return;
    const rect = mmEl.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width * MM_VB_W;
    const my = (e.clientY - rect.top) / rect.height * MM_VB_H;
    const el = canvasRef.current; if (!el) return;
    const cr = el.getBoundingClientRect();
    setPan({ x: cr.width / (2 * zoom) - mx, y: cr.height / (2 * zoom) - my });
  }, [zoom]);
  const onMinimapDown = useCallback((e) => { e.stopPropagation(); setMinimapDragging(true); minimapSetPanFromEvent(e); }, [minimapSetPanFromEvent]);
  useEffect(() => {
    if (!minimapDragging) return;
    const onMove = (e) => { minimapSetPanFromEvent(e); };
    const onUp = () => { setMinimapDragging(false); };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [minimapDragging, minimapSetPanFromEvent]);
  const getViewportRect = () => { const el = canvasRef.current; if (!el) return null; const cr = el.getBoundingClientRect(); return { x: -pan.x, y: -pan.y, w: cr.width / zoom, h: cr.height / zoom }; };
  const vp = getViewportRect();

  // Connector dot: visible when table is selected, hovered, or dotDrag active
  const Dot = ({ tableIdx, fieldIdx, side }) => {
    const isSrc = dotDrag?.tableIdx === tableIdx && dotDrag?.fieldIdx === fieldIdx;
    const showDots = selected === tableIdx || hoveredTable === tableIdx || !!dotDrag;
    return (
      <span
        data-connector="true"
        onMouseDown={e => onDotDown(e, tableIdx, fieldIdx)}
        style={{
          position: "absolute", [side]: -7, top: "50%", transform: "translateY(-50%)",
          width: 14, height: 14, borderRadius: "50%",
          background: isSrc ? "#34d399" : dotDrag ? "rgba(52,211,153,.3)" : "rgba(52,211,153,.2)",
          border: `2px solid ${isSrc ? "#34d399" : dotDrag ? "#34d399" : "rgba(52,211,153,.5)"}`,
          cursor: "crosshair", zIndex: 5,
          transition: "all .15s, opacity .15s",
          opacity: showDots ? 1 : 0,
          boxShadow: isSrc ? "0 0 8px rgba(52,211,153,.5)" : "none",
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.background = "#34d399"; e.currentTarget.style.transform = "translateY(-50%) scale(1.3)"; }}
        onMouseLeave={e => { if (!isSrc) { e.currentTarget.style.opacity = showDots ? "1" : "0"; e.currentTarget.style.background = dotDrag ? "rgba(52,211,153,.3)" : "rgba(52,211,153,.2)"; e.currentTarget.style.transform = "translateY(-50%) scale(1)"; } }}
      />
    );
  };

  return (
    <div style={{ height: "100vh", overflow: "hidden", position: "relative" }}>
      {/* Toolbar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 60, background: "rgba(6,8,15,.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(52,211,153,.08)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Btn variant="ghost" onClick={onBack}>← Back</Btn>
          <div style={{ width: 1, height: 28, background: "rgba(255,255,255,.08)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#34d399,#10b981)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono'", fontWeight: 700, fontSize: 12, color: "#06080f" }}>ER</div>
            <div>
              <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 600, fontSize: 14 }}>ERD <span style={{ color: "#34d399" }}>Builder</span></span>
              <div style={{ fontSize: 10, color: "#64748b" }}>{tables.length} tables · {relations.length} relations · {events.length} events</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Btn variant="green" onClick={() => setShowAddTable(true)}>+ Table</Btn>
          <Btn variant="cyan" onClick={() => setShowControllerModal(true)}>+ Controller</Btn>
          <Btn variant="ghost" onClick={() => setShowViewModal(true)} style={{ color: "#22d3ee", borderColor: "rgba(34,211,238,.3)" }}>+ View</Btn>
          <Btn variant="purple" onClick={() => setShowEventModal(true)}>+ Event</Btn>
          <div style={{ width: 1, height: 28, background: "rgba(255,255,255,.08)" }} />
          <Btn variant={linkMode ? "active" : "ghost"} onClick={() => { setLinkMode(!linkMode); setLinkFrom(null); setLinkMouse(null); }}>{linkMode ? "🔗 Linking..." : "🔗 Link"}</Btn>
          <Btn variant="ghost" onClick={() => setShowRelations(true)}>Relations</Btn>
          <Btn variant="cyan" onClick={() => setShowOptimize(true)}>⚡ Optimize</Btn>
          <div style={{ width: 1, height: 28, background: "rgba(255,255,255,.08)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 2, background: "rgba(255,255,255,.04)", borderRadius: 10, padding: "4px 8px", border: "1px solid rgba(255,255,255,.06)" }}>
            <button onClick={() => setZoom(z => Math.max(.25, z - .1))} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 18, padding: "2px 8px", lineHeight: 1 }}>−</button>
            <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: "#94a3b8", minWidth: 42, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2.5, z + .1))} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 18, padding: "2px 8px", lineHeight: 1 }}>+</button>
          </div>
          <Btn variant="ghost" onClick={fitToView}>Fit</Btn>
          <Btn variant={showMinimap ? "cyan" : "ghost"} onClick={() => setShowMinimap(s => !s)}>Map</Btn>
          <div style={{ width: 1, height: 28, background: "rgba(255,255,255,.08)" }} />
          <Btn variant="cyan" onClick={() => setShowExportImage(true)}>🖼 Image</Btn>
          <Btn variant="amber" onClick={() => setShowExport(true)}>⬇ Export</Btn>
        </div>
      </div>
      {/* Link Mode Banner */}
      {linkMode && <div style={{ position: "absolute", top: 60, left: 0, right: 0, height: 36, background: "rgba(167,139,250,.1)", borderBottom: "1px solid rgba(167,139,250,.25)", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, zIndex: 40, fontSize: 12, color: "#a78bfa" }}><span style={{ fontWeight: 600 }}>🔗 LINK MODE</span><span>{linkFrom ? `From: ${linkFrom.table}.${linkFrom.field} → Click target field` : "Click source field"}</span>{linkFrom && <Btn variant="danger" onClick={() => { setLinkFrom(null); setLinkMouse(null); flash("Link cancelled", "info"); }} size="sm">✕ Cancel</Btn>}<Btn variant="ghost" onClick={() => { setLinkMode(false); setLinkFrom(null); setLinkMouse(null); }} size="sm">ESC Exit</Btn></div>}
      {/* Canvas */}
      <div ref={canvasRef} onMouseDown={onCvsDown} style={{ position: "absolute", top: linkMode ? 96 : 60, left: 0, right: 0, bottom: 0, cursor: linkMode ? "crosshair" : dotDrag ? "crosshair" : spacePressed || isPanning ? "grabbing" : dragging !== null ? "grabbing" : "default", overflow: "hidden", backgroundImage: "radial-gradient(circle at 1px 1px,rgba(255,255,255,.03) 1px,transparent 0)", backgroundSize: `${24 * zoom}px ${24 * zoom}px`, backgroundPosition: `${pan.x * zoom}px ${pan.y * zoom}px` }}>
        <div style={{ transform: `scale(${zoom}) translate(${pan.x}px,${pan.y}px)`, transformOrigin: "0 0", position: "absolute", top: 0, left: 0, width: 5000, height: 4000 }}>
          <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}>
            <defs><marker id="arr" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0,10 3.5,0 7" fill="#f59e0b" opacity=".8" /></marker><marker id="art" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#a78bfa" opacity=".9" /></marker></defs>
            {/* Relations */}
            {relations.map((rel, i) => { const from = fc(rel.from, rel.fromField), to = fc(rel.to, rel.toField); const cp = Math.abs(from.x - to.x) * .35 + 50; const sX = from.x + (to.x > from.x ? TW / 2 + 4 : -TW / 2 - 4), eX = to.x + (from.x > to.x ? TW / 2 + 4 : -TW / 2 - 4); const d = `M ${sX} ${from.y} C ${sX + (to.x > from.x ? cp : -cp)} ${from.y},${eX + (from.x > to.x ? cp : -cp)} ${to.y},${eX} ${to.y}`; return <g key={i} style={{ cursor: "pointer", pointerEvents: "stroke" }} onClick={e => { if (e.altKey) { delRel(rel.id); } }} title={`${rel.from}.${rel.fromField} → ${rel.to}.${rel.toField} (Alt+Click to delete)`}><path d={d} fill="none" stroke="rgba(245,158,11,.1)" strokeWidth="12" /><path d={d} fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity={hoveredField?.relId === i ? .9 : .55} markerEnd="url(#arr)" strokeDasharray="6 3" onMouseEnter={() => !linkMode && setHoveredField({ relId: i })} onMouseLeave={() => !linkMode && setHoveredField(null)} /></g>; })}
            {/* Link mode preview */}
            {linkFrom && linkMouse && (() => { const from = fp(linkFrom.tableIdx, linkFrom.fieldIdx); const sX = from.x + (linkMouse.x > from.x ? TW / 2 + 4 : -TW / 2 - 4); return <line x1={sX} y1={from.y} x2={linkMouse.x} y2={linkMouse.y} stroke="#a78bfa" strokeWidth="2" strokeDasharray="8 4" opacity=".8" markerEnd="url(#art)" />; })()}
            {/* Dot drag preview */}
            {dotDrag && dotMouse && (() => { const from = fp(dotDrag.tableIdx, dotDrag.fieldIdx); const sX = from.x + (dotMouse.x > from.x ? TW / 2 + 4 : -TW / 2 - 4); return <line x1={sX} y1={from.y} x2={dotMouse.x} y2={dotMouse.y} stroke="#34d399" strokeWidth="2" strokeDasharray="6 4" opacity=".9" />; })()}
            {/* Event links to tables */}
            {events.map((ev, i) => {
              if (!ev.linkedTable) return null;
              const t = tables.find(tb => tb.name === ev.linkedTable);
              if (!t) return null;
              const fromX = ev.x + 90, fromY = ev.y + 24;
              const toX = t.x + TW / 2, toY = t.y;
              return <line key={`ev-${i}`} x1={fromX} y1={fromY} x2={toX} y2={toY} stroke={EVT_COLORS[ev.type]} strokeWidth="1.5" strokeDasharray="4 4" opacity=".5" />;
            })}
            {/* Controller → Table connections (left side) */}
            {controllers.map((ctrl, ci) => ctrl.methods.flatMap((m, mi) => (m.linkedTables || []).map((tblName, ti) => {
              const t = tables.find(tb => tb.name === tblName);
              if (!t) return null;
              const fromX = ctrl.x, fromY = ctrl.y + 36 + mi * 26 + 13;
              const toX = t.x + TW, toY = t.y + HDR / 2;
              const cpx = Math.abs(fromX - toX) * .3 + 40;
              return <path key={`ct-${ci}-${mi}-${ti}`} d={`M ${fromX} ${fromY} C ${fromX - cpx} ${fromY},${toX + cpx} ${toY},${toX} ${toY}`} fill="none" stroke={HTTP_COL[m.httpMethod] || '#94a3b8'} strokeWidth="1.5" strokeDasharray="5 3" opacity=".5" />;
            })))}
            {/* Controller → View connections (right side) */}
            {controllers.map((ctrl, ci) => ctrl.methods.filter(m => m.linkedView).map((m, mi) => {
              const v = views.find(vw => vw.name === m.linkedView);
              if (!v) return null;
              const fromX = ctrl.x + 220, fromY = ctrl.y + 36 + mi * 26 + 13;
              const toX = v.x, toY = v.y + 30;
              const cpx = Math.abs(fromX - toX) * .3 + 40;
              return <path key={`cv-${ci}-${mi}`} d={`M ${fromX} ${fromY} C ${fromX + cpx} ${fromY},${toX - cpx} ${toY},${toX} ${toY}`} fill="none" stroke={VIEW_COL[v.type] || '#22d3ee'} strokeWidth="1.5" strokeDasharray="5 3" opacity=".5" />;
            }))}
          </svg>

          {/* Tables */}
          {tables.map((table, idx) => { const sel = selected === idx; return (
            <div key={table.id} data-table="true" onMouseDown={e => onTblDown(e, idx)} onMouseEnter={() => setHoveredTable(idx)} onMouseLeave={() => setHoveredTable(null)} onDoubleClick={e => { e.stopPropagation(); if (!linkMode) setEditingTable(table); }} style={{ position: "absolute", left: table.x, top: table.y, width: TW, background: sel ? "rgba(15,23,42,.98)" : "rgba(10,16,30,.95)", border: `1px solid ${sel ? "rgba(52,211,153,.5)" : "rgba(255,255,255,.08)"}`, borderRadius: 12, zIndex: sel ? 10 : 2, boxShadow: sel ? "0 0 0 2px rgba(52,211,153,.2),0 8px 32px rgba(0,0,0,.5)" : "0 4px 24px rgba(0,0,0,.3)", transition: dragging === idx ? "none" : "box-shadow .2s", userSelect: "none", overflow: "visible" }}>
              <div style={{ padding: "9px 12px", background: sel ? "rgba(52,211,153,.08)" : "rgba(255,255,255,.03)", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "12px 12px 0 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: sel ? "#34d399" : "#334155" }} /><span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, fontWeight: 600 }}>{table.name}</span></div>
                <div style={{ display: "flex", gap: 4 }}><button onClick={e => { e.stopPropagation(); if (!linkMode) setEditingTable(table); }} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13, padding: "0 3px" }}>✎</button><button onClick={e => { e.stopPropagation(); setTables(p => p.map((t, i) => i === idx ? { ...t, collapsed: !t.collapsed } : t)); }} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13, padding: "0 3px" }}>{table.collapsed ? "▸" : "▾"}</button></div>
              </div>
              {!table.collapsed && table.fields.map((f, fi) => { const isH = hoveredField?.tableIdx === idx && hoveredField?.fieldIdx === fi; const isS = linkFrom?.tableIdx === idx && linkFrom?.fieldIdx === fi; const isDotSrc = dotDrag?.tableIdx === idx && dotDrag?.fieldIdx === fi; const tl = f.size ? `${f.type}(${f.size})` : f.type; return (
                <div key={f.id || fi} data-field-target={`${idx}-${fi}`} onClick={e => { e.stopPropagation(); onFC(idx, fi); }} onMouseEnter={() => linkMode && setHoveredField({ tableIdx: idx, fieldIdx: fi })} onMouseLeave={() => setHoveredField(null)}
                  style={{ padding: "6px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: fi < table.fields.length - 1 ? "1px solid rgba(255,255,255,.03)" : "none", fontSize: 11, background: isDotSrc ? "rgba(52,211,153,.12)" : isS ? "rgba(167,139,250,.12)" : isH && linkMode ? "rgba(52,211,153,.06)" : "transparent", cursor: linkMode ? "crosshair" : "default", borderLeft: isDotSrc ? "3px solid #34d399" : isS ? "3px solid #a78bfa" : isH && linkMode ? "3px solid rgba(52,211,153,.4)" : "3px solid transparent", transition: "background .1s", position: "relative" }}>
                  {/* Connector dots on both sides */}
                  <Dot tableIdx={idx} fieldIdx={fi} side="left" />
                  <Dot tableIdx={idx} fieldIdx={fi} side="right" />
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    {(f.isPrimary || f.name === "id") ? <span style={{ color: "#f59e0b", fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono'", width: 18 }}>PK</span> : f.isForeign ? <span style={{ color: "#a78bfa", fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono'", width: 18 }}>FK</span> : <span style={{ width: 18 }} />}
                    <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: f.isPrimary || f.name === "id" ? "#f59e0b" : f.isForeign ? "#a78bfa" : "#cbd5e1" }}>{f.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {f.nullable && <span style={{ fontSize: 7, color: "#475569" }}>null</span>}
                    <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 9, color: TC[f.type] || "#64748b", background: `${TC[f.type] || "#64748b"}12`, padding: "1px 6px", borderRadius: 4 }}>{tl}</span>
                    {linkMode && <span style={{ width: 8, height: 8, borderRadius: "50%", background: isS ? "#a78bfa" : isH ? "#34d399" : "rgba(255,255,255,.15)", border: `1.5px solid ${isS ? "#a78bfa" : isH ? "#34d399" : "rgba(255,255,255,.15)"}`, transition: "all .15s", flexShrink: 0 }} />}
                  </div>
                </div>
              ); })}
              {table.collapsed && <div style={{ padding: "7px 12px", fontSize: 10, color: "#475569", fontStyle: "italic", borderRadius: "0 0 12px 12px" }}>{table.fields.length} fields</div>}
            </div>
          ); })}

          {/* Event/Function/Trigger nodes */}
          {events.map((ev, idx) => {
            const col = EVT_COLORS[ev.type];
            return (
              <div key={ev.id} data-event="true" onMouseDown={e => onEvtDown(e, idx)} onDoubleClick={e => { e.stopPropagation(); setEditingEvent(ev); }}
                style={{ position: "absolute", left: ev.x, top: ev.y, width: 180, background: "rgba(10,16,30,.95)", border: `1px solid ${col}40`, borderRadius: 12, zIndex: 2, boxShadow: `0 4px 20px rgba(0,0,0,.3)`, userSelect: "none", cursor: "grab", overflow: "hidden" }}>
                <div style={{ padding: "8px 12px", background: `${col}10`, borderBottom: `1px solid ${col}20`, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{EVT_ICONS[ev.type]}</span>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, fontWeight: 600, color: col }}>{ev.name}</div>
                    <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase" }}>{ev.type}</div>
                  </div>
                </div>
                <div style={{ padding: "6px 12px", fontSize: 10, color: "#94a3b8" }}>
                  {ev.type === 'trigger' && <span>{ev.timing} {ev.triggerEvent} on <span style={{ color: "#e2e8f0" }}>{ev.linkedTable}</span></span>}
                  {ev.type === 'event' && <span>⏱ {ev.schedule}{ev.linkedTable && <> on <span style={{ color: "#e2e8f0" }}>{ev.linkedTable}</span></>}</span>}
                  {ev.type === 'function' && <span>ƒ() → returns result</span>}
                  {ev.type === 'procedure' && <span>CALL {ev.name}()</span>}
                </div>
              </div>
            );
          })}

          {/* Controller nodes */}
          {controllers.map((ctrl, idx) => (
            <div key={ctrl.id} data-ctrl="true" onMouseDown={e => onCtrlDown(e, idx)} onDoubleClick={e => { e.stopPropagation(); setEditingController(ctrl); }}
              style={{ position: "absolute", left: ctrl.x, top: ctrl.y, width: 220, background: "rgba(10,16,30,.95)", border: "1px solid rgba(52,211,153,.3)", borderRadius: 12, zIndex: 3, boxShadow: "0 4px 20px rgba(0,0,0,.3)", userSelect: "none", cursor: "grab", overflow: "hidden" }}>
              <div style={{ padding: "8px 12px", background: "rgba(52,211,153,.06)", borderBottom: "1px solid rgba(52,211,153,.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 22, height: 22, background: "rgba(52,211,153,.15)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#34d399", fontFamily: "'JetBrains Mono'" }}>C</span>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, fontWeight: 600, color: "#34d399" }}>{ctrl.name}</div>
                    <div style={{ fontSize: 8, color: "#64748b", textTransform: "uppercase" }}>CONTROLLER</div>
                  </div>
                </div>
                <span style={{ fontSize: 10, color: "#475569" }}>{ctrl.methods.length}m</span>
              </div>
              {ctrl.methods.map((m, mi) => (
                <div key={m.id} style={{ padding: "4px 12px", display: "flex", alignItems: "center", gap: 6, borderBottom: mi < ctrl.methods.length - 1 ? "1px solid rgba(255,255,255,.03)" : "none", fontSize: 10 }}>
                  <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 8, fontWeight: 700, color: HTTP_COL[m.httpMethod], background: `${HTTP_COL[m.httpMethod]}15`, padding: "1px 5px", borderRadius: 3, minWidth: 30, textAlign: "center" }}>{m.httpMethod}</span>
                  <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "#e2e8f0" }}>{m.name}</span>
                  <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 9, color: "#475569", marginLeft: "auto" }}>{m.route}</span>
                </div>
              ))}
            </div>
          ))}

          {/* View nodes */}
          {views.map((v, idx) => {
            const col = VIEW_COL[v.type] || '#22d3ee';
            return (
              <div key={v.id} data-view="true" onMouseDown={e => onViewDown(e, idx)} onDoubleClick={e => { e.stopPropagation(); setEditingView(v); }}
                style={{ position: "absolute", left: v.x, top: v.y, width: 180, background: "rgba(10,16,30,.95)", border: `1px solid ${col}40`, borderRadius: 12, zIndex: 3, boxShadow: "0 4px 20px rgba(0,0,0,.3)", userSelect: "none", cursor: "grab", overflow: "hidden" }}>
                <div style={{ padding: "8px 12px", background: `${col}08`, borderBottom: `1px solid ${col}20`, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{VIEW_ICON[v.type]}</span>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, fontWeight: 600, color: col }}>{v.name}</div>
                    <div style={{ fontSize: 8, color: "#64748b", textTransform: "uppercase" }}>{v.type} VIEW</div>
                  </div>
                </div>
                {v.route && <div style={{ padding: "4px 12px", fontSize: 10, color: "#94a3b8", fontFamily: "'JetBrains Mono'" }}>{v.route}</div>}
                {v.description && <div style={{ padding: "4px 12px 6px", fontSize: 10, color: "#475569" }}>{v.description}</div>}
              </div>
            );
          })}
        </div>
      </div>
      {/* Minimap */}
      {showMinimap && tables.length > 0 && <div ref={minimapRef} onMouseDown={onMinimapDown} style={{ position: "absolute", bottom: 16, right: 16, width: MM_W, height: MM_H, background: "rgba(10,16,30,.9)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, overflow: "hidden", zIndex: 30, cursor: "crosshair" }}><svg width={MM_W} height={MM_H} viewBox={`0 0 ${MM_VB_W} ${MM_VB_H}`}>{tables.map((t, i) => <rect key={i} x={t.x} y={t.y} width={260} height={t.collapsed ? 55 : HDR + t.fields.length * ROW} fill={selected === i ? "rgba(52,211,153,.4)" : "rgba(255,255,255,.12)"} stroke={selected === i ? "#34d399" : "rgba(255,255,255,.08)"} rx="4" />)}{events.map((ev, i) => <rect key={`ev-${i}`} x={ev.x} y={ev.y} width={90} height={30} fill={`${EVT_COLORS[ev.type]}40`} stroke={EVT_COLORS[ev.type]} rx="4" />)}{relations.map((r, i) => { const f = fc(r.from, r.fromField), t = fc(r.to, r.toField); return <line key={i} x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke="#f59e0b" strokeWidth="3" opacity=".35" />; })}{vp && <rect x={vp.x} y={vp.y} width={vp.w} height={vp.h} fill="rgba(52,211,153,.06)" stroke="#34d399" strokeWidth="4" rx="4" opacity=".7" />}</svg></div>}
      {/* Hints */}
      <div style={{ position: "absolute", bottom: 16, left: 16, display: "flex", gap: 10, fontSize: 11, color: "#475569", zIndex: 30 }}><span>🖱 Drag table</span><span>⚙ Dbl-click edit</span><span>🔍 Scroll zoom</span><span>⊙ Click table → drag green dots to link</span><span>Alt+Click line to delete</span></div>
      {/* Toast */}
      {toast && <div style={{ position: "absolute", top: linkMode ? 110 : 74, left: "50%", transform: "translateX(-50%)", background: toast.type === "danger" ? "rgba(239,68,68,.15)" : toast.type === "info" ? "rgba(167,139,250,.15)" : "rgba(52,211,153,.15)", border: `1px solid ${toast.type === "danger" ? "rgba(239,68,68,.3)" : toast.type === "info" ? "rgba(167,139,250,.3)" : "rgba(52,211,153,.3)"}`, color: toast.type === "danger" ? "#ef4444" : toast.type === "info" ? "#a78bfa" : "#34d399", padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 500, zIndex: 100, animation: "slideDown .3s ease" }}>{toast.msg}</div>}
      {/* Modals */}
      {showAddTable && <AddTableModal onClose={() => setShowAddTable(false)} onAdd={handleAdd} existingNames={tables.map(t => t.name)} />}
      {editingTable && <EditTableModal table={editingTable} onClose={() => setEditingTable(null)} onSave={handleSave} onDelete={handleDel} />}
      {showRelations && <RelationsModal relations={relations} onClose={() => setShowRelations(false)} onDelete={delRel} />}
      {showExport && <ExportModal tables={tables.map(({ x, y, collapsed, ...r }) => r)} relations={relations} onClose={() => setShowExport(false)} />}
      {showExportImage && <ExportImageModal tables={tables} relations={relations} onClose={() => setShowExportImage(false)} />}
      {showOptimize && <OptimizeModal tables={tables} relations={relations} onClose={() => setShowOptimize(false)} />}
      {(showEventModal || editingEvent) && <EventModal event={editingEvent} tables={tables} onClose={() => { setShowEventModal(false); setEditingEvent(null); }} onSave={handleEventSave} onDelete={handleEventDel} />}
      {(showControllerModal || editingController) && <ControllerModal controller={editingController} tables={tables} views={views} onClose={() => { setShowControllerModal(false); setEditingController(null); }} onSave={handleCtrlSave} onDelete={handleCtrlDel} />}
      {(showViewModal || editingView) && <ViewModal view={editingView} onClose={() => { setShowViewModal(false); setEditingView(null); }} onSave={handleViewSave} onDelete={handleViewDel} />}
    </div>
  );
}

export default CanvasPage;
