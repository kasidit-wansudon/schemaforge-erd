import { useState } from 'react';
import ModalShell from '../ui/ModalShell';
import Btn from '../ui/Btn';
import { uid } from '../../utils/uid';

const HTTP = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const HTTP_COL = { GET: '#34d399', POST: '#38bdf8', PUT: '#f59e0b', PATCH: '#fb923c', DELETE: '#ef4444' };

function ControllerModal({ controller: edit, tables, views, onClose, onSave, onDelete }) {
  const isEdit = !!edit;
  const [name, setName] = useState(edit?.name || '');
  const [methods, setMethods] = useState(edit?.methods || [
    { id: uid(), name: 'index', httpMethod: 'GET', route: '/', query: 'SELECT * FROM ', linkedTables: [], linkedView: '' },
  ]);
  const [error, setError] = useState('');

  const addMethod = () => setMethods(p => [...p, { id: uid(), name: '', httpMethod: 'GET', route: '/', query: '', linkedTables: [], linkedView: '' }]);

  const toggleTable = (methodIdx, tableName) => {
    setMethods(p => p.map((m, i) => {
      if (i !== methodIdx) return m;
      const cur = m.linkedTables || [];
      const next = cur.includes(tableName) ? cur.filter(n => n !== tableName) : [...cur, tableName];
      const u = { ...m, linkedTables: next };
      // Auto-fill query based on selected tables
      if (next.length === 1) {
        if (m.httpMethod === 'GET') u.query = `SELECT * FROM ${next[0]}`;
        else if (m.httpMethod === 'POST') u.query = `INSERT INTO ${next[0]} (...) VALUES (...)`;
        else if (m.httpMethod === 'PUT' || m.httpMethod === 'PATCH') u.query = `UPDATE ${next[0]} SET ... WHERE id = ?`;
        else if (m.httpMethod === 'DELETE') u.query = `DELETE FROM ${next[0]} WHERE id = ?`;
      } else if (next.length > 1) {
        const joins = next.slice(1).map(t => `JOIN ${t} ON ${next[0]}.${t.replace(/s$/, '')}_id = ${t}.id`).join('\n  ');
        u.query = `SELECT *\n  FROM ${next[0]}\n  ${joins}`;
      } else {
        u.query = '';
      }
      return u;
    }));
  };

  const updateMethod = (idx, key, val) => {
    setMethods(p => p.map((m, i) => {
      if (i !== idx) return m;
      const u = { ...m, [key]: val };
      if (key === 'name' && val) {
        const base = name ? `/${name.toLowerCase().replace(/controller$/i, '').replace(/\s+/g, '-')}` : '';
        if (val === 'index') u.route = `${base}`;
        else if (val === 'show') u.route = `${base}/:id`;
        else if (val === 'store' || val === 'create') u.route = `${base}`;
        else if (val === 'update') u.route = `${base}/:id`;
        else if (val === 'destroy' || val === 'delete') u.route = `${base}/:id`;
        else u.route = `${base}/${val}`;
      }
      return u;
    }));
  };

  const removeMethod = (idx) => setMethods(p => p.filter((_, i) => i !== idx));

  const submit = () => {
    if (!name.trim()) { setError('Controller name is required'); return; }
    onSave({
      id: edit?.id || uid(),
      name: name.trim(),
      methods: methods.filter(m => m.name.trim()),
      x: edit?.x ?? 200,
      y: edit?.y ?? 200,
    });
    onClose();
  };

  return (
    <ModalShell title={isEdit ? `✎ Edit Controller` : `+ New Controller`} onClose={onClose} width={780}>
      <div style={{ padding: 20 }}>
        {/* Name */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>Controller Name</label>
          <input value={name} onChange={e => { setName(e.target.value); setError(''); }}
            placeholder="e.g. UserController, ProductController"
            style={{ width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontFamily: "'JetBrains Mono'", fontSize: 13, boxSizing: "border-box" }} />
          {error && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{error}</div>}
        </div>

        {/* Methods */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>Methods ({methods.length})</span>
          <Btn variant="cyan" size="sm" onClick={addMethod}>+ Method</Btn>
        </div>

        <div style={{ maxHeight: 420, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          {methods.map((m, i) => (
            <div key={m.id} style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,.02)", border: `1px solid ${HTTP_COL[m.httpMethod]}25` }}>
              {/* Row 1: method name, HTTP, route */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 1fr 30px", gap: 8, marginBottom: 8 }}>
                <input value={m.name} onChange={e => updateMethod(i, 'name', e.target.value)} placeholder="method name"
                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,.08)", borderRadius: 6, padding: "6px 10px", color: "#e2e8f0", fontFamily: "'JetBrains Mono'", fontSize: 12 }} />
                <select value={m.httpMethod} onChange={e => updateMethod(i, 'httpMethod', e.target.value)}
                  style={{ background: "#0a0e1a", border: "1px solid rgba(255,255,255,.08)", borderRadius: 6, padding: "6px 6px", color: HTTP_COL[m.httpMethod], fontFamily: "'JetBrains Mono'", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  {HTTP.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <input value={m.route} onChange={e => updateMethod(i, 'route', e.target.value)} placeholder="/route"
                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,.08)", borderRadius: 6, padding: "6px 10px", color: "#94a3b8", fontFamily: "'JetBrains Mono'", fontSize: 11 }} />
                <button onClick={() => removeMethod(i)}
                  style={{ background: "rgba(239,68,68,.08)", border: "none", color: "#ef4444", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>×</button>
              </div>
              {/* Row 2: linked tables (multiselect), linked view */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 1 }}>Tables (DB) — click to select</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                    {tables.map(t => {
                      const sel = (m.linkedTables || []).includes(t.name);
                      return (
                        <button key={t.name} onClick={() => toggleTable(i, t.name)}
                          style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10, fontFamily: "'JetBrains Mono'", fontWeight: sel ? 600 : 400, cursor: "pointer", border: sel ? "1px solid rgba(245,158,11,.5)" : "1px solid rgba(255,255,255,.08)", background: sel ? "rgba(245,158,11,.12)" : "rgba(255,255,255,.02)", color: sel ? "#f59e0b" : "#64748b", transition: "all .1s" }}>
                          {sel && "✓ "}{t.name}
                        </button>
                      );
                    })}
                    {tables.length === 0 && <span style={{ fontSize: 10, color: "#475569", fontStyle: "italic" }}>No tables yet</span>}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 1 }}>View</label>
                  <select value={m.linkedView} onChange={e => updateMethod(i, 'linkedView', e.target.value)}
                    style={{ width: "100%", background: "#0a0e1a", border: "1px solid rgba(255,255,255,.08)", borderRadius: 6, padding: "6px 8px", color: m.linkedView ? "#22d3ee" : "#475569", fontFamily: "'JetBrains Mono'", fontSize: 11, cursor: "pointer", marginTop: 4 }}>
                    <option value="">— none —</option>
                    {views.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                  </select>
                </div>
              </div>
              {/* Row 3: SQL query */}
              <textarea value={m.query} onChange={e => updateMethod(i, 'query', e.target.value)} placeholder="SQL query..." spellCheck={false}
                style={{ width: "100%", minHeight: 48, padding: "8px 10px", background: "#080c18", border: "1px solid rgba(255,255,255,.06)", borderRadius: 6, resize: "vertical", color: "#6ee7b7", fontFamily: "'JetBrains Mono'", fontSize: 11, lineHeight: 1.6, boxSizing: "border-box" }} />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ marginTop: 20, display: "flex", justifyContent: isEdit ? "space-between" : "flex-end" }}>
          {isEdit && <Btn variant="danger" onClick={() => { onDelete(edit.id); onClose(); }}>🗑 Delete</Btn>}
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn variant="cyanSolid" onClick={submit} style={{ padding: "10px 28px", fontSize: 14 }}>{isEdit ? 'Save' : 'Create'}</Btn>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

export default ControllerModal;
