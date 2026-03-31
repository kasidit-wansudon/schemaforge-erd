import { useState, useEffect } from 'react';
import Btn from '../components/ui/Btn';
import ControllerModal from '../components/modals/ControllerModal';
import ViewModal from '../components/modals/ViewModal';
import { VERSION, BUILD_DATE, DEVELOPER, TC } from '../constants';

const HTTP_COL = { GET: '#34d399', POST: '#38bdf8', PUT: '#f59e0b', PATCH: '#fb923c', DELETE: '#ef4444' };

function ControllerPage({ controllers, views, tables, relations, onControllers, onViews, onBack }) {
  const [expanded, setExpanded] = useState({});
  const [editingController, setEditingController] = useState(null);
  const [showAddController, setShowAddController] = useState(false);
  const [editingView, setEditingView] = useState(null);
  const [showAddView, setShowAddView] = useState(false);
  // Field selection per controller: { ctrlId: { tableName: Set<fieldName> } }
  // Initialize from existing SQL queries
  const [tableSearch, setTableSearch] = useState({}); // { ctrlId: searchString }
  const [selectedFields, setSelectedFields] = useState(() => {
    const init = {};
    controllers.forEach(ctrl => {
      const ctrlSel = {};
      ctrl.methods?.forEach(m => {
        if (!m.query) return;
        (m.linkedTables || []).forEach(tblName => {
          const tbl = tables.find(t => t.name === tblName);
          if (!tbl) return;
          const existing = ctrlSel[tblName] || new Set();
          tbl.fields?.forEach(f => {
            // Check if field name appears in the query
            if (m.query.includes(f.name)) existing.add(f.name);
          });
          if (existing.size > 0) ctrlSel[tblName] = existing;
        });
      });
      if (Object.keys(ctrlSel).length > 0) init[ctrl.id] = ctrlSel;
    });
    return init;
  });
  const [copied, setCopied] = useState(null); // key string for flash feedback

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  useEffect(() => {
    document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "hidden"; };
  }, []);

  const toggleField = (ctrlId, tableName, fieldName) => {
    setSelectedFields(prev => {
      const ctrl = prev[ctrlId] || {};
      const tbl = new Set(ctrl[tableName] || []);
      if (tbl.has(fieldName)) tbl.delete(fieldName); else tbl.add(fieldName);
      return { ...prev, [ctrlId]: { ...ctrl, [tableName]: tbl } };
    });
  };

  const selectAllFields = (ctrlId, tableName, fields) => {
    setSelectedFields(prev => {
      const ctrl = prev[ctrlId] || {};
      const current = new Set(ctrl[tableName] || []);
      const allSelected = fields.every(f => current.has(f.name));
      return { ...prev, [ctrlId]: { ...ctrl, [tableName]: allSelected ? new Set() : new Set(fields.map(f => f.name)) } };
    });
  };

  const getSelectedForCtrl = (ctrlId) => {
    const ctrl = selectedFields[ctrlId] || {};
    const result = {};
    Object.entries(ctrl).forEach(([tbl, fieldSet]) => {
      const arr = [...fieldSet];
      if (arr.length > 0) result[tbl] = arr;
    });
    return result;
  };

  const generateSQL = (ctrlId, httpMethod) => {
    const sel = getSelectedForCtrl(ctrlId);
    const tblNames = Object.keys(sel);
    if (tblNames.length === 0) return '';
    const firstTbl = tblNames[0];
    const firstFields = sel[firstTbl];
    const allFields = tblNames.flatMap(t => sel[t].map(f => `${tblNames.length > 1 ? t + '.' : ''}${f}`));
    const method = httpMethod.toUpperCase();

    // Find real FK join conditions from parsed relations
    const findJoin = (fromTbl, toTbl) => {
      const rel = (relations || []).find(r =>
        (r.from === fromTbl && r.to === toTbl) || (r.from === toTbl && r.to === fromTbl)
      );
      if (rel) return `${rel.from}.${rel.fromField} = ${rel.to}.${rel.toField}`;
      return null;
    };

    if (method === 'GET') {
      const cols = allFields.join(', ');
      if (tblNames.length === 1) return `SELECT ${cols}\nFROM ${firstTbl}\nLIMIT 0, 25`;
      const joins = tblNames.slice(1).map(t => {
        const cond = findJoin(firstTbl, t);
        return cond ? `JOIN ${t} ON ${cond}` : `-- JOIN ${t} (no FK relation found)`;
      }).join('\n  ');
      return `SELECT ${cols}\nFROM ${firstTbl}\n  ${joins}\nLIMIT 0, 25`;
    }
    if (method === 'POST') {
      const cols = firstFields.filter(f => f !== 'id').join(', ');
      const vals = firstFields.filter(f => f !== 'id').map(() => '?').join(', ');
      return `INSERT INTO ${firstTbl} (${cols})\nVALUES (${vals})`;
    }
    if (method === 'PUT' || method === 'PATCH') {
      const sets = firstFields.filter(f => f !== 'id').map(f => `${f} = ?`).join(',\n  ');
      return `UPDATE ${firstTbl}\nSET ${sets}\nWHERE id = ?`;
    }
    if (method === 'DELETE') {
      return `DELETE FROM ${firstTbl}\nWHERE id = ?`;
    }
    return '';
  };

  const applySQL = (ctrlId) => {
    const ctrl = controllers.find(c => c.id === ctrlId);
    if (!ctrl) return;
    const updated = {
      ...ctrl,
      methods: ctrl.methods.map(m => {
        const sql = generateSQL(ctrlId, m.httpMethod);
        return sql ? { ...m, query: sql } : m;
      })
    };
    handleSave(updated);
  };

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const handleSave = (c) => {
    const idx = controllers.findIndex(e => e.id === c.id);
    if (idx >= 0) onControllers(controllers.map((e, i) => i === idx ? c : e));
    else onControllers([...controllers, c]);
  };
  const handleDel = (id) => onControllers(controllers.filter(c => c.id !== id));

  const handleViewSave = (v) => {
    const idx = views.findIndex(e => e.id === v.id);
    if (idx >= 0) onViews(views.map((e, i) => i === idx ? v : e));
    else onViews([...views, v]);
  };
  const handleViewDel = (id) => onViews(views.filter(v => v.id !== id));

  // Build table lookup
  const tableMap = {};
  tables.forEach(t => { tableMap[t.name] = t; });

  // Clickable text that copies on click
  const Cp = ({ text, children, style: sx }) => {
    const k = text;
    return (
      <span onClick={e => { e.stopPropagation(); copyText(text, k); }}
        style={{ cursor: "pointer", position: "relative", ...sx }}
        title="Click to copy">
        {children || text}
        {copied === k && <span style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: "#34d399", fontFamily: "'JetBrains Mono'", fontWeight: 600, whiteSpace: "nowrap", background: "rgba(10,16,30,.95)", padding: "1px 6px", borderRadius: 4, border: "1px solid rgba(52,211,153,.3)", zIndex: 9999 }}>Copied!</span>}
      </span>
    );
  };

  // Collect all unique table names
  const allLinkedTables = new Set();
  controllers.forEach(c => c.methods?.forEach(m => (m.linkedTables || []).forEach(t => allLinkedTables.add(t))));

  return (
    <div style={{ minHeight: "100vh", background: "#06080f", userSelect: "none" }}>
      {/* Header */}
      <header style={{ padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(52,211,153,.08)", background: "rgba(6,8,15,.95)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Btn variant="ghost" onClick={onBack}>← Canvas</Btn>
          <div style={{ width: 1, height: 28, background: "rgba(255,255,255,.08)" }} />
          <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,#34d399,#10b981)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono'", fontWeight: 700, fontSize: 16, color: "#06080f" }}>C</div>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono'", fontWeight: 600, fontSize: 18 }}>Controllers <span style={{ color: "#34d399" }}>& Views</span></div>
            <div style={{ fontSize: 11, color: "#475569" }}>{controllers.length} controllers · {views.length} views · {allLinkedTables.size} linked tables</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" onClick={() => setShowAddView(true)} style={{ color: "#22d3ee", borderColor: "rgba(34,211,238,.3)" }}>+ View</Btn>
          <Btn variant="cyanSolid" onClick={() => setShowAddController(true)}>+ Controller</Btn>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {/* Empty state */}
        {controllers.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#475569" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 16, marginBottom: 8 }}>No controllers yet</div>
            <div style={{ fontSize: 13, color: "#334155", marginBottom: 24 }}>Create a controller to manage your API routes and table connections</div>
            <Btn variant="cyanSolid" onClick={() => setShowAddController(true)}>+ Create Controller</Btn>
          </div>
        )}

        {/* Controllers */}
        {controllers.map(ctrl => {
          const isOpen = expanded[ctrl.id];
          const linkedTableNames = new Set();
          const linkedViewNames = new Set();
          ctrl.methods?.forEach(m => {
            (m.linkedTables || []).forEach(t => linkedTableNames.add(t));
            (m.linkedViews || (m.linkedView ? [m.linkedView] : [])).forEach(v => linkedViewNames.add(v));
          });
          const ctrlTables = [...linkedTableNames].map(n => tableMap[n]).filter(Boolean);

          return (
            <div key={ctrl.id} style={{ marginBottom: 16, borderRadius: 14, border: "1px solid rgba(52,211,153,.15)", background: "rgba(255,255,255,.02)", overflow: "hidden" }}>
              {/* Header */}
              <div
                onClick={() => toggle(ctrl.id)}
                style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", background: isOpen ? "rgba(52,211,153,.04)" : "transparent", transition: "background .15s" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 14, color: isOpen ? "#34d399" : "#64748b", transition: "transform .2s", display: "inline-block", transform: isOpen ? "rotate(90deg)" : "none" }}>▸</span>
                  <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 600, fontSize: 15, color: "#e2e8f0" }}>{ctrl.name}</span>
                  <span style={{ fontSize: 11, color: "#475569", fontFamily: "'JetBrains Mono'" }}>{ctrl.methods?.length || 0} methods · {ctrlTables.length} tables</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {[...linkedTableNames].slice(0, 4).map(t => (
                    <span key={t} style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10, fontFamily: "'JetBrains Mono'", fontWeight: 500, background: "rgba(245,158,11,.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,.2)" }}>{t}</span>
                  ))}
                  {linkedTableNames.size > 4 && <span style={{ fontSize: 10, color: "#64748b" }}>+{linkedTableNames.size - 4}</span>}
                  <button onClick={e => { e.stopPropagation(); setEditingController(ctrl); }} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 14, padding: "2px 6px" }}>✎</button>
                </div>
              </div>

              {/* Expanded Content */}
              {isOpen && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}>
                  {/* Methods */}
                  <div style={{ padding: "12px 20px 8px", fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Methods</div>
                  {ctrl.methods?.map((m, mi) => {
                    const vNames = m.linkedViews || (m.linkedView ? [m.linkedView] : []);
                    return (
                      <div key={m.id || mi} style={{ padding: "8px 20px 8px 36px", borderBottom: "1px solid rgba(255,255,255,.03)", display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, fontWeight: 700, color: HTTP_COL[m.httpMethod] || '#94a3b8', background: `${HTTP_COL[m.httpMethod] || '#94a3b8'}15`, padding: "3px 8px", borderRadius: 5, minWidth: 42, textAlign: "center", flexShrink: 0 }}>{m.httpMethod}</span>
                        <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{m.name}</span>
                        <Cp text={m.route} style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: "#475569" }}>{m.route}</Cp>
                                                <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
                          {(m.linkedTables || []).map(t => (
                            <span key={t} style={{ padding: "2px 6px", borderRadius: 4, fontSize: 9, fontFamily: "'JetBrains Mono'", background: "rgba(245,158,11,.08)", color: "#f59e0b" }}>{t}</span>
                          ))}
                          {vNames.map(v => (
                            <span key={v} style={{ padding: "2px 6px", borderRadius: 4, fontSize: 9, fontFamily: "'JetBrains Mono'", background: "rgba(34,211,238,.08)", color: "#22d3ee" }}>{v}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {(!ctrl.methods || ctrl.methods.length === 0) && (
                    <div style={{ padding: "12px 36px", fontSize: 12, color: "#475569", fontStyle: "italic" }}>No methods</div>
                  )}

                  {/* Linked Tables — static cards */}
                  {ctrlTables.length > 0 && (() => {
                    const q = (tableSearch[ctrl.id] || '').toLowerCase();
                    const filtered = q ? ctrlTables.filter(t => t.name.toLowerCase().includes(q)) : ctrlTables;
                    return (
                    <div style={{ padding: "12px 20px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Linked Tables ({ctrlTables.length}){q && ` — ${filtered.length} found`}</div>
                        <input value={tableSearch[ctrl.id] || ''} onChange={e => setTableSearch(p => ({ ...p, [ctrl.id]: e.target.value }))} placeholder="Search table..." onClick={e => e.stopPropagation()}
                          style={{ width: 180, padding: "5px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", color: "#e2e8f0", fontFamily: "'JetBrains Mono'", fontSize: 11 }} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                        {filtered.map(table => {
                          const usedBy = ctrl.methods?.filter(m => (m.linkedTables || []).includes(table.name)) || [];
                          const selSet = selectedFields[ctrl.id]?.[table.name] || new Set();
                          const selCount = selSet.size;
                          const allSel = table.fields?.length > 0 && table.fields.every(f => selSet.has(f.name));
                          return (
                            <div key={table.name} style={{ borderRadius: 12, border: `1px solid ${selCount > 0 ? "rgba(52,211,153,.3)" : "rgba(255,255,255,.08)"}`, background: "rgba(10,16,30,.95)", overflow: "hidden" }}>
                              <div style={{ padding: "9px 12px", background: selCount > 0 ? "rgba(52,211,153,.04)" : "rgba(255,255,255,.03)", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span onClick={() => selectAllFields(ctrl.id, table.name, table.fields || [])} style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${allSel ? "#34d399" : "rgba(255,255,255,.2)"}`, background: allSel ? "#34d399" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#06080f", flexShrink: 0 }}>{allSel ? "✓" : ""}</span>
                                  <Cp text={table.name} style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, fontWeight: 600 }}>{table.name}</Cp>
                                  {selCount > 0 && <span style={{ fontSize: 9, color: "#34d399", fontFamily: "'JetBrains Mono'", fontWeight: 600 }}>{selCount} sel</span>}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                  {usedBy.map(m => (
                                    <span key={m.id} style={{ fontSize: 8, fontFamily: "'JetBrains Mono'", fontWeight: 700, color: HTTP_COL[m.httpMethod], background: `${HTTP_COL[m.httpMethod]}15`, padding: "1px 5px", borderRadius: 3 }}>{m.httpMethod}</span>
                                  ))}
                                </div>
                              </div>
                              {table.fields?.map((f, fi) => {
                                const tl = f.size ? `${f.type}(${f.size})` : f.type;
                                const isSel = selSet.has(f.name);
                                return (
                                  <div key={f.id || fi} onClick={() => toggleField(ctrl.id, table.name, f.name)} style={{ padding: "5px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: fi < table.fields.length - 1 ? "1px solid rgba(255,255,255,.03)" : "none", fontSize: 11, cursor: "pointer", background: isSel ? "rgba(52,211,153,.06)" : "transparent", borderLeft: `3px solid ${isSel ? "#34d399" : "transparent"}`, transition: "background .1s" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                      {(f.isPrimary || f.name === "id") ? <span style={{ color: "#f59e0b", fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono'", width: 18 }}>PK</span> : f.isForeign ? <span style={{ color: "#a78bfa", fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono'", width: 18 }}>FK</span> : <span style={{ width: 18 }} />}
                                      <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: isSel ? "#34d399" : f.isPrimary || f.name === "id" ? "#f59e0b" : f.isForeign ? "#a78bfa" : "#cbd5e1" }}>{f.name}</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                      {f.nullable && <span style={{ fontSize: 7, color: "#475569" }}>null</span>}
                                      <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 9, color: TC[f.type] || "#64748b", background: `${TC[f.type] || "#64748b"}12`, padding: "1px 6px", borderRadius: 4 }}>{tl}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                      {/* Generate SQL button */}
                      {Object.keys(getSelectedForCtrl(ctrl.id)).length > 0 && (
                        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                          <button onClick={() => applySQL(ctrl.id)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#34d399,#10b981)", color: "#06080f", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono'", boxShadow: "0 4px 16px rgba(52,211,153,.25)" }}>Generate SQL</button>
                          <span style={{ fontSize: 11, color: "#64748b" }}>
                            {(() => { const s = getSelectedForCtrl(ctrl.id); const count = Object.values(s).reduce((a, b) => a + b.length, 0); return `${count} fields from ${Object.keys(s).length} tables`; })()}
                          </span>
                        </div>
                      )}
                    </div>
                  ); })()}

                  {/* Linked Views */}
                  {linkedViewNames.size > 0 && (
                    <div style={{ padding: "0 20px 16px" }}>
                      <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 8 }}>Linked Views</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {[...linkedViewNames].map(vName => {
                          const v = views.find(vw => vw.name === vName);
                          return (
                            <div key={vName} onClick={() => v && setEditingView(v)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(34,211,238,.15)", background: "rgba(34,211,238,.04)", cursor: v ? "pointer" : "default" }}>
                              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, fontWeight: 600, color: "#22d3ee" }}>{vName}</div>
                              {v?.route && <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 9, color: "#475569", marginTop: 2 }}>{v.route}</div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SQL Queries */}
                  {ctrl.methods?.some(m => m.query) && (
                    <div style={{ padding: "0 20px 16px" }}>
                      <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 8 }}>Queries</div>
                      {ctrl.methods.filter(m => m.query).map((m, mi) => (
                        <div key={m.id || mi} style={{ marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono'", fontWeight: 700, color: HTTP_COL[m.httpMethod] }}>{m.httpMethod}</span>
                            <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono'", color: "#64748b" }}>{m.name}</span>
                                                      </div>
                          <Cp text={m.query}><pre style={{ padding: "6px 10px", borderRadius: 6, background: "rgba(0,0,0,.3)", border: "1px solid rgba(255,255,255,.04)", color: "#6ee7b7", fontFamily: "'JetBrains Mono'", fontSize: 10, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0, cursor: "pointer" }}>{m.query}</pre></Cp>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Views Section */}
        {views.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'JetBrains Mono'", fontSize: 16, fontWeight: 600, color: "#22d3ee", margin: 0 }}>Views</h2>
              <Btn variant="ghost" onClick={() => setShowAddView(true)} style={{ color: "#22d3ee", borderColor: "rgba(34,211,238,.3)" }}>+ View</Btn>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {views.map(v => (
                <div key={v.id} onClick={() => setEditingView(v)} style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(34,211,238,.15)", background: "rgba(255,255,255,.02)", cursor: "pointer", transition: "border-color .15s" }}>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 13, fontWeight: 600, color: "#22d3ee" }}>{v.name}</div>
                  <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", marginTop: 2 }}>{v.type} view</div>
                  {v.route && <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "#64748b", marginTop: 4 }}>{v.route}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 56, padding: "16px 0", borderTop: "1px solid rgba(255,255,255,.04)", color: "#334155", fontSize: 12 }}>
          ERD Builder v{VERSION} · {BUILD_DATE} · Developed by {DEVELOPER}
        </div>
      </div>

      {/* Modals */}
      {(showAddController || editingController) && (
        <ControllerModal
          controller={editingController}
          tables={tables}
          views={views}
          onClose={() => { setShowAddController(false); setEditingController(null); }}
          onSave={handleSave}
          onDelete={handleDel}
        />
      )}
      {(showAddView || editingView) && (
        <ViewModal
          view={editingView}
          onClose={() => { setShowAddView(false); setEditingView(null); }}
          onSave={handleViewSave}
          onDelete={handleViewDel}
        />
      )}
    </div>
  );
}

export default ControllerPage;
